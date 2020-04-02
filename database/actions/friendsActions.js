const query = require('../query.js')

const friendsTb = {
  getFriends: (userId) => {
    return query(`
    select * from (
      select distinct u.id, u.first_name, u.last_name, u.user_name, f.pending, f.confirmed 
      from users u join friends f
      on u.id = f.user_id
    ) as a
    where a.id in (select friend_id
    from friends where user_id = '${userId}'
    )
    `)
  },
  addFriend: async (userId, toId) => {
    try {
      const f_check = await query(`
      select (
      '${toId}' in (select friend_id
        from friends where user_id = '${userId}'
        ) 
      ) isFriend
    `)
      if (!f_check['rows']['isfriend']) {
        return await query(`
        insert into friends(user_id, friend_id, pending, confirmed)
        values ('${userId}', '${toId}', null, false),
        ('${toId}', '${userId}', true, false)
        `)
      }
    } catch(err) {
      console.log(err);
    }
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

