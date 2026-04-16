import mysql from 'mysql2/promise';

async function setup() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'sbc-database',
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coach_availabilities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        team VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS coach_availability_slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coach_id INT NOT NULL,
        day_of_week VARCHAR(20) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_unavailable BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (coach_id) REFERENCES coach_availabilities(id) ON DELETE CASCADE
      );
    `);

    console.log("Tables created successfully");
  } catch (err) {
    console.error("Error creating tables", err);
  } finally {
    await pool.end();
  }
}

setup();
