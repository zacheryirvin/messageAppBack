const query = require('./query.js').query;

const db = {
  uuid: () => {
    return query(`
    create extension if not exists "uuid-ossp"
    `)
  },
  dropTables: async () => {
    const users = await query(`
    drop table if exists users cascade 
    `)
    // console.log(users)
    const messages = await query(`
    drop table if exists messages 
    `)
    // console.log(messages)
    const friends = await query(`
    drop table if exists friends 
    `)
    // console.log(friends)
  },
  createTables: async () => {
    try {
      const createUsers = await query(`
      create table if not exists users(
        id uuid default uuid_generate_v4() primary key,
        first_name varchar(100) default null,
        last_name varchar(100) default null,
        user_name varchar(100) not null unique,
        email varchar(100) not null unique,
        password varchar(250) not null unique
      )
    `)
      console.log('users', createUsers);
      const createFriends = await query(`
        create table if not exists friends(
          user_id uuid references users(id) not null,
          friend_id uuid references users(id) not null,
          pending boolean not null default true,
          confirmed boolean not null default false,
          requester boolean not null,
          primary key(user_id, friend_id)
        )
        `)
      console.log('friends', createFriends);
      const createMessages = await query(`
        create table if not exists messages(
          id uuid default uuid_generate_v4() primary key,
          time_stp timestamp default current_timestamp,
          message varchar(250),
          to_id uuid references users(id) not null,
          from_id uuid references users(id) not null
        )
        `)
      console.log('messages', createMessages);
    } catch(err) {
      console.log(err);
    }
  },
}

db.uuid();
db.dropTables();
db.createTables();
