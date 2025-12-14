require("dotenv").config();

const connectMongo = require("./mongo");
const { query } = require("./query");

// IMPORTANT: use the actual filenames on disk (your folder has lowercase names)
const MongoUser = require("./mongoModels/user");
const MongoFriend = require("./mongoModels/friend");
const MongoMessage = require("./mongoModels/message");

async function wipeMongoAnalytics() {
  await Promise.all([
    MongoUser.deleteMany({}),
    MongoFriend.deleteMany({}),
    MongoMessage.deleteMany({}),
  ]);
  console.log("✅ Cleared Mongo analytics collections");
}

async function syncUsers() {
  const res = await query(`SELECT id, first_name, last_name, user_name, email FROM users`);
  const users = res.rows;

  if (!users.length) return;

  const ops = users.map((u) => ({
    updateOne: {
      filter: { pgId: u.id },
      update: {
        $set: {
          pgId: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          user_name: u.user_name,
          email: u.email,
        },
      },
      upsert: true,
    },
  }));

  await MongoUser.bulkWrite(ops, { ordered: false });
  console.log(`✅ Synced users: ${users.length}`);
}

async function syncFriends() {
  const res = await query(`
    SELECT user_id, friend_id, pending, confirmed, requester
    FROM friends
  `);
  const friends = res.rows;

  if (!friends.length) return;

  // Your friend model stores pg ids as strings: user_pg_id / friend_pg_id
  const ops = friends.map((f) => ({
    updateOne: {
      filter: { user_pg_id: f.user_id, friend_pg_id: f.friend_id },
      update: {
        $set: {
          user_pg_id: f.user_id,
          friend_pg_id: f.friend_id,
          pending: f.pending,
          confirmed: f.confirmed,
          requester: f.requester,
        },
      },
      upsert: true,
    },
  }));

  await MongoFriend.bulkWrite(ops, { ordered: false });
  console.log(`✅ Synced friends: ${friends.length}`);
}

async function syncMessages() {
  const res = await query(`
    SELECT id, time_stp, message, to_id, from_id
    FROM messages
  `);
  const messages = res.rows;

  if (!messages.length) return;

  const ops = messages.map((m) => ({
    updateOne: {
      filter: { pgId: m.id },
      update: {
        $set: {
          pgId: m.id,
          time_stp: new Date(m.time_stp),
          message: m.message,
          from_pg_id: m.from_id,
          to_pg_id: m.to_id,
        },
      },
      upsert: true,
    },
  }));

  await MongoMessage.bulkWrite(ops, { ordered: false });
  console.log(`✅ Synced messages: ${messages.length}`);
}

(async function run() {
  try {
    await connectMongo();

    // wipe + resync so both DBs match exactly
    await wipeMongoAnalytics();
    await syncUsers();
    await syncFriends();
    await syncMessages();

    console.log("✅ Mongo analytics now matches Postgres");
    process.exit(0);
  } catch (err) {
    console.error("❌ Resync failed:", err.message);
    console.error(err);
    process.exit(1);
  }
})();
