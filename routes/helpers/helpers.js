const session = require('express-session');
const bcrypt = require('bcryptjs');
const usersDb = require('../../database/actions/userActions.js')

const restricted = async (req, res, next) => {
  console.log(req.session);
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(400).json({Error: 'Restricted area. Please login.'})
  }
};

const login = async (req, res, next) => {
  const {user_name, password} = req.body;
  try {
    let user = await usersDb.getUser(user_name);
    if (user && bcrypt.compareSync(password, user['rows'][0].password)) {
      req.session.user = user['rows'][0];
      next();
    } else {
      res.status(401).json({Error: 'Please Signup'})
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  restricted,
  login,
};
