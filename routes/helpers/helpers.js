const session = require("express-session");
const bcrypt = require("bcryptjs");
const usersDb = require("../../database/actions/userActions.js");

const restricted = async (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(400).json({ Error: "Restricted area. Please login." });
  }
};

const login = async (req, res, next) => {
  const { user_name, password } = req.body;

  try {
    const result = await usersDb.getUser(user_name);

    if (result?.rows?.length && bcrypt.compareSync(password, result.rows[0].password)) {
      const u = result.rows[0];

      // ✅ store only what you need (no password)
      req.session.user = {
        id: u.id,
        user_name: u.user_name,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        is_admin: u.is_admin === true, // <-- THIS enables admin access
      };

      return next();
    }

    return res.status(401).json({ Error: "Please Signup" });
  } catch (err) {
    return res.status(500).json(err);
  }
};


module.exports = {
  restricted,
  login,
};
