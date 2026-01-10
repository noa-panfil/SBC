require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function fixPartners() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
    });

    console.log("Connected to DB");

    try {
        const uploadImage = async (filePath) => {
            const data = fs.readFileSync(filePath);
            const ext = path.extname(filePath).slice(1);
            const mimeType = 'image/webp';
            
            const [res] = await connection.query(
                "INSERT INTO images (data, mime_type) VALUES (?, ?)",
                [data, mimeType]
            );
            return res.insertId;
        };

        const fixes = [
            { name: "Génération Lulu", file: "public/img/partenaires/generation-lulu.webp" },
            { name: "Hippopotamus", file: "public/img/partenaires/hippopotamus.webp" }
        ];

        for (const fix of fixes) {
            const filePath = path.join(process.cwd(), fix.file);
            console.log(`Fixing partner: ${fix.name} with file ${filePath}`);
            
            if (fs.existsSync(filePath)) {
                const newImageId = await uploadImage(filePath);
                
                // Update partners table
                await connection.query(
                    "UPDATE partners SET image_id = ? WHERE name = ?",
                    [newImageId, fix.name]
                );
                console.log(`Updated ${fix.name} with new image_id: ${newImageId}`);
            } else {
                console.error(`File not found: ${filePath}`);
            }
        }

        console.log("Fix complete!");

    } catch (error) {
        console.error("Fix failed:", error);
    } finally {
        await connection.end();
    }
}

fixPartners();
