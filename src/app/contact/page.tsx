import { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
    title: 'Contact | Seclin Basket Club',
    description: 'Une question ? Contactez le Seclin Basket Club par email ou via notre formulaire.',
};

export default function ContactPage() {
    return <ContactClient />;
}
