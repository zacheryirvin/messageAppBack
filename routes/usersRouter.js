const express = require('express');
const usersDb = require('../database/actions/userActions.js');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const router = express.Router();
const pool = require('../database/config.js')
const hashPassword = require('../database/helpers/bcryptHelpers.js').hashPassword

const sessionOptions = {
  name: "messageAppSession",
  secret: "akioannbkd35418dadfak5478632dadf5ekke5973kjf",
  cookie: {
    maxAge: 1000 * 60 * 60,
  },
  resave: false,
  store: new pgSession({
    pool: pool,
    tablename: "sessions",
  })
};

router.use(session(sessionOptions));

const login = async (req, res, next) => {
  const {user_name, password} = req.body;
  try {
    const user = await usersDb.getUser(user_name);
    if (user && bcrypt.compareSync(password, user.password)) {
      req.session = user;
      next();
    } else {
      res.status(401).json({Error: 'Please Signup'})
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const restricted = async (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(400).json({Error: 'Restricted area. Please login.'})
  }
};

router.post('/register', async (req, res) => {
  let newUser = req.body;
  if (newUser.user_name && newUser.password && newUser.email) {
    try {
      const hash = hashPassword(newUser);
      newUser.password = hash;
      const user = await usersDb.addUser(newUser);
      res.status(201).json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(400).json({Error: 'Username, email, and password are required'})
  }
});

router.post('/login', login, async (req, res) => {
  res.status(200).json({Message: 'Successfully Logged In'})
})

router.get('/logout', async(req, res) => {
  try {
    req.session.destoy(err => {
      if (err) {
        res.status(400).json({Error: 'There was a problem logging out'})
      } else {
        res.status(200).json({Message: 'Successfully logged out'})
      }
    })
  } catch (err) {
    console.log(err);
  }
});


