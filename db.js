const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const db = mysql.createConnection({
    host: 'localhost',
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: 3306
})
  
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return; 
    }
    console.log('MySQL connected...');
});

module.exports = db;
