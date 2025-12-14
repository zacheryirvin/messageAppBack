const { execSync } = require("child_process");

function run(cmd) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

try {
  // Rebuild Postgres schema
  run("node database/dbcreation.js");

  // Seed Postgres data
  run("node database/seeds.js");

  // Copy PG ➜ Mongo analytics
  run("node database/resyncMongoFromPostgres.js");

  console.log("\n✅ Full reseed complete (Postgres + Mongo aligned)");
} catch (err) {
  console.error("\n❌ reseedAll failed");
  process.exit(1);
}
