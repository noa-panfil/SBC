import { Metadata } from 'next';
import PlanningApp from './PlanningApp';

export const metadata: Metadata = {
  title: 'Planning Saison Prochaine - Coachs | SBC',
  description: 'Page de saisie des disponibilités pour les coachs du Seclin Basket Club',
};

export default function CoachPlanningPage() {
  return <PlanningApp />;
}
