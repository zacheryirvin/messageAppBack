const { Client } = require("pg");

const client = new Client({
  host: "localhost",      // still set host for logging
  hostaddr: "127.0.0.1",  // forces direct IPv4 socket connect
  port: 5432,
  user: "zach",
  password: "test",
  database: "messaging_app",
  ssl: false,
  connectionTimeoutMillis: 5000,
});

(async () => {
  try {
    await client.connect();
    const r = await client.query("SELECT NOW()");
    console.log("✅ DB OK:", r.rows[0]);
  } catch (e) {
    console.error("❌ DB FAIL:", e);
  } finally {
    try { await client.end(); } catch {}
  }
})()
