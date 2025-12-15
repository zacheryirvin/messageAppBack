require("dotenv").config();
const pool = require("./config.js");
const Pusher = require("pusher");

const query = async (text, values) => {
  const client = await pool.connect();
  try {
    // Only wrap in a transaction if you truly need it.
    // BEGIN/COMMIT around every query can hurt and can break LISTEN patterns.
    const result = await client.query(text, values);
    return result;
  } finally {
    client.release();
  }
};

let listenerClient = null;

const messageQuery = async () => {
  // ✅ Create pusher once
  const pusher = new Pusher({
    appId: process.env.PH_APPID,
    key: process.env.PH_KEY,
    secret: process.env.PH_SECRET,
    cluster: process.env.PH_CLUSTER,
    useTLS: true,
  });

  const startListener = async () => {
    try {
      listenerClient = await pool.connect();

      listenerClient.on("notification", async (msg) => {
        try {
          const payload = JSON.parse(msg.payload);

          await pusher.trigger("watch_messages", "new_record", payload);
          console.log("✅ Pusher triggered new_record");
        } catch (e) {
          console.error("❌ Pusher trigger/parse failed:", e);
        }
      });

      listenerClient.on("error", (err) => {
        console.error("❌ PG listener error:", err);
        // force reconnect
        try { listenerClient.release(); } catch {}
        listenerClient = null;
        setTimeout(startListener, 2000);
      });

      await listenerClient.query("LISTEN watch_messages");
      console.log("✅ Listening on Postgres channel watch_messages");
    } catch (err) {
      console.error("❌ Failed to start PG listener:", err);
      // retry
      setTimeout(startListener, 2000);
    }
  };

  // Start it
  await startListener();
};

module.exports = { query, messageQuery };
