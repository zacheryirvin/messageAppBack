const query = require('../query.js')

const usersTb = {
  addUser: (user) => {
    const {first_name, last_name, user_name, email, password} = user;
    return query(`
    insert into users(first_name, last_name, user_name, email, password)
    values('${first_name}', '${last_name}', '${user_name}', '${email}', '${password}')
     `)
  },
  getUser: (user_name) => {
    return query(`
    select * from users
    where user_name = '${user_name}'
    `)
  },
  deleteUser: (id) => {
    return query(`
    delete from users
    where id = '${id}'
    `)
  },
  updateUser: (id, user) => {
    const {first_name, last_name, user_name, email, password} = user;
    return query(`
    update users
    set first_name = '${first_name}',
    set last_name = '${last_name}',
    set user_name = '${user_name}',
    set email = '${email}',
    set password = '${password}'
    where id = '${id}'
     `)
  },
  getAllUsers: () => {
    return query(`
    select id, first_name, last_name, user_name, email 
    from users
    order by user_name;
   `)
  }
}

module.exports=usersTb;
