const express = require('express');
const router = express.Router();
const messageDb = require('../database/actions/messageActions.js');
const userDb = require('../database/actions/userActions.js'); // currently unused but fine
const restrictedCheck = require('./helpers/helpers.js').restricted;
const usersDb = require('../database/actions/userActions.js');
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let BOT_ID_CACHE = null;

async function getBotId() {
  if (BOT_ID_CACHE) return BOT_ID_CACHE;
  const botName = process.env.BOT_USERNAME || "chatbot";
  const res = await usersDb.getUser(botName);
  const bot = res.rows[0];
  if (!bot) throw new Error(`Bot user '${botName}' not found`);
  BOT_ID_CACHE = bot.id;
  return BOT_ID_CACHE;
}


// 🔹 NEW: Mongo analytics model
const MongoMessage = require('../database/mongoModels/message');

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
    const { toId, message } = req.body;
    const userId = req.session.user.id;

    const friendCheck = await messageDb.friendCheck(userId, toId);
    const isFriend = friendCheck?.rows?.[0]?.isfriend === true;

    if (!isFriend) {
      return res.status(403).json({ error: "Users are not friends" });
    }

    // Insert into Postgres
    const sendMessage = await messageDb.addMessage(userId, toId, message);
    const pgMessage = sendMessage?.rows?.[0];

    // Mirror into Mongo
    await MongoMessage.create({
      pgId: pgMessage?.id,
      time_stp: pgMessage?.time_stp || new Date(),
      message,
      from_pg_id: userId,
      to_pg_id: toId,
    });


    // If messaging the bot, generate and insert bot reply

    // Normal (non-bot) message
    return res.status(201).json({ status: "success" });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message || "error" });
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
