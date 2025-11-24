const bcrypt = require("bcryptjs");

const hashPassword = async (newUser) => {
  const hash = await new Promise((res, rej) => {
    bcrypt.hash(newUser.password, 10, function (error, hash) {
      if (error) rej(error);
      res(hash);
    });
  });
  return hash;
};

module.exports = {
  hashPassword,
};
