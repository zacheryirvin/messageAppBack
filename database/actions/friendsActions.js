const query = require("../query.js").query;

const friendsTb = {
  getFriends: (userId) => {
    return query(`
      select * from all_friends('${userId}')
    `);
  },
  addFriend: async (userId, toId) => {
    return query(`
    insert into friends(user_id, friend_id, pending, confirmed, requester)
    values('${userId}', '${toId}', true, false, true),
    ('${toId}', '${userId}', true, false, false)
    `);
  },
  confirmFriend: (userId, toId) => {
    return query(`
    update friends
    set pending = false,
      confirmed = true
    where user_id = '${userId}' and friend_id = '${toId}'
    or user_id = '${toId}' and friend_id = '${userId}'
    `);
  },
  denyFriend: (userId, toId) => {
    return query(`
      delete from friends
      where user_id = '${userId}' and friend_id = '${toId}'
      or user_id = '${toId}' and friend_id = '${userId}'
    `);
  },
  deleteFriend: (userId, toId) => {
    return query(`
    delete from friends
    where user_id = '${userId}' and friend_id = '${toId}'
    or user_id = '${toId}' and friend_id = '${userId}'
    `);
  },
  getFriendSuggestions: async (userId, limit = 10) => {
    const sql = `
      WITH my_friends AS (
        SELECT friend_id
        FROM friends
        WHERE user_id = $1 AND confirmed = true
      ),
      second_degree AS (
        SELECT f.friend_id AS suggested_id
        FROM friends f
        JOIN my_friends mf ON f.user_id = mf.friend_id
        WHERE f.confirmed = true
          AND f.friend_id <> $1
      ),
      mutual_counts AS (
        SELECT suggested_id, COUNT(*) AS mutual_count
        FROM second_degree
        GROUP BY suggested_id
      ),
      excluded AS (
        SELECT $1::uuid AS id
        UNION
        SELECT friend_id FROM friends WHERE user_id = $1
      )
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.user_name,
        u.email,
        mc.mutual_count
      FROM mutual_counts mc
      JOIN users u ON u.id = mc.suggested_id
      WHERE mc.suggested_id NOT IN (SELECT id FROM excluded)
      ORDER BY mc.mutual_count DESC, u.user_name ASC
      LIMIT $2;
    `;

  // IMPORTANT: await the query, then return rows
    const result = await query(sql, [userId, limit]);
    console.log(result.rows.id)
    return result.rows;
  }

};

module.exports = friendsTb;
