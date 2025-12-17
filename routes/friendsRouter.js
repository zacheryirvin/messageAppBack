const express = require("express");
const router = express.Router();
const friendsDb = require("../database/actions/friendsActions.js");
const restrictedCheck = require("./helpers/helpers.js").restricted;

// 🔹 NEW: Mongo analytics model
const MongoFriend = require("../database/mongoModels/friend.js");

// GET /friends  – list current user's friends (PG only)
router.get("/", restrictedCheck, async (req, res) => {
  try {
    const id = req.session.user.id;
    const friends = await friendsDb.getFriends(id);
    return res.status(200).json(friends["rows"]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to get friends" });
  }
});

// POST /friends/add  – send a friend request
router.post("/add", restrictedCheck, async (req, res) => {
  try {
    const { toId } = req.body;
    const id = req.session.user.id;

    // Insert into Postgres (source of truth)
    const requestFriend = await friendsDb.addFriend(id, toId);
    // requestFriend may or may not have rows; we don’t strictly need them,
    // because we know the logical state: pending + not confirmed yet.

    // Mirror into Mongo for analytics:
    // user_pg_id = current user, friend_pg_id = target
    await MongoFriend.findOneAndUpdate(
      { user_pg_id: id, friend_pg_id: toId },
      {
        user_pg_id: id,
        friend_pg_id: toId,
        pending: true,
        confirmed: false,
        requester: true, // current user initiated
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json(requestFriend);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to add friend" });
  }
});

// POST /friends/confirm  – accept a friend request
router.post("/confirm", restrictedCheck, async (req, res) => {
  try {
    const { toId } = req.body;
    const id = req.session.user.id;

    // Update Postgres first
    const confirmFriend = await friendsDb.confirmFriend(id, toId);

    // Mirror to Mongo: relationship as seen from current user
    await MongoFriend.findOneAndUpdate(
      { user_pg_id: id, friend_pg_id: toId },
      {
        user_pg_id: id,
        friend_pg_id: toId,
        pending: false,
        confirmed: true,
        // requester is ambiguous here; if your PG schema stores it, you
        // could fetch it first. For analytics, it’s okay to leave as-is.
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // 🔹 Optional: also update the reverse direction so both sides are marked as confirmed
    await MongoFriend.findOneAndUpdate(
      { user_pg_id: toId, friend_pg_id: id },
      {
        user_pg_id: toId,
        friend_pg_id: id,
        pending: false,
        confirmed: true,
        // requester for this direction might be false; again, for analytics
        // it’s often enough to just know they’re confirmed.
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({ Message: "Friend Confirmed" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to confirm friend" });
  }
});

// DELETE /friends  – remove one or more friends
router.delete("/", restrictedCheck, async (req, res) => {
  try {
    const { toId } = req.body; // expecting array
    const id = req.session.user.id;

    // Delete in Postgres
    if (Array.isArray(toId)) {
      for (const x of toId) {
        await friendsDb.deleteFriend(id, x);
      }
    } else if (toId) {
      await friendsDb.deleteFriend(id, toId);
    }

    // Mirror deletion in Mongo: remove both directions
    const targets = Array.isArray(toId) ? toId : [toId];

    await MongoFriend.deleteMany({
      $or: targets.flatMap((friendId) => [
        { user_pg_id: id, friend_pg_id: friendId },
        { user_pg_id: friendId, friend_pg_id: id },
      ]),
    });

    return res.status(200).json({ Message: "Friends deleted" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to delete friends" });
  }
});

// GET /friends/suggestions  – suggestions (PG only; no need to mirror)
router.get("/suggestions", restrictedCheck, async (req, res) => {
  try {
    const id = req.session.user.id;
    const limit = Number(10);

    // pass limit if your db function supports it
    const suggestions = await friendsDb.getFriendSuggestions(id, limit);
     console.log(suggestions);

    return res.status(200).json(suggestions.rows);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});


module.exports = router;
