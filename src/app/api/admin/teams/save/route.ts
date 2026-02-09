import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await request.json();
        const { teamId, bannerId, storyImageId, category, schedule, members, deletedMemberIds } = body;

        // 1. Update Team Info (Banner, Story Image, Category, Schedule)
        // We build a dynamic update query or just update all 4 fields.
        await pool.query(
            'UPDATE teams SET image_id = ?, story_image_id = ?, category = ?, schedule = ? WHERE id = ?',
            [bannerId, storyImageId, category, schedule, teamId]
        );

        // 2. Handle Deletions
        if (deletedMemberIds && deletedMemberIds.length > 0) {
            // We only delete the link in team_members to keep history, or delete person if completely new?
            // For now, let's delete from team_members.
            // Note: members have 'person_id' as unique key in this context usually.
            // But verify: are we passing person_ids or member IDs?
            // Let's assume we pass person_ids to remove from this team.
            const placeholders = deletedMemberIds.map(() => '?').join(',');
            await pool.query(
                `DELETE FROM team_members WHERE team_id = ? AND person_id IN (${placeholders})`,
                [teamId, ...deletedMemberIds]
            );
        }

        // 3. Handle Updates & Additions
        for (const member of members) {
            // member: { person_id (optional for new), name, num, role, image_id }

            let personId = member.person_id;

            if (personId && !member.isNew) {
                // Update Existing Member

                // Update Number in team_members
                await pool.query(
                    'UPDATE team_members SET number = ? WHERE team_id = ? AND person_id = ?',
                    [member.num, teamId, personId]
                );

                // Update Image and Birthdate in persons
                // We construct dynamic update query or just update both if presents
                await pool.query(
                    'UPDATE persons SET image_id = IFNULL(?, image_id), birthdate = ? WHERE id = ?',
                    [member.image_id || null, member.birthISO || null, personId]
                );

            } else {
                // Create New Person & Add to Team
                // We need to split name into first/last
                const nameParts = member.name.trim().split(' ');
                const firstname = nameParts[0];
                const lastname = nameParts.slice(1).join(' ');

                const [res] = await pool.query<ResultSetHeader>(
                    'INSERT INTO persons (firstname, lastname, birthdate, image_id) VALUES (?, ?, ?, ?)',
                    [firstname, lastname, member.birthISO || null, member.image_id || null]
                );

                personId = res.insertId;

                // Add to team
                await pool.query(
                    'INSERT INTO team_members (team_id, person_id, role, number) VALUES (?, ?, ?, ?)',
                    [teamId, personId, member.role || 'Joueur', member.num || 0]
                );
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Save Team Error:', error);
        return NextResponse.json({ error: 'Failed to save team changes' }, { status: 500 });
    }
}
