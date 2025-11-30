// mongoModels/Friend.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Mirrors Postgres "friends" table:
 *
 *  user_id   uuid  -> user_pg_id
 *  friend_id uuid  -> friend_pg_id
 *  pending   boolean
 *  confirmed boolean
 *  requester boolean
 *
 * We model the composite PK (user_id, friend_id) as a unique compound index.
 */
const friendSchema = new Schema(
  {
    user_pg_id: {
      type: String, // Postgres users.id
      required: true,
      index: true,
    },
    friend_pg_id: {
      type: String, // Postgres users.id
      required: true,
      index: true,
    },
    pending: {
      type: Boolean,
      default: true,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    requester: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'friends_analytics',
  }
);

// mimic PRIMARY KEY(user_id, friend_id)
friendSchema.index(
  { user_pg_id: 1, friend_pg_id: 1 },
  { unique: true }
);

module.exports = mongoose.model('MongoFriend', friendSchema);
