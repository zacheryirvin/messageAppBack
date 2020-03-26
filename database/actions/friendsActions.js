const query = require('../query.js')

const friendsTb = {
  getFriends: async (userId) => {
    // const friends = await query(`
      // select friend_id
      // from friends
      // where user_id = '${userId}';
    // `)
    // const friendids = friends['rows'].map(x => {
      // return x.friend_id;
    // })
    // console.log(friendids)
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

