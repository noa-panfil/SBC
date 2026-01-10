import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

export default function sitemap(): MetadataRoute.Sitemap {
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
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // 2. Dynamic Routes: Teams
    let teamRoutes: MetadataRoute.Sitemap = []
    try {
        const teamsPath = path.join(process.cwd(), 'public/json/teams.json')
        const teamsData = JSON.parse(fs.readFileSync(teamsPath, 'utf8'))

        teamRoutes = Object.keys(teamsData).map((id) => ({
            url: `${baseUrl}/equipe/${encodeURIComponent(id)}`,
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
        const eventsPath = path.join(process.cwd(), 'public/json/events.json')
        const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'))

        eventRoutes = Object.keys(eventsData).map((id) => ({
            url: `${baseUrl}/event/${encodeURIComponent(id)}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }))
    } catch (error) {
        console.error('Error generating event sitemap:', error)
    }

    return [...staticRoutes, ...teamRoutes, ...eventRoutes]
}
