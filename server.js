const express = require("express");
const cors = require("cors");
const helm = require("helmet");
// const logger = require('morgan');

const server = express();
server.set("trust proxy", 1);

const restrictedCheck = require("./routes/helpers/helpers.js").restricted;

const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const {pool} = require("./database/config.js");
const sessionOptions = {
  store: new pgSession({
    pool: pool,
  }),
  name: "messageAppSession",
  //secret: "akioannbkd35418dadfak5478632dadf5ekke5973kjf",
  secret: process.env.SESSION_SECRET,
  cookie: {
    maxAge: 1000 * 60 * 60,
    httpOnly: true,
    secure: process.env.NODE_ENV == "production",
    sameSite: process.env.NODE_ENV = "production" ? "none" : "lax",
  },
  resave: false,
  saveUninitialized: false,
  key: "express.sid",
};

const theSession = session(sessionOptions);
const connectMongo = require("./database/mongo.js");

const {
  friendsRouter,
  messagesRouter,
  usersRouter,
  adminRouter,
} = require("./routes/index.js");

server.use(theSession);
const middle = async (req, res, next) => {
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,UPDATE,OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, X-HTTP-Method-Override, Accept, Content-Type",
  );
  next();
};


//(async () => {
  //try {
    //await connectMongo();
    //const mgdb_port = process.env.MGDB_PORT || 5000;
    //server.listen(mgdb_port, () => {
      //console.log(`Listening on Port ${mgdb_port}`)
    //});
  //} catch (err) {
    //console.log("Failed to Start Mongo Server", err);
    //process.exit(1);
  //}
//})();

// server.use( (req, res, next) => {
// res.header('Access-Control-Allow-Credentials', true);
// res.header('Access-Control-Allow-Origin', req.headers.origin);
// res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
// res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, X-HTTP-Method-Override, Accept, Content-Type');
// next();
// });
server.use(middle);
server.use(helm());
server.use(express.json());
server.use("/friends", friendsRouter);
server.use("/messages", messagesRouter);
server.use("/users", middle, usersRouter);
server.use("/admin", adminRouter);


server.get("/", (req, res) => {
  res.send("Test of Server Running");
});

module.exports = server;
