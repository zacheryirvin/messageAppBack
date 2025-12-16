require("dotenv").config();
const {pool, listenClient} = require("./config.js");
const Pusher = require("pusher");

const query = async (text, values) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, values);
    return result;
  } finally {
    client.release();
  }
};

let listenClient = null;

const messageQuery = async () => {
  const pusher = new Pusher({
    appId: process.env.PH_APPID,
    key: process.env.PH_KEY,
    secret: process.env.PH_SECRET,
    cluster: process.env.PH_CLUSTER,
    useTLS: true,
  });

  const startListener = async () => {
    try {
      // If we already have a listener client, don't create a new one
      if (listenClient) return;

      listenClient = await listenClient.connect();

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
          if (err) {
            console.log("❌ trigger error:", err);
          } else {
            console.log("✅ pusher triggered new_record");
          }
        });
      });

      listenClient.on("error", (err) => {
        console.error("❌ PG listener error:", err);
        try {
          listenClient.release();
        } catch {}
        listenClient = null;
        setTimeout(startListener, 2000);
      });

      await listenClient.query("LISTEN watch_messages");
      console.log("✅ Listening on Postgres channel watch_messages");
    } catch (err) {
      console.error("❌ Failed to start PG listener:", err);
      try {
        if (listenClient) listenClient.release();
      } catch {}
      listenClient = null;
      setTimeout(startListener, 2000);
    }
  };

  await startListener();
};

module.exports = { query, messageQuery };
