const express = require('express');
const usersDb = require('../database/actions/userActions.js');
// const bcrypt = require('bcryptjs');
const router = express.Router();
const hashPassword = require('../database/helpers/bcryptHelpers.js').hashPassword
const login = require('./helpers/helpers.js').login

router.post('/register', async (req, res) => {
  let newUser = req.body;
  if (newUser.user_name && newUser.password && newUser.email) {
    try {
      const hash = await hashPassword(newUser);
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
  res.status(200).json({Message: 'Successfully Logged In',
    user: req.session.user
  })
});

router.get('/logout', async(req, res) => {
  try {
    req.session.destroy(err => {
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

module.exports=router;


