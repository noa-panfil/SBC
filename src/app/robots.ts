import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin', '/coach', '/login', '/api/admin', '/api/auth', '/merci'],
        },
        sitemap: 'https://seclinbasketclub.fr/sitemap.xml',
    }
}
