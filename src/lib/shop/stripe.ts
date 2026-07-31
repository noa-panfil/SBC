import Stripe from "stripe";

const clients = new Map<string, Stripe>();

export function getStripe(secretKey: string): Stripe {
    const existing = clients.get(secretKey);
    if (existing) return existing;
    const client = new Stripe(secretKey);
    clients.set(secretKey, client);
    return client;
}

