// mongo.js
const mongoose = require('mongoose');
require('dotenv').config();

async function connectMongo() {
  if (!process.env.MGDB_URI) {
    throw new Error('MONGO_URI not set in environment');
  }

  await mongoose.connect(process.env.MGDB_URI, {
    // options optional on newer Mongoose, but fine:
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('✅ Connected to MongoDB for analytics');
}

module.exports = connectMongo;
