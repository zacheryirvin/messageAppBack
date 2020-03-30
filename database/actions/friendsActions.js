const query = require('../query.js')

const friendsTb = {
  getFriends: (userId) => {
    return query(`
    select id, first_name, last_name, user_name, email from users
    where id in (select friend_id 
      from friends 
      where user_id = '${userId}'
    );
    `)
  },
  addFriend: (userId, toId) => {
    return query(`
    insert into friends(user_id, friend_id)
    values('${userId}', '${toId}')
    `)
  },
};

module.exports=friendsTb;

