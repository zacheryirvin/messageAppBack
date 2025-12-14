const { query } = require("./query.js");
const faker = require("faker");
const { hashPassword } = require("../database/helpers/bcryptHelpers.js");


const seedAdminUser = async () => {
  const objectPass = { password: "test" };
  const hash = await hashPassword(objectPass);

  await query(`
    INSERT INTO users (first_name, last_name, user_name, email, password, is_admin)
    VALUES ($1, $2, $3, $4, $5, true)
    ON CONFLICT (user_name) DO NOTHING
  `, [
    "Admin",
    "User",
    "admin",
    "admin@test.com",
    hash
  ]);

  console.log("✅ Admin user seeded (username: admin / password: admin123)");
}


const insertUsers = async () => {
  for (let i = 0; i < 100; i++) {
    const objectPass = { password: "test" };
    const hash = await hashPassword(objectPass);

    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const userName = faker.internet.userName();
    const email = faker.internet.email();

    await query(
      `
      INSERT INTO users(first_name, last_name, user_name, email, password)
      VALUES($1, $2, $3, $4, $5)
      `,
      [firstName, lastName, userName, email, hash]
    );
  }
};

const insertFriends = async () => {
  const usersRes = await query(`SELECT id FROM users`);
  const users = usersRes.rows;

  for (let j = 0; j < users.length; j++) {
    const index = Math.floor(Math.random() * users.length);
    const secIndex = Math.floor(Math.random() * users.length);

    if (index === secIndex) continue;

    const userId = users[index].id;
    const toId = users[secIndex].id;

    await query(
      `
      INSERT INTO friends(user_id, friend_id, pending, confirmed, requester)
      VALUES
        ($1, $2, false, true, true),
        ($2, $1, false, true, false)
      ON CONFLICT (user_id, friend_id) DO NOTHING
      `,
      [userId, toId]
    );
  }
};

const insertMessages = async () => {
  let usersRes = await query(`SELECT * FROM users`);
  const users = usersRes.rows;

  for (let j = 0; j < 2000; j++) {
    const index = Math.floor(Math.random() * users.length);
    const userId = users[index].id;

    let friendsRes = await query(
      `
      SELECT friend_id FROM friends
      WHERE user_id = $1
      `,
      [userId]
    );

    const friends = friendsRes.rows;

    if (friends.length > 0) {
      const fIndex = Math.floor(Math.random() * friends.length);
      const randomFriend = friends[fIndex].friend_id;
      let message = faker.lorem.sentences();
      if(message.length > 250) {
	message = message.slice(0, 250);
      }

      await query(
        `
        INSERT INTO messages(message, to_id, from_id)
        VALUES($1, $2, $3)
        `,
        [message, randomFriend, userId]
      );
    }
  }
};

const runAll = async () => {
  try {
    await seedAdminUser()
    await insertUsers();
    await insertFriends();
    await insertMessages();
    console.log("✅ Seeding complete");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  }
};

runAll();
