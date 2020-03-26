const query = require('./query.js');

const db = {
  uuid: () => {
    return query(`
    create extension if not exists "uuid-ossp"
    `)
  },
  allFriendsTable: () => {
    return query(`
    create or replace function allFriends(id uuid)
    returns table (
      first_name varchar(100),
      last_name varchar(100),
      user_name varchar(100)
    )
    as $$

    `)
  }
  dropTables: () => {
    return query(`
    drop table if exists users cascade
    `)
  },
  createUsersTable: () => {
    return query(`
    create table if not exists users(
      id uuid default uuid_generate_v4() primary key,
      first_name varchar(100) default null,
      last_name varchar(100) default null,
      user_name varchar(100) not null,
      email varchar(100) not null
    )
    `)
  },
  createMessagesTable: () => {
    return query(`
    create table if not exists messages(
      id uuid default uuid_generate_v4() primary key,
      time_stp timestamp not null,
      message varchar(250),
      to_id uuid references users(id) not null,
      from_id uuid references users(id) not null
    )
    `)
  },
  createFriendsTable: () => {
    return query(`
    create table if not exists friends(
      id serial not null,
      user_id uuid references users(id) not null,
      friend_id uuid references users(id) not null,
      primary key(id, user_id)
    )
    `)
  }
}

db.uuid();
db.dropTables();
db.createUsersTable();
db.createMessagesTable();
db.createFriendsTable();
