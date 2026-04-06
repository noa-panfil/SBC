import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import VolunteerDashboardWrapper from "./VolunteerDashboardWrapper";

async function getOtmMatches(days?: number) {
    try {
        let sql = `
            SELECT 
                m.*,
                p_scorer.firstname AS scorer_firstname, p_scorer.lastname AS scorer_lastname,
                v_scorer.name AS v_scorer_name,
                p_timer.firstname AS timer_firstname, p_timer.lastname AS timer_lastname,
                v_timer.name AS v_timer_name,
                p_hall.firstname AS hall_firstname, p_hall.lastname AS hall_lastname,
                v_hall.name AS v_hall_name,
                p_bar.firstname AS bar_firstname, p_bar.lastname AS bar_lastname,
                v_bar.name AS v_bar_name,
                p_ref1.firstname AS ref1_firstname, p_ref1.lastname AS ref1_lastname,
                v_ref1.name AS v_ref1_name,
                p_ref2.firstname AS ref2_firstname, p_ref2.lastname AS ref2_lastname,
                v_ref2.name AS v_ref2_name
            FROM otm_matches m
            LEFT JOIN persons p_scorer ON m.scorer_id = p_scorer.id
            LEFT JOIN volunteers v_scorer ON m.scorer_id = (v_scorer.id * -1)
            LEFT JOIN persons p_timer ON m.timer_id = p_timer.id
            LEFT JOIN volunteers v_timer ON m.timer_id = (v_timer.id * -1)
            LEFT JOIN persons p_hall ON m.hall_manager_id = p_hall.id
            LEFT JOIN volunteers v_hall ON m.hall_manager_id = (v_hall.id * -1)
            LEFT JOIN persons p_bar ON m.bar_manager_id = p_bar.id
            LEFT JOIN volunteers v_bar ON m.bar_manager_id = (v_bar.id * -1)
            LEFT JOIN persons p_ref1 ON m.referee_id = p_ref1.id
            LEFT JOIN volunteers v_ref1 ON m.referee_id = (v_ref1.id * -1)
            LEFT JOIN persons p_ref2 ON m.referee_2_id = p_ref2.id
            LEFT JOIN volunteers v_ref2 ON m.referee_2_id = (v_ref2.id * -1)
            WHERE (m.is_prefilled = 0 OR m.is_prefilled IS NULL)
        `;
        const params: any[] = [];

        if (days) {
            sql += ` AND m.match_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 2 DAY) AND DATE_ADD(CURDATE(), INTERVAL ? DAY)`;
            params.push(days);
        }

        sql += ` ORDER BY m.match_date ASC, m.match_time ASC`;

        const [rows] = await pool.query<RowDataPacket[]>(sql, params);
        
        return rows.map((row: any) => {
            const getName = (prefix: string) => {
                if (row[`${prefix}_firstname`]) {
                    return `${row[`${prefix}_lastname`].toUpperCase()} ${row[`${prefix}_firstname`]}`;
                }
                if (row[`v_${prefix}_name`]) {
                    return row[`v_${prefix}_name`];
                }
                return null;
            };

            return {
                ...row,
                match_date: row.match_date.toISOString(),
                created_at: row.created_at.toISOString(),
                scorer: getName('scorer'),
                timer: getName('timer'),
                hall_manager: getName('hall'),
                bar_manager: getName('bar'),
                referee: getName('ref1'),
                referee_2: getName('ref2'),
            };
        });
    } catch (e) {
        console.error("Error fetching OTM matches", e);
        return [];
    }
}

export default async function VolunteerDashboard() {
    const session: any = await getServerSession(authOptions);

    if (!session || session.user.role !== 'volunteer') {
        redirect("/login");
    }

    const volunteerIdDb = session.user.volunteerId;
    const currentPersonId = volunteerIdDb ? -(volunteerIdDb) : null;

    const otmMatches = await getOtmMatches();

    let volunteerImageId = null;
    if (volunteerIdDb) {
        try {
            const [rows] = await pool.query<RowDataPacket[]>("SELECT image_id FROM volunteers WHERE id = ?", [volunteerIdDb]);
            if (rows.length > 0) {
                volunteerImageId = rows[0].image_id;
            }
        } catch (e) {
            console.error("Error fetching volunteer details", e);
        }
    }

    return (
        <VolunteerDashboardWrapper 
            session={session}
            otmMatches={otmMatches}
            currentPersonId={currentPersonId}
            volunteerImageId={volunteerImageId}
        />
    );
}
