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
  }),
  name: "messageAppSession",
  secret: "akioannbkd35418dadfak5478632dadf5ekke5973kjf",
  cookie: {
    maxAge: 1000 * 60 * 60,
    httpOnly: false,
  },
  resave: false,
  saveUninitialized: true,
};

const theSession = session(sessionOptions)

const {
  friendsRouter,
  messagesRouter,
  usersRouter,
} = require('./routes/index.js')

server.use(theSession);
server.use( (req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});

server.use(helm())
server.use(express.json());
server.use('/friends', restrictedCheck, friendsRouter);
server.use('/messages', restrictedCheck, messagesRouter);
server.use('/users', usersRouter);

server.get('/', (req, res) => {
  res.send('Test of Server Running')
});

module.exports=server;
