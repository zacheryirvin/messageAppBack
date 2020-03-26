const express = require('express');
const cors = require('cors');
const helm = require('helmet');
const logger = require('morgan');

const server = express();

const {
  friendsRouter,
} = require('./routes/index.js')

server.use(express.json());
server.use('/friends', friendsRouter);

server.get('/', (req, res) => {
  res.send('Test of Server Running')
});

module.exports=server;