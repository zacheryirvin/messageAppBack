const query = require('../query.js')

const friendsTb = {
  getFriends: async (userId) => {
    return query(`
    select * from users
    where id in (select friend_id 
      from friends 
      where user_id = '${userId}'
    );
    `)
  },
};

module.exports=friendsTb;

