// mongoModels/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Mirrors Postgres "users" table:
 *  id          uuid   -> pgId
 *  first_name  varchar(100)
 *  last_name   varchar(100)
 *  user_name   varchar(100) UNIQUE
 *  email       varchar(100) UNIQUE
 *  password    (NOT stored here – PG is source of truth)
 */
const userSchema = new Schema(
  {
    pgId: {
      type: String, // Postgres uuid as string
      required: true,
      unique: true,
      index: true,
    },
    first_name: { type: String, default: null },
    last_name: { type: String, default: null },
    user_name: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },

    // For admin analytics
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'users_analytics',
  }
);

module.exports = mongoose.model('MongoUser', userSchema);
