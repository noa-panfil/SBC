require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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
        // Create partners table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS partners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                image_id INT,
                display_order INT DEFAULT 0,
                FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
            )
        `);
        await connection.query("TRUNCATE TABLE partners");
        console.log("Table partners created and truncated");

        // Create settings table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS settings (
                key_name VARCHAR(191) PRIMARY KEY,
                value TEXT
            )
        `);
        console.log("Table settings created");

        const partnersDir = path.join(process.cwd(), 'public/img/partenaires');
        const gymImage = path.join(process.cwd(), 'public/img/salle/arena.webp');

        // Helper to upload image
        const uploadImage = async (filePath) => {
            const data = fs.readFileSync(filePath);
            const ext = path.extname(filePath).slice(1);
            const mimeType = ext === 'webp' ? 'image/webp' : (ext === 'png' ? 'image/png' : 'image/jpeg');
            
            const [res] = await connection.query(
                "INSERT INTO images (data, mime_type) VALUES (?, ?)",
                [data, mimeType]
            );
            return res.insertId;
        };

        // Migrate Partners
        const partners = [
            { name: "Génération Lulu", file: "generation-lulu.webp" },
            { name: "Hippopotamus", file: "hippopotamus.webp" },
            { name: "David Parsy", file: "david-parsy.webp" },
            { name: "La Pause Déj", file: "la-pause-dej.webp" },
            { name: "Neo Kebab", file: "neo-kebab.webp" },
            { name: "M-tech", file: "m-tech.webp" },
            { name: "Volfoni", file: "volfoni.webp" },
            { name: "Ineo", file: "ineo.webp" },
        ];

        for (const p of partners) {
            const filePath = path.join(partnersDir, p.file);
            if (fs.existsSync(filePath)) {
                console.log(`Uploading partner: ${p.name}`);
                const imageId = await uploadImage(filePath);
                await connection.query(
                    "INSERT INTO partners (name, image_id) VALUES (?, ?)",
                    [p.name, imageId]
                );
            }
        }

        // Migrate Gym Image
        if (fs.existsSync(gymImage)) {
            console.log("Uploading Gym image");
            const imageId = await uploadImage(gymImage);
            await connection.query(
                "INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?",
                ['gym_image_id', imageId.toString(), imageId.toString()]
            );
        }

        console.log("Migration complete!");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await connection.end();
    }
}

migrate();
