type ShopEnv = {
    appUrl: string;
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    resendApiKey: string;
    fromEmail: string;
    replyToEmail: string;
    notificationEmail: string;
};

function required(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`La variable d'environnement ${name} est obligatoire.`);
    return value;
}

export function getShopEnv(): ShopEnv {
    const appUrl = required("NEXT_PUBLIC_APP_URL");
    try {
        new URL(appUrl);
    } catch {
        throw new Error("NEXT_PUBLIC_APP_URL doit être une URL absolue valide.");
    }

    return {
        appUrl: appUrl.replace(/\/$/, ""),
        stripeSecretKey: required("STRIPE_SECRET_KEY"),
        stripeWebhookSecret: required("STRIPE_WEBHOOK_SECRET"),
        resendApiKey: required("RESEND_API_KEY"),
        fromEmail: process.env.SHOP_FROM_EMAIL?.trim() || "Seclin Basket Club <commandes@seclinbasketclub.fr>",
        replyToEmail: process.env.SHOP_REPLY_TO_EMAIL?.trim() || "seclinbc@gmail.com",
        notificationEmail: process.env.SHOP_NOTIFICATION_EMAIL?.trim() || "seclinbc@gmail.com",
    };
}

export function getCheckoutEnv(): Pick<ShopEnv, "appUrl" | "stripeSecretKey"> {
    const appUrl = required("NEXT_PUBLIC_APP_URL");
    try {
        new URL(appUrl);
    } catch {
        throw new Error("NEXT_PUBLIC_APP_URL doit être une URL absolue valide.");
    }
    return { appUrl: appUrl.replace(/\/$/, ""), stripeSecretKey: required("STRIPE_SECRET_KEY") };
}

