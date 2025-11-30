const express = require('express');
const router = express.Router();
const messageDb = require('../database/actions/messageActions.js');
const userDb = require('../database/actions/userActions.js'); // currently unused but fine
const restrictedCheck = require('./helpers/helpers.js').restricted;

// 🔹 NEW: Mongo analytics model
const MongoMessage = require('../mongoModels/Message');

// GET /messages/:id  (get conversation with user :id)
router.get('/:id', restrictedCheck, async (req, res) => {
  try {
    const toId = req.params.id;
    const userId = req.session.user.id;

    const conversation = await messageDb.getConversation(userId, toId);
    return res.status(200).json(conversation['rows']);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Failed to load conversation' });
  }
});

// GET /messages/:id/feed  (subscribe via LISTEN/NOTIFY)
router.get('/:id/feed', restrictedCheck, async (req, res) => {
  try {
    const listen = messageDb.listenConversation();
    return res.status(200).json({ Message: 'subscribe' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// POST /messages  (send a new message)
router.post('/', restrictedCheck, async (req, res) => {
  try {
    console.log('in post');
    const { toId, message } = req.body;
    const userId = req.session.user.id;

    // ensure users are friends before sending
    const friendCheck = await messageDb.friendCheck(userId, toId);

    if (friendCheck['rows'][0]['isfriend'] === true) {
      // Insert into Postgres (source of truth)
      const sendMessage = await messageDb.addMessage(userId, toId, message);

      // ⚠️ Assumes addMessage returns rows[0] with:
      // id, time_stp, message, to_id, from_id
      // If it doesn't, tweak addMessage to use
      //   RETURNING id, time_stp, message, to_id, from_id
      const pgMessage = sendMessage && sendMessage.rows
        ? sendMessage.rows[0]
        : null;

      // Mirror into Mongo for analytics
      // Fallbacks ensure we don't crash if pgMessage is null
      const time_stp =
        pgMessage && pgMessage.time_stp
          ? pgMessage.time_stp
          : new Date();

      const pgId = pgMessage && pgMessage.id ? pgMessage.id : undefined;

      await MongoMessage.create({
        pgId: pgId,
        time_stp,
        message,
        from_pg_id: userId,
        to_pg_id: toId,
      });

      console.log(message);
      return res.status(201).json('success');
    }

    return res.status(500).json('error');
  } catch (err) {
    console.log(err);
    return res.status(500).json('error');
  }
});

// DELETE /messages  (delete whole conversation)
router.delete('/', restrictedCheck, async (req, res) => {
  try {
    const { toId } = req.body;
    // ❗ you had const {userId} = req.session.user;
    // but everywhere else it's req.session.user.id
    const userId = req.session.user.id;

    // Delete from Postgres
    const deleteConversation = await messageDb.deleteConversation(
      userId,
      toId
    );

    // 🔹 Optional: mirror deletion in Mongo so analytics match
    await MongoMessage.deleteMany({
      $or: [
        { from_pg_id: userId, to_pg_id: toId },
        { from_pg_id: toId, to_pg_id: userId },
      ],
    });

    return res.status(204).json(deleteConversation);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

module.exports = router;
