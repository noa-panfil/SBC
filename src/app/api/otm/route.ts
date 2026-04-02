import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    console.log("OTM GET Session:", session); // DEBUG
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch matches with joined names for officials
        const [rows] = await pool.query(`
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
            ORDER BY match_date ASC, match_time ASC
        `);

        // Map IDs to display names for frontend
        const processedRows = (rows as any[]).map(row => {
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
                scorer: getName('scorer'),
                timer: getName('timer'),
                hall_manager: getName('hall'),
                bar_manager: getName('bar'),
                referee: getName('ref1'),
                referee_2: getName('ref2'),
            };
        });

        return NextResponse.json(processedRows);
    } catch (error: any) {
        console.error("Error fetching OTM matches:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session: any = await getServerSession(authOptions);
    console.log("OTM POST Session:", session); // DEBUG
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            category, is_white_jersey, match_date, match_time,
            opponent, match_code, designation, match_type,
            scorer_id, timer_id, hall_manager_id, bar_manager_id, referee_id, referee_2_id,
            scorer, timer, hall_manager, bar_manager, referee, referee_2
        } = body;

        if (!category || !match_date || !match_time || !opponent) {
            return NextResponse.json({ error: "Catégorie, Date, Heure et Adversaire requis" }, { status: 400 });
        }

        // Calculate meeting time (30 mins before)
        // Assuming match_time is "HH:MM"
        let meeting_time = body.meeting_time;
        if (!meeting_time && match_time) {
            const [h, m] = match_time.split(':').map(Number);
            const date = new Date();
            date.setHours(h, m - 30);
            meeting_time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }

        const is_club_referee = body.is_club_referee || false;
        const type = match_type || 'Championnat';
        const is_featured = body.is_featured || false;

        if (is_featured) {
            const [existing] = await pool.query<any[]>(
                "SELECT id FROM otm_matches WHERE is_featured = 1 AND YEARWEEK(match_date, 1) = YEARWEEK(?, 1)",
                [match_date]
            );
            if (existing.length > 0) {
                return NextResponse.json({ error: "Un match à la une existe déjà pour cette semaine" }, { status: 400 });
            }
        }

        const [result]: any = await pool.query(`
            INSERT INTO otm_matches (
                category, is_white_jersey, match_date, match_time, meeting_time, 
                opponent, match_code, designation, is_club_referee, match_type, is_featured,
                scorer_id, timer_id, hall_manager_id, bar_manager_id, referee_id, referee_2_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            category, is_white_jersey || false, match_date, match_time, meeting_time,
            opponent, match_code, designation, is_club_referee, type, is_featured,
            scorer_id || null, timer_id || null, hall_manager_id || null, bar_manager_id || null, referee_id || null, referee_2_id || null
        ]);

        if (designation) {
            import("@/lib/push").then(({ notifyCoachesForDesignation }) => {
                notifyCoachesForDesignation({ category, opponent, match_date, match_time }, designation);
            });
        }


        return NextResponse.json({
            id: result.insertId,
            category,
            is_white_jersey: is_white_jersey || false,
            match_date,
            match_time,
            meeting_time,
            opponent,
            match_code,
            designation,
            is_club_referee,
            match_type: type,
            scorer: null,
            timer: null,
            hall_manager: null,
            bar_manager: null,
            referee: null,
            referee_2: null
        });
    } catch (error: any) {
        console.error("Error creating OTM match:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
