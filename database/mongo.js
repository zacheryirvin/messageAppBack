// mongo.js
const mongoose = require('mongoose');
require('dotenv').config();

async function connectMongo() {
  try {
    if (!process.env.MGDB_URI) {
      throw new Error('MONGO_URI not set in environment');
    }

    await mongoose.connect(process.env.MGDB_URI);
    console.log('✅ Connected to MongoDB for analytics');
  } catch (err) {
    console.error("Mongo Failed to connect:", err.message);
    throw err;
  }
}

module.exports = connectMongo;
