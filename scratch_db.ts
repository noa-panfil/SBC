import mysql from 'mysql2/promise';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    
    // Add custom_response
    try {
        await pool.query('ALTER TABLE event_poll_votes ADD COLUMN custom_response TEXT');
    } catch(e) {}
    
    let [rows] = await pool.query('DESCRIBE events');
    console.log(rows);
    
    process.exit(0);
}

run();
