const express = require("express");
const usersDb = require("../database/actions/userActions.js");
const friendsDb = require("../database/actions/friendsActions.js");
const router = express.Router();

const hashPassword = require("../database/helpers/bcryptHelpers.js").hashPassword;
const login = require("./helpers/helpers.js").login;
const restrictedCheck = require("./helpers/helpers.js").restricted;

// 🔹 Mongo analytics model
const MongoUser = require("../database/mongoModels/user");

// POST /users/register
router.post("/register", async (req, res) => {
  const newUser = req.body;

  if (!(newUser.first_name && newUser.last_name && newUser.user_name && newUser.password && newUser.email)) {
    return res
      .status(400)
      .json({ Error: "Username, email, and password are required" });
  }

  try {
    // hash password
    const hash = await hashPassword(newUser);
    newUser.password = hash;

    // create user in Postgres (source of truth)
    await usersDb.addUser(newUser);

    // fetch full PG user row (includes id)
    const user_data = await usersDb.getUser(newUser.user_name);
    console.log(user_data);
    const pgUser = user_data.rows[0];

    if (!pgUser) {
      return res.status(500).json({ error: "User creation failed" });
    }

    // 🔹 Mirror this user into Mongo
    await MongoUser.findOneAndUpdate(
      { pgId: pgUser.id },
      {
        pgId: pgUser.id,
        first_name: pgUser.first_name,
        last_name: pgUser.last_name,
        user_name: pgUser.user_name,
        email: pgUser.email,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ---- Chatbot auto-friend ----
    const botName = process.env.BOT_USERNAME || "chatbot";
    const bot_data = await usersDb.getUser(botName);
    const botUser = bot_data.rows[0];

    if (!botUser) {
      // If bot is missing, don't hard-fail registration—return success but warn
      return res.status(201).json({
        Message: "User created, but chatbot user not found. Seed chatbot in Postgres.",
        user: pgUser,
      });
    }

    // Mirror chatbot into Mongo (optional)
    await MongoUser.findOneAndUpdate(
      { pgId: botUser.id },
      {
        pgId: botUser.id,
        first_name: botUser.first_name,
        last_name: botUser.last_name,
        user_name: botUser.user_name,
        email: botUser.email,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Create friendship BOTH directions, then confirm BOTH directions
    // (Some schemas require two rows. If yours only needs one, it will still be safe if you have ON CONFLICT in DB)
    await friendsDb.addFriend(pgUser.id, botUser.id);
    await friendsDb.addFriend(botUser.id, pgUser.id);

    await friendsDb.confirmFriend(pgUser.id, botUser.id);
    await friendsDb.confirmFriend(botUser.id, pgUser.id);

    return res.status(201).json({ Message: "User created", user: pgUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// POST /users/login
router.post("/login", login, async (req, res) => {
  try {
    const sessionUser = req.session.user;

    // Upsert login event to Mongo (analytics)
    await MongoUser.findOneAndUpdate(
      { pgId: sessionUser.id },
      {
        pgId: sessionUser.id,
        first_name: sessionUser.first_name,
        last_name: sessionUser.last_name,
        user_name: sessionUser.user_name,
        email: sessionUser.email,
        lastLoginAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res
      .status(200)
      .json({ Message: "Successfully Logged In", user: req.session.user });
  } catch (err) {
    console.error("Mongo sync on login failed:", err);
    // Still allow login
    return res
      .status(200)
      .json({ Message: "Successfully Logged In", user: req.session.user });
  }
});

// GET /users
router.get("/", async (req, res) => {
  const user = req.session.user;
  return user
    ? res.status(200).json({ Message: "Logged In", user })
    : res.status(400).json({ Message: "Please Log in / Sign up" });
});

// GET /users/all
router.get("/all", restrictedCheck, async (req, res) => {
  try {
    const users = await usersDb.getAllUsers();
    return res.status(200).json(users.rows);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to load users" });
  }
});

// GET /users/logout
router.get("/logout", async (req, res) => {
  try {
    req.session.cookie.expires = new Date();
    req.session.destroy((err) => {
      if (err) {
        return res.status(400).json({ Error: "There was a problem logging out" });
      }
      return res.status(200).json({ Message: "Successfully logged out" });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Logout failed" });
  }
});

module.exports = router;
