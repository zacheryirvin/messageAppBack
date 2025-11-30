// mongoModels/Message.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Mirrors Postgres "messages" table:
 *
 *  id       uuid         -> pgId
 *  time_stp timestamp    -> time_stp
 *  message  varchar(250) -> message
 *  to_id    uuid         -> to_pg_id
 *  from_id  uuid         -> from_pg_id
 *
 * We keep PG IDs as strings so we can tie analytics back to Postgres.
 */
const messageSchema = new Schema(
  {
    pgId: {
      type: String,        // Postgres messages.id (uuid)
      required: false,     // allow null if INSERT doesn't RETURNING
      index: true,
      unique: false,       // you can change to true if you guarantee pgId
    },
    time_stp: {
      type: Date,          // maps from PG timestamp
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    from_pg_id: {
      type: String,        // Postgres users.id
      required: true,
      index: true,
    },
    to_pg_id: {
      type: String,        // Postgres users.id
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,          // Mongo's own createdAt/updatedAt
    collection: 'messages_analytics',
  }
);

// helpful for time-range queries
messageSchema.index({ time_stp: 1 });

module.exports = mongoose.model('MongoMessage', messageSchema);
