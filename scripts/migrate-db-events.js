require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
    });

    console.log("Connected to DB");

    try {
        // Add date_display column
        try {
            await connection.query("ALTER TABLE events ADD COLUMN date_display VARCHAR(255) AFTER event_date");
            console.log("Added date_display column");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Column date_display already exists");
            } else {
                throw e;
            }
        }

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await connection.end();
    }
}

migrate();
