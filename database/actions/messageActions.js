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
  addMessage: async (userId, toId, message) => {
    const insert = await query(`
    insert into messages(from_id, to_id, message)
    values('${userId}', '${toId}', '${message}')
    `);
    console.log(insert);
    return insert;
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
