const query = require('../query.js').query

const friendsTb = {
  getFriends: (userId) => {
    return query(`
      select * from all_friends('${userId}')
    `)
  },
  addFriend: async (userId, toId) => {
    return query(`
    insert into friends(user_id, friend_id, pending, confirmed, requester)
    values('${userId}', '${toId}', true, false, true),
    ('${toId}', '${userId}', true, false, false)
    `)
  },
  confirmFriend: (userId, toId) => {
    return query(`
    update friends
    set pending = false,
      confirmed = true
    where user_id = '${userId}' and friend_id = '${toId}'
    or user_id = '${toId}' and friend_id = '${userId}'
    `)
  },
  denyFriend: (userId, toId) => {
    return query(`
      delete from friends
      where user_id = '${userId}' and friend_id = '${toId}'
      or user_id = '${toId}' and friend_id = '${userId}'
    `)
  },
  deleteFriend: (userId, toId) => {
    return query(`
    delete from friends
    where user_id = '${userId}' and friend_id = '${toId}'
    or user_id = '${toId}' and friend_id = '${userId}'
    `)
  }
};

module.exports=friendsTb;

