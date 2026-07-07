const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
  override: true,
});
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Unexpected Postgres client error", err);
  process.exit(-1);
});

module.exports = pool;
