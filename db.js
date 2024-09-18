const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'ems',
    port:'3308'
  });
  
  db.connect(err => {
    if (err) throw err;
    console.log('MySQL connected...');
  });

module.exports = db;