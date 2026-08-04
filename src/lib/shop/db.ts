import mysql from "mysql2/promise";

function databasePort(): number {
    const value = process.env.SHOP_DB_PORT || process.env.DB_PORT || "3306";
    const port = Number(value);
    return Number.isInteger(port) && port > 0 && port <= 65535 ? port : 3306;
}

const shopPool = mysql.createPool({
    host: process.env.SHOP_DB_HOST || process.env.DB_HOST,
    port: databasePort(),
    user: process.env.SHOP_DB_USER || process.env.DB_USER,
    password: process.env.SHOP_DB_PASSWORD ?? process.env.DB_PASSWORD,
    database: process.env.SHOP_DB_NAME || "sbc_boutique",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default shopPool;
