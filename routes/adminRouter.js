// routes/admin.js
const express = require("express");
const router = express.Router();

const restrictedCheck = require("./helpers/helpers.js").restricted;

const MongoUser = require("../mongoModels/User");
const MongoMessage = require("../mongoModels/Message");
const MongoFriend = require("../mongoModels/Friend");

// 🔹 Optional: extra guard so only "admin" users access this
// Adapt this to match however you store roles in req.session.user
function requireAdmin(req, res, next) {
  const user = req.session.user;
  // Example: if you add a boolean isAdmin or role field on the user session
  if (!user || (!user.isAdmin && user.role !== "admin")) {
    return res.status(403).json({ error: "Forbidden: admin only" });
  }
  next();
}

// You can wrap all routes with both restrictedCheck + requireAdmin
router.use(restrictedCheck, requireAdmin);

/**
 * GET /api/admin/overview
 *
 * High-level stats:
 *  - Total users
 *  - Active users in last 24h (by lastLoginAt)
 *  - Total messages
 *  - Messages in last 24h (by time_stp)
 *  - Confirmed friend links
 */
router.get("/overview", async (req, res) => {
  try {
    const now = Date.now();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeLast24h,
      totalMessages,
      messagesLast24h,
      confirmedFriends,
      pendingFriends,
    ] = await Promise.all([
      MongoUser.countDocuments(),
      MongoUser.countDocuments({ lastLoginAt: { $gte: last24h } }),
      MongoMessage.countDocuments(),
      MongoMessage.countDocuments({ time_stp: { $gte: last24h } }),
      MongoFriend.countDocuments({ confirmed: true }),
      MongoFriend.countDocuments({ confirmed: false, pending: true }),
    ]);

    res.json({
      totalUsers,
      activeLast24h,
      totalMessages,
      messagesLast24h,
      confirmedFriends,
      pendingFriends,
    });
  } catch (err) {
    console.error("Admin /overview error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/admin/messages-per-day?days=7
 *
 * Returns an array like:
 *  [
 *    { date: "2025-11-20", count: 42 },
 *    { date: "2025-11-21", count: 51 },
 *    ...
 *  ]
 */
router.get("/messages-per-day", async (req, res) => {
  try {
    const days = parseInt(req.query.days || "7", 10);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const result = await MongoMessage.aggregate([
      { $match: { time_stp: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: "$time_stp" },
            month: { $month: "$time_stp" },
            day: { $dayOfMonth: "$time_stp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const formatted = result.map((r) => ({
      date: `${r._id.year}-${String(r._id.month).padStart(2, "0")}-${String(
        r._id.day
      ).padStart(2, "0")}`,
      count: r.count,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Admin /messages-per-day error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/admin/top-senders?limit=5
 *
 * Returns:
 *  [
 *    { pgId, username, email, count },
 *    ...
 *  ]
 */
router.get("/top-senders", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "5", 10);

    // Group by from_pg_id
    const grouped = await MongoMessage.aggregate([
      {
        $group: {
          _id: "$from_pg_id",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    const senderIds = grouped.map((g) => g._id).filter(Boolean);

    // Lookup sender user docs from MongoUser by pgId
    const users = await MongoUser.find({ pgId: { $in: senderIds } }).lean();
    const userByPgId = Object.fromEntries(
      users.map((u) => [u.pgId, u])
    );

    const result = grouped.map((g) => {
      const u = userByPgId[g._id] || {};
      return {
        pgId: g._id,
        username: u.user_name || "(unknown)",
        email: u.email || null,
        count: g.count,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Admin /top-senders error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/admin/recent-users?limit=10
 *
 * Returns list of latest registered users.
 */
router.get("/recent-users", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "10", 10);

    const users = await MongoUser.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("pgId first_name last_name user_name email createdAt lastLoginAt")
      .lean();

    res.json(users);
  } catch (err) {
    console.error("Admin /recent-users error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/admin/recent-messages?limit=10
 *
 * Returns list of recent messages with sender/receiver username if available.
 */
module.exports = router;
