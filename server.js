const express = require('express');
const cors = require('cors');
const helm = require('helmet');
const logger = require('morgan');

const server = express();

const restrictedCheck = require('./routes/helpers/helpers.js').restricted

const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./database/config.js')
const sessionOptions = {
  store: new pgSession({
    pool: pool,
    tablename: "sessions",
    sidfilename: "sid",
    createTable: true,
  }),
  name: "messageAppSession",
  secret: "akioannbkd35418dadfak5478632dadf5ekke5973kjf",
  cookie: {
    maxAge: 1000 * 60 * 60,
  },
  resave: false,
  saveUninitialized: false,
};

const {
  friendsRouter,
  messagesRouter,
  usersRouter,
} = require('./routes/index.js')

server.use(express.json());
server.use(session(sessionOptions));
server.use('/friends', restrictedCheck, friendsRouter);
server.use('/messages', restrictedCheck, messagesRouter);
server.use('/users', usersRouter);

server.get('/', (req, res) => {
  res.send('Test of Server Running')
});

module.exports=server;
