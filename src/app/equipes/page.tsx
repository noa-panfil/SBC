import { Metadata } from 'next';
import EquipesClient from './EquipesClient';

export const metadata: Metadata = {
    title: 'Équipes | Seclin Basket Club',
    description: 'Découvrez les équipes du SBC pour la saison 2026-2027 : Seniors, Jeunes, Loisirs...',
};

export default function EquipesPage() {
    return <EquipesClient />;
}
