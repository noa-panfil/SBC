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
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS event_registrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                lastname VARCHAR(255) NOT NULL,
                firstname VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                team_name VARCHAR(255), -- Pour les Joueurs (ex: U11M)
                role_name VARCHAR(255), -- Pour les Bénévoles (ex: Buvette)
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            )
        `;

        await connection.query(createTableQuery);
        console.log("Table event_registrations created successfully.");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await connection.end();
    }
}

migrate();
