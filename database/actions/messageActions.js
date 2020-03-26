const query = require('../query.js')

const messageTb = {
  getConversation: (userId, toId) => {
    return query(`
      select * from messages
      where ${userId} = from_id and ${toId} = toId 
    `)
  },
};

module.exports messageTb;
