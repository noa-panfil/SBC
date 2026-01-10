import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
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
                src: '/img/logo.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/img/logo.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
