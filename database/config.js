require("dotenv").config();
const { Pool } = require("pg");
const isProduction = process.env.NODE_ENV === "production";

//const connectionString = process.env.URI
const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;


const pool = new Pool({
  connectionString: connectionString});

//console.log(connectionString)

module.exports = pool;
