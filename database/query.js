require("dotenv").config();
const pool = require("./config.js");
const Pusher = require("pusher");

const query = async (text, values) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(text, values);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
    //    return err;
  } finally {
    await client.release();
  }
};

const messageQuery = async () => {
  const pusher = new Pusher({
    appId: process.env.PH_APPID,
    key: process.env.PH_KEY,
    secret: process.env.PH_SECRET,
    cluster: process.env.PH_CLUSTER,
    useTLS: true
  });
  const client = await pool.connect((err, client) => {
    if (err) {
      console.log(err);
    }

    client.on("notification", (msg) => {
      pusher.trigger("watch_messages", "new_record", JSON.parse(msg.payload));
    });
    const query = client.query("listen watch_messages");
  });
};

module.exports = {
  query,
  messageQuery,
};
