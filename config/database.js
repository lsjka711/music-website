const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '051105keai',
    database: process.env.DB_NAME || 'music_website',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 创建promise包装
const promisePool = pool.promise();

module.exports = promisePool; 