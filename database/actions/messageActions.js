const query = require("../query.js").query;
const messageQuery = require("../query.js").messageQuery;

const messageTb = {
  getConversation: (userId, toId) => {
    return query(`
      select id, from_id, to_id, (to_char(time_stp, 'mm-dd-yy hh24:mi:ss')) date, message from messages
      where from_id = '${userId}' and to_id = '${toId}' 
      or to_id = '${userId}' and from_id = '${toId}' 
      order by time_stp desc
      limit 100
    `);
  },
  addMessage: (userId, toId, message) => {
    return query(
    `
    INSERT INTO messages(from_id, to_id, message)
    VALUES($1, $2, $3)
    RETURNING id, time_stp, message, to_id, from_id
    `,
    [userId, toId, message]
    );
  },
  friendCheck: (userId, toId) => {
    return query(`
    select ('${toId}' in (select friend_id
      from friends where user_id = '${userId}' and 
      confirmed = true)) isFriend
    `);
  },
  deleteConversation: (userId, toId) => {
    return query(`
    delete from messages
    where from_id = '${userId}' and to_id = '${toId}'
    or from_id = '${toId}' and to_id = '${userId}'
    `);
  },
  listenConversation: () => {
    return messageQuery();
  },
};

module.exports = messageTb;
