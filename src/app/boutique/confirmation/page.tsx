import type { Metadata } from "next";
import ConfirmationClient from "./ConfirmationClient";

export const metadata: Metadata = { title: "Confirmation | Boutique SBC", robots: { index: false, follow: false } };
export default function ConfirmationPage() { return <ConfirmationClient />; }

