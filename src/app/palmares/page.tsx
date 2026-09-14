import { Metadata } from 'next';
import PalmaresClient from './vitrine/TrophyRoomPalmares';

export const metadata: Metadata = {
    title: 'Palmarès | Seclin Basket Club',
    description: 'Les titres et l\'historique des victoires du Seclin Basket Club.',
};

export default function PalmaresPage() {
    return <PalmaresClient />;
}
