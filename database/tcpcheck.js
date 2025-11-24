const net = require("net");

const s = net.createConnection({ host: "127.0.0.1", port: 5432, timeout: 5000 });

s.on("connect", () => {
  console.log("✅ raw TCP connected");
  s.end();
});

s.on("timeout", () => console.log("❌ raw TCP timeout"));
s.on("error", (e) => console.log("❌ raw TCP error:", e.message));
