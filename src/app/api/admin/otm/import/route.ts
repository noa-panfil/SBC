import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from '@/lib/db';
import * as XLSX from 'xlsx';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Mapping {
    id: number;
    division_excel: string;
    team_name_excel: string;
    team_id: number;
}

interface Team {
    id: number;
    name: string;
    category: string;
}

function cleanTeamName(name: any): string {
    if (!name) return "";
    let cleaned = name.toString();

    // loops to handle cases like "Team - 2 (3)" -> "Team - 2" -> "Team"
    let prev = "";
    while (cleaned !== prev) {
        prev = cleaned;
        // Remove ending (number) like (1), (35)
        cleaned = cleaned.replace(/\s*\(\d+\)$/, "");
        // Remove ending number after dash like - 1, - 2
        cleaned = cleaned.replace(/\s*-\s*\d+$/, "");
        // Remove trailing punctuation like - or . or ,
        cleaned = cleaned.replace(/\s*[-.,;:]\s*$/, "");
        cleaned = cleaned.trim();
    }

    return cleaned;
}

export async function POST(req: NextRequest) {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) {
            return NextResponse.json({ error: "Empty or invalid file" }, { status: 400 });
        }

        // 1. Fetch Mappings & Teams
        const [mappingsResult] = await pool.query<RowDataPacket[]>('SELECT * FROM division_mappings');
        const mappings = mappingsResult as unknown as Mapping[];
        const [teams] = await pool.query<RowDataPacket[]>('SELECT id, name, category FROM teams');

        const headers = rows[0].map((h: any) => h?.toString().toLowerCase().trim());
        const colIdx = {
            division: headers.findIndex((h: string) => h.includes('division') || h.includes('poule')),
            date: headers.findIndex((h: string) => h.includes('date')),
            time: headers.findIndex((h: string) => h.includes('heure')),
            home: headers.findIndex((h: string) => h.includes('equipe 1') || h.includes('équipe 1') || h.includes('domicile')),
            visitor: headers.findIndex((h: string) => h.includes('equipe 2') || h.includes('équipe 2') || h.includes('visiteur')),
            location: headers.findIndex((h: string) => h.includes('lieu') || h.includes('salle')),
            match_code: headers.findIndex((h: string) => h.includes('rencontre') || h.includes('code')),
        };

        if (colIdx.division === -1 || colIdx.date === -1 || colIdx.time === -1 || colIdx.home === -1 || colIdx.visitor === -1) {
            return NextResponse.json({ error: "Colonnes manquantes (Division, Date, Heure, Equipes requis)" }, { status: 400 });
        }

        let importedCount = 0;
        let skippedCount = 0;
        let duplicateCount = 0;
        const duplicateDetails: string[] = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const division = row[colIdx.division];
            // Skip rows without division
            if (!division) {
                continue;
            }

            const potentialMappings = mappings.filter((m: any) =>
                m.division_excel && division.includes(m.division_excel)
            );

            if (potentialMappings.length === 0) {
                skippedCount++;
                continue;
            }

            const homeTeamName = row[colIdx.home];
            const visitorTeamName = row[colIdx.visitor];

            let matchedMapping: Mapping | null = null;
            let isHome = false;

            for (const m of potentialMappings) {
                if (homeTeamName && homeTeamName.includes(m.team_name_excel)) {
                    matchedMapping = m;
                    isHome = true;
                    break;
                }
                if (visitorTeamName && visitorTeamName.includes(m.team_name_excel)) {
                    matchedMapping = m;
                    isHome = false;
                    break;
                }
            }

            if (!matchedMapping) {
                skippedCount++;
                continue;
            }

            const team = teams.find((t: any) => t.id === matchedMapping!.team_id);
            if (!team) continue;

            // Date parsing
            let dateStr = row[colIdx.date];
            if (typeof dateStr === 'number') {
                const dateInfo = XLSX.SSF.parse_date_code(dateStr);
                dateStr = `${dateInfo.y}-${String(dateInfo.m).padStart(2, '0')}-${String(dateInfo.d).padStart(2, '0')}`;
            } else if (typeof dateStr === 'string') {
                const parts = dateStr.split('/');
                if (parts.length === 3) dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }

            // Time parsing
            let timeStr = row[colIdx.time];
            if (typeof timeStr === 'number') {
                const totalSeconds = Math.round(timeStr * 86400);
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }

            const matchCode = colIdx.match_code !== -1 ? row[colIdx.match_code] : `IMP-${Date.now()}-${i}`;
            const opponent = cleanTeamName(isHome ? visitorTeamName : homeTeamName);
            const location = colIdx.location !== -1 ? row[colIdx.location] : '';

            if (isHome) {
                const [existing] = await pool.query<RowDataPacket[]>(
                    'SELECT id FROM otm_matches WHERE match_date = ? AND match_time = ? AND category = ? AND opponent = ?',
                    [dateStr, timeStr, team.name, opponent]
                );

                if (existing.length === 0) {
                    const [h, m] = timeStr.split(':').map(Number);
                    const d = new Date(); d.setHours(h, m - 30);
                    const meetingTime = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                    await pool.query(
                        `INSERT INTO otm_matches (
                             category, is_white_jersey, match_date, match_time, meeting_time, 
                             opponent, match_code, designation, is_club_referee, match_type, is_featured, is_prefilled
                         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [team.name, false, dateStr, timeStr, meetingTime, opponent, matchCode, '', false, 'Championnat', false, true]
                    );
                    importedCount++;
                } else {
                    duplicateCount++;
                    duplicateDetails.push(`${team.name} vs ${opponent} (${dateStr})`);
                }
            } else {
                const [existing] = await pool.query<RowDataPacket[]>(
                    'SELECT id FROM external_matches WHERE match_date = ? AND match_time = ? AND team_id = ? AND opponent = ?',
                    [dateStr, timeStr, team.id, opponent]
                );

                if (existing.length === 0) {
                    await pool.query(
                        `INSERT INTO external_matches (
                             team_id, match_code, match_date, match_time, category, opponent, location, status
                         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [team.id, matchCode, dateStr, timeStr, team.name, opponent, location, 'scheduled']
                    );
                    importedCount++;
                } else {
                    duplicateCount++;
                    duplicateDetails.push(`${team.name} vs ${opponent} (${dateStr})`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            imported: importedCount,
            duplicated: duplicateCount,
            skipped: skippedCount,
            duplicateDetails
        });

    } catch (error: any) {
        console.error("Import Error:", error);
        return NextResponse.json({ error: error.message || "Failed to import" }, { status: 500 });
    }
}
