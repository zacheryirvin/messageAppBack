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
    const type = await query(`
    drop type if exists user_friends cascade
    `)
    const triggerMessage = await query(`
    drop type if exists triggerMessage
    `)
    const dropTrigger = await query(`
    drop trigger if exists watch_messages on messages
    `)
    const dropSession = await query(`
    drop table if exists session cascade
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
      const user_friends = await query(`
      create type user_friends as (
      id uuid,
      first_name text,
      last_name text,
      user_name text,
      email text,
      pending boolean,
      confirmed boolean,
      requester boolean
      )
      `)
      const all_friends = await query(`
      create or replace function all_friends(userId uuid)
      returns setof user_friends
      language plpgsql as $$
      declare 
      tempy cursor for 
        select friend_id, pending, confirmed, requester
        from friends
        where user_id = userId;
      return_val user_friends;
      begin 
        for i in tempy
        loop
          select id, first_name, last_name, user_name, email, i.pending, i.confirmed, i.requester
          into return_val
          from users 
          where id = i.friend_id;
          return next return_val;
        end loop;
      end; $$;
      `)
      const triggerMessage = await query(`
      create type triggerMessage as (
        id uuid,
        from_id uuid,
        to_id uuid,
        time_stp text,
        message text
      )
      `)
      const trigger_function = await query(`
      create or replace function notify_trigger()
      returns trigger
      as $$
      declare
      tempy triggerMessage;
      begin 

        tempy.id := new.id;
        tempy.from_id := new.from_id;
        tempy.to_id := new.to_id;
        tempy.time_stp := to_char(new.time_stp, 'mm-dd-yy, hh24:mi:ss');
        tempy.message := new.message;
        perform pg_notify('watch_messages', row_to_json(tempy)::text);
      --	new.time_stp := to_char(new.time_stp, 'mm-dd-yy, hh24::mi:ss');
        return new;
      end; $$ language plpgsql;
      `)
      const create_trigger = await query(`
      create trigger watch_messages
      after insert on messages
      for each row execute procedure notify_trigger();
      `)
      const create_session_table = await query(`
      CREATE TABLE session (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
      `)
      const alter_sessions_table = await query(`
      ALTER TABLE session ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
      `)
      const create_session_index = await query(`
      CREATE INDEX IDX_session_expire ON session ("expire");
      `)
      console.log('messages', createMessages);
    } catch(err) {
      console.log(err);
    }
  },
}

const anon = async () => {
  const uuid = await db.uuid();
  const drop = await db.dropTables();
  const create = await db.createTables();
}

anon();

