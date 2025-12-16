require("dotenv").config();
const { pool, listenClient } = require("./config.js");
const Pusher = require("pusher");

// Create pusher once (not per reconnect)
const pusher = new Pusher({
  appId: process.env.PH_APPID,
  key: process.env.PH_KEY,
  secret: process.env.PH_SECRET,
  cluster: process.env.PH_CLUSTER,
  useTLS: true,
});

// Normal queries: use pool directly
const query = (text, values) => pool.query(text, values);

// Listener state guards
let listenerStarted = false;

const messageQuery = async () => {
  if (listenerStarted) {
    console.log("ℹ️ PG listener already started");
    return;
  }
  listenerStarted = true;

  const startListener = async () => {
    try {
      // connect() returns void; do NOT assign it
      await listenClient.connect();

      // Attach handlers BEFORE/AFTER connect is fine, but do it once
      listenClient.on("notification", (msg) => {
        console.log("🟡 PG notify received");
        console.log("🟡 channel:", msg.channel);
        console.log("🟡 raw payload:", msg.payload);

        let payload;
        try {
          payload = msg.payload ? JSON.parse(msg.payload) : {};
        } catch (e) {
          console.log("❌ JSON parse failed, using raw payload");
          payload = { raw: msg.payload };
        }

        pusher.trigger("watch_messages", "new_record", payload, (err) => {
          if (err) console.log("❌ trigger error:", err);
          else console.log("✅ pusher triggered new_record");
        });
      });

      listenClient.on("error", async (err) => {
        console.error("❌ PG listener error:", err);

        // IMPORTANT: Client has no release(). Use end(), then reconnect.
        try {
          await listenClient.end();
        } catch {}

        // allow restart
        listenerStarted = false;

        setTimeout(() => {
          messageQuery().catch(console.error);
        }, 2000);
      });

      await listenClient.query("LISTEN watch_messages");
      console.log("✅ Listening on Postgres channel watch_messages");
    } catch (err) {
      console.error("❌ Failed to start PG listener:", err);

      // If connect/query failed, close and retry
      try {
        await listenClient.end();
      } catch {}

      listenerStarted = false;

      setTimeout(() => {
        messageQuery().catch(console.error);
      }, 2000);
    }
  };

  await startListener();
};

module.exports = { query, messageQuery };
