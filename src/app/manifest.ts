import { MetadataRoute } from 'next'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    let logoUrl = '/logo.png?v=3';
    /* 
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT value FROM settings WHERE key_name = 'site_logo_id'"
        );
        if (rows.length > 0) {
            logoUrl = `/api/image/${rows[0].value}`;
        }
    } catch (e) {
        console.error("Error fetching manifest logo:", e);
    }
    */

    return {
        name: 'Seclin Basket Club',
        short_name: 'SBC',
        description: 'Site officiel du Seclin Basket Club',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#14532d',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
            {
                src: logoUrl,
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: logoUrl,
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: logoUrl,
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
            },
            {
                src: logoUrl,
                sizes: '1024x1024',
                type: 'image/png',
                purpose: 'any'
            }
        ],
    }
}
