import { MetadataRoute } from 'next'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://seclinbasketclub.fr'

    // 1. Static Routes
    const staticRoutes = [
        '',
        '/equipes',
        '/palmares',
        '/informations',
        '/partenaires',
        '/contact',
        '/mentions-legales',
        '/fonds-ecran',
        '/planning',
        '/boutique',
        '/buvette',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // 2. Dynamic Routes: Teams
    let teamRoutes: MetadataRoute.Sitemap = []
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM teams')
        teamRoutes = rows.map((row) => ({
            url: `${baseUrl}/equipe/${encodeURIComponent(row.id)}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))
    } catch (error) {
        console.error('Error generating team sitemap:', error)
    }

    // 3. Dynamic Routes: Events
    let eventRoutes: MetadataRoute.Sitemap = []
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM events')
        eventRoutes = rows.map((row) => ({
            url: `${baseUrl}/event/${encodeURIComponent(row.id)}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }))
    } catch (error) {
        console.error('Error generating event sitemap:', error)
    }

    return [...staticRoutes, ...teamRoutes, ...eventRoutes]
}
