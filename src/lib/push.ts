import webpush from "web-push";
import pool from "./db";

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@seclinbasketclub.fr",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(userId: number, role: string, title: string, body: string, url: string) {
    try {
        const [rows]: any = await pool.query(
            "SELECT subscription FROM push_subscriptions WHERE user_id = ? AND role = ?",
            [userId, role]
        );

        const payload = JSON.stringify({ title, body, url });

        const promises = rows.map(async (row: any) => {
            const subscription = JSON.parse(row.subscription);
            try {
                await webpush.sendNotification(subscription, payload);
            } catch (err: any) {
                if (err.statusCode === 404 || err.statusCode === 410) {
                    // Subscription has expired or is no longer valid, delete it
                    await pool.query("DELETE FROM push_subscriptions WHERE subscription = ?", [row.subscription]);
                }
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error("Error sending push notifications:", error);
    }
}

export async function notifyCoachesForDesignation(match: any, designation: string) {
    if (!designation || designation === 'OPEN') return;

    try {
        const teamNames: string[] = [];

        // Parsing logic based on format: "TeamName {Roles} + TeamName2 {Roles}"
        // or "Table = 2 Joueurs/Parents TeamName"
        if (designation.startsWith("Table = 2 Joueurs/Parents ")) {
            teamNames.push(designation.replace("Table = 2 Joueurs/Parents ", "").trim());
        } else if (designation.includes("{")) {
            const parts = designation.split(" + ");
            parts.forEach(p => {
                const m = p.match(/^(.*) \{(.*)\}$/);
                if (m) teamNames.push(m[1].trim());
            });
        }

        if (teamNames.length === 0) return;

        // Find coaches for these teams
        // login_coachs has person_id
        // team_members links team_id to person_id
        // teams table has the names
        const [coaches]: any = await pool.query(`
            SELECT DISTINCT lc.id as userId
            FROM login_coachs lc
            JOIN team_members tm ON lc.person_id = tm.person_id
            JOIN teams t ON tm.team_id = t.id
            WHERE t.name IN (?)
        `, [teamNames]);

        for (const coach of coaches) {
            await sendPushNotification(
                coach.userId,
                'coach',
                "Désignation OTM",
                `Votre équipe est désignée pour l'OTM : ${match.category} vs ${match.opponent} le ${new Date(match.match_date).toLocaleDateString()} à ${match.match_time}`,
                '/coach'
            );
        }
    } catch (error) {
        console.error("Error in notifyCoachesForDesignation:", error);
    }
}

