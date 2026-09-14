import type { Metadata } from "next";
import PartenairesClient from "./PartenairesClient";

export const metadata: Metadata = {
    title: "Nos partenaires | Seclin Basket Club",
    description: "Découvrez les entreprises et acteurs locaux qui soutiennent le Seclin Basket Club et contribuent à son projet sportif.",
};

export default function PartenairesPage() {
    return <PartenairesClient />;
}
