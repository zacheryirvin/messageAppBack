const express = require("express");
const usersDb = require("../database/actions/userActions.js");
const friendsDb = require("../database/actions/friendsActions.js");
// const bcrypt = require('bcryptjs');
const router = express.Router();
const hashPassword =
  require("../database/helpers/bcryptHelpers.js").hashPassword;
const login = require("./helpers/helpers.js").login;
const restrictedCheck = require("./helpers/helpers.js").restricted;

router.post("/register", async (req, res) => {
  let newUser = req.body;
  if (newUser.user_name && newUser.password && newUser.email) {
    try {
      const hash = await hashPassword(newUser);
      newUser.password = hash;
      const user = await usersDb.addUser(newUser);
      const user_data = await usersDb.getUser(newUser.user_name);
      console.log(user_data.rows[0].id)
      const bot_data = await usersDb.getUser('chatbot');
      console.log(bot_data.rows[0].id)
      const add = await friendsDb.addFriend(bot_data.rows[0].id, user_data.rows[0].id);
      const confirm = await friendsDb.confirmFriend(user_data.rows[0].id, bot_data.rows[0].id);
      res.status(201).json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res
      .status(400)
      .json({ Error: "Username, email, and password are required" });
  }
});

router.post("/login", login, async (req, res) => {
  res
    .status(200)
    .json({ Message: "Successfully Logged In", user: req.session.user });
});

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

router.get("/all", restrictedCheck, async (req, res) => {
  try {
    const users = await usersDb.getAllUsers();
    return res.status(200).json(users["rows"]);
  } catch (err) {
    console.log(err);
  }
});

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
