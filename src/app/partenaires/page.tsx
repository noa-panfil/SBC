import { Metadata } from 'next';
import PartenairesClient from './PartenairesClient';

export const metadata: Metadata = {
    title: 'Nos Partenaires - Seclin Basket Club',
    description: 'Merci à tous nos partenaires qui soutiennent le Seclin Basket Club.',
};

export default function PartenairesPage() {
    return <PartenairesClient />;
}
