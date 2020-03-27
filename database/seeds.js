const query = require('./query.js');
const faker = require('faker');
const hashPassword = require('../database/helpers/bcryptHelpers.js').hashPassword;

const insertUsers = async () => {
  const objectPass = {password: 'test'};
  const hash = await hashPassword(objectPass)
  const i = await query(`
  insert into users(first_name, last_name, user_name, email, password)
  values('${faker.name.firstName()}', '${faker.name.lastName()}', '${faker.internet.userName()}', '${faker.internet.email()}', '${hash}')
  `)
}

const insertFriends = async () => {
  let i = await query(`
  select * from users
  `)
  i = i['rows']
  for (let j = 0; j < i.length; j++) {
    const index = Math.floor(Math.random() * (i.length - 1)) + 1;
    const secIndex = Math.floor(Math.random() * (i.length - 1)) + 1;
    const userId = i[index]['id'];
    const toId = i[secIndex]['id'];
    const insertOne = await query(`
      insert into friends(user_id, friend_id)
      values('${userId}', '${toId}'),
      ('${toId}', '${userId}')
    `)
  }
}

const insertMessages = async () => {
  let i = await query(`
  select * from users
  `)
  i = i['rows']
  for (let j = 0; j < 1000; j++) {
    const index = Math.floor(Math.random() * (i.length - 1)) + 1;
    const userId = i[index]['id'];

    let friends = await query(`
    select friend_id from friends
    where user_id = '${userId}'
    `) 
    friends = friends['rows'];
    // console.log(friends)
    if (friends.length > 0) {
      const f_index = Math.floor(Math.random() * (friends.length - 0)) + 0;
      // console.log(friends)
      // console.log(f_index)
      const randomFriend = friends[f_index]['friend_id']
      const message = faker.lorem.sentences();
      const sendMessage = await query(`
    insert into messages(message, to_id, from_id)
    values('${message}', '${randomFriend}', '${userId}')
    `)
    }
  }
}


// for (let i = 0; i < 100; i++) {
  // insertUsers();
// }
insertFriends();
insertMessages();
