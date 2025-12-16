require("dotenv").config();
const { Pool, Client} = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const connectionString =
  process.env.DB_URI ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

const listenClient = new Client({connectionString: process.env.DB_URI_DIRECT, ssl});

module.exports = {pool, listenClient};
