const session = require('express-session');

const restricted = async (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(400).json({Error: 'Restricted area. Please login.'})
  }
};

module.exports = {
  restricted,
};
