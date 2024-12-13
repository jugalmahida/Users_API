const Pool = require("pg").Pool;

const pool = new Pool({
  user: "your_user",
  host: "your_hostname",
  database: "your_database",
  password: "your_password",
  port: 5432,
});

module.exports = pool;
