require("dotenv").config();
const server = require("./server.js");
const connectMongo = require("./database/mongo.js");

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectMongo();          // connect Mongo once at startup
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
})();
