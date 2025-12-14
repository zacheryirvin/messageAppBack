const express = require("express");
const usersDb = require("../database/actions/userActions.js");
const friendsDb = require("../database/actions/friendsActions.js");
const router = express.Router();

const hashPassword =
  require("../database/helpers/bcryptHelpers.js").hashPassword;
const login = require("./helpers/helpers.js").login;
const restrictedCheck = require("./helpers/helpers.js").restricted;

// 🔹 NEW: Mongo analytics model
const MongoUser = require("../database/mongoModels/User");

// POST /users/register
router.post("/register", async (req, res) => {
  let newUser = req.body;

  if (newUser.user_name && newUser.password && newUser.email) {
    try {
      // hash password as before
      const hash = await hashPassword(newUser);
      newUser.password = hash;

      // create user in Postgres (source of truth)
      const user = await usersDb.addUser(newUser);

      // fetch the full PG user row (includes id)
      const user_data = await usersDb.getUser(newUser.user_name);
      const pgUser = user_data.rows[0]; // { id, first_name, last_name, user_name, email, ... }

      // 🔹 Mirror this user into Mongo for analytics/admin
      await MongoUser.findOneAndUpdate(
        { pgId: pgUser.id },
        {
          pgId: pgUser.id,
          first_name: pgUser.first_name,
          last_name: pgUser.last_name,
          user_name: pgUser.user_name,
          email: pgUser.email,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      // get chatbot user from Postgres (already in your code)
      const bot_data = await usersDb.getUser("chatbot");
      const botUser = bot_data.rows[0];

      // 🔹 Optional: mirror chatbot into Mongo as well
      if (botUser) {
        await MongoUser.findOneAndUpdate(
          { pgId: botUser.id },
          {
            pgId: botUser.id,
            first_name: botUser.first_name,
            last_name: botUser.last_name,
            user_name: botUser.user_name,
            email: botUser.email,
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );
      }

      // friend setup with chatbot (existing behavior)
      const add = await friendsDb.addFriend(botUser.rows[0].id, pgUser.id);
      const confirm = await friendsDb.confirmFriend(pgUser.id, botUser.rows[0].id);

      // respond same as before
      res.status(201).json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  } else {
    res
      .status(400)
      .json({ Error: "Username, email, and password are required" });
  }
});

// POST /users/login
router.post("/login", login, async (req, res) => {
  try {
    // login middleware has already authenticated and set req.session.user
    const sessionUser = req.session.user;
    // sessionUser should contain at least { id, user_name, email, first_name, last_name }
    // based on how your login helper is written; if not, tweak the fields below.

    // 🔹 Upsert + update lastLoginAt in Mongo for analytics
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
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res
      .status(200)
      .json({ Message: "Successfully Logged In", user: req.session.user });
  } catch (err) {
    console.error("Mongo sync on login failed:", err);
    // Still let them log in, since PG is source of truth
    res
      .status(200)
      .json({ Message: "Successfully Logged In", user: req.session.user });
  }
});

// GET /users
router.get("/", async (req, res) => {
  const user = req.session.user;
  try {
    user
      ? res.status(200).json({ Message: "Logged In", user: user })
      : res.status(400).json({ Message: "{Please Log in / Sign up}" });
  } catch (err) {
    console.log(err);
  }
});

// GET /users/all
router.get("/all", restrictedCheck, async (req, res) => {
  try {
    const users = await usersDb.getAllUsers();
    return res.status(200).json(users["rows"]);
  } catch (err) {
    console.log(err);
  }
});

// GET /users/logout
router.get("/logout", async (req, res) => {
  try {
    req.session.cookie.expires = new Date();
    req.session.destroy((err) => {
      if (err) {
        res.status(400).json({ Error: "There was a problem logging out" });
      } else {
        res.status(200).json({ Message: "Successfully logged out" });
      }
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
