require("dotenv").config();
const pool = require("./config.js");

const db = {
  uuid: async () => {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  },

  dropTables: async () => {
    // Drop trigger only if messages table exists
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'messages') THEN
          DROP TRIGGER IF EXISTS watch_messages ON messages;
        END IF;
      END $$;
    `);

    // Drop tables
    await pool.query(`DROP TABLE IF EXISTS friends CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS messages CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS users CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS session CASCADE`);

    // Drop functions
    await pool.query(`DROP FUNCTION IF EXISTS all_friends(uuid) CASCADE`);
    await pool.query(`DROP FUNCTION IF EXISTS notify_trigger() CASCADE`);

    // Drop types
    await pool.query(`DROP TYPE IF EXISTS user_friends CASCADE`);
    await pool.query(`DROP TYPE IF EXISTS triggerMessage CASCADE`);
  },

  createTables: async () => {
    // USERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        first_name varchar(100) DEFAULT NULL,
        last_name varchar(100) DEFAULT NULL,
        user_name varchar(100) NOT NULL UNIQUE,
        email varchar(100) NOT NULL UNIQUE,
        password varchar(250) NOT NULL
      )
    `);

    // FRIENDS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS friends(
        user_id uuid REFERENCES users(id) NOT NULL,
        friend_id uuid REFERENCES users(id) NOT NULL,
        pending boolean NOT NULL DEFAULT true,
        confirmed boolean NOT NULL DEFAULT false,
        requester boolean NOT NULL,
        PRIMARY KEY(user_id, friend_id)
      )
    `);

    // MESSAGES
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages(
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        time_stp timestamp DEFAULT current_timestamp,
        message varchar(250),
        to_id uuid REFERENCES users(id) NOT NULL,
        from_id uuid REFERENCES users(id) NOT NULL
      )
    `);

    // TYPE: user_friends (guard duplicate)
    await pool.query(`
      DO $$
      BEGIN
        CREATE TYPE user_friends AS (
          id uuid,
          first_name text,
          last_name text,
          user_name text,
          email text,
          pending boolean,
          confirmed boolean,
          requester boolean
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // FUNCTION: all_friends
    await pool.query(`
      CREATE OR REPLACE FUNCTION all_friends(userId uuid)
      RETURNS SETOF user_friends
      LANGUAGE plpgsql AS $$
      DECLARE
        tempy CURSOR FOR
          SELECT friend_id, pending, confirmed, requester
          FROM friends
          WHERE user_id = userId;
        return_val user_friends;
      BEGIN
        FOR i IN tempy LOOP
          SELECT id, first_name, last_name, user_name, email,
                 i.pending, i.confirmed, i.requester
          INTO return_val
          FROM users
          WHERE id = i.friend_id;

          RETURN NEXT return_val;
        END LOOP;
        RETURN;
      END; $$;
    `);

    // TYPE: triggerMessage (guard duplicate)
    await pool.query(`
      DO $$
      BEGIN
        CREATE TYPE triggerMessage AS (
          id uuid,
          from_id uuid,
          to_id uuid,
          time_stp text,
          message text
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // FUNCTION: notify_trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION notify_trigger()
      RETURNS trigger AS $$
      DECLARE
        tempy triggerMessage;
      BEGIN
        tempy.id := NEW.id;
        tempy.from_id := NEW.from_id;
        tempy.to_id := NEW.to_id;
        tempy.time_stp := to_char(NEW.time_stp, 'mm-dd-yy, hh24:mi:ss');
        tempy.message := NEW.message;

        PERFORM pg_notify('watch_messages', row_to_json(tempy)::text);
        RETURN NEW;
      END; $$ LANGUAGE plpgsql;
    `);

    // TRIGGER: watch_messages
    await pool.query(`
      DROP TRIGGER IF EXISTS watch_messages ON messages;

      CREATE TRIGGER watch_messages
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION notify_trigger();
    `);

    // SESSION TABLE (idempotent)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        PRIMARY KEY ("sid")
      )
    `);

    // SESSION INDEX (idempotent)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session ("expire");
    `);

    console.log("✅ Tables/types/functions/triggers created.");
  },
};

(async () => {
  try {
    console.log("Starting dbcreation...");

    const dbNameRes = await pool.query("SELECT current_database()");
    console.log("SCRIPT IS CONNECTED TO DB:", dbNameRes.rows[0].current_database);

    await db.uuid();
    await db.dropTables();
    await db.createTables();

    console.log("✅ dbcreation complete.");
  } catch (err) {
    console.error("❌ dbcreation failed:", err.message);
    console.error(err);
  } finally {
    await pool.end();
    console.log("Pool closed.");
  }
})();
