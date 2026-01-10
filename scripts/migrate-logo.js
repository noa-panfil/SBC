require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrateLogo() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
    });

    console.log("Connected to DB");

    try {
        const logoPath = path.join(process.cwd(), 'public/img/logo.png');
        
        if (fs.existsSync(logoPath)) {
            console.log("Uploading Logo image...");
            const data = fs.readFileSync(logoPath);
            const [res] = await connection.query(
                "INSERT INTO images (data, mime_type) VALUES (?, ?)",
                [data, 'image/png']
            );
            const imageId = res.insertId;
            
            await connection.query(
                "INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?",
                ['site_logo_id', imageId.toString(), imageId.toString()]
            );
            
            console.log(`Logo uploaded with image_id: ${imageId}`);
        } else {
            console.error("Logo file not found at " + logoPath);
        }

        console.log("Migration complete!");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await connection.end();
    }
}

migrateLogo();
