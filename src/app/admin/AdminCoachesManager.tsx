"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Member {
    person_id: number;
    name: string;
    role: string;
    img: string | null;
}

interface Team {
    id: string;
    name: string;
    image: string | null;
    coaches: Member[];
}

export default function AdminCoachesManager({ teams: initialTeams }: { teams: any[] }) {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [draggedCoach, setDraggedCoach] = useState<{ personId: number, sourceTeamId: string } | null>(null);
    const [selectedCoach, setSelectedCoach] = useState<{ personId: number, sourceTeamId: string } | null>(null);
    const [targetTeamId, setTargetTeamId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Sync state if props change (re-fetch)
    useEffect(() => {
        setTeams(initialTeams);
    }, [initialTeams]);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleDragStart = (e: React.DragEvent, coach: Member, sourceTeamId: string) => {
        setDraggedCoach({ personId: coach.person_id, sourceTeamId });
        e.dataTransfer.effectAllowed = "move";
        // Ghost image styling usually handled by browser, but we store state to highlight valid targets
    };

    // CLICK-TO-MOVE LOGIC (Mobile Friendly)
    const handleCoachClick = (e: React.MouseEvent, coach: Member, sourceTeamId: string) => {
        e.stopPropagation(); // Avoid triggering team click
        if (selectedCoach?.personId === coach.person_id) {
            setSelectedCoach(null); // Deselect
        } else {
            setSelectedCoach({ personId: coach.person_id, sourceTeamId });
        }
    };

    const handleTeamClick = async (targetTeamId: string) => {
        if (!selectedCoach) return;
        if (selectedCoach.sourceTeamId === targetTeamId) {
            setSelectedCoach(null); // Clicked on same team -> Cancel
            return;
        }

        // Reuse handleDrop logic logic (refactored for reuse)
        await executeMove(selectedCoach.personId, selectedCoach.sourceTeamId, targetTeamId);
        setSelectedCoach(null);
    };

    const handleDragOver = (e: React.DragEvent, teamId: string) => {
        e.preventDefault(); // Necessary to allow dropping
        if (draggedCoach && draggedCoach.sourceTeamId !== teamId) {
            setTargetTeamId(teamId);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        setTargetTeamId(null);
    };

    const executeMove = async (coachId: number, oldTeamId: string, newTeamId: string) => {
        // Find the coach object
        const sourceTeamIndex = teams.findIndex(t => t.id === oldTeamId);
        const coachObj = teams[sourceTeamIndex].coaches.find(c => c.person_id === coachId);

        if (!coachObj) return;

        // Create new state (Optimistic)
        const newTeams = [...teams];

        // Remove from old team
        newTeams[sourceTeamIndex] = {
            ...newTeams[sourceTeamIndex],
            coaches: newTeams[sourceTeamIndex].coaches.filter(c => c.person_id !== coachId)
        };

        // Add to new team
        const targetTeamIndex = newTeams.findIndex(t => t.id === newTeamId);
        newTeams[targetTeamIndex] = {
            ...newTeams[targetTeamIndex],
            coaches: [...newTeams[targetTeamIndex].coaches, coachObj]
        };

        setTeams(newTeams);

        // API Call
        try {
            const res = await fetch('/api/admin/coaches/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personId: coachId,
                    oldTeamId: oldTeamId,
                    newTeamId: newTeamId
                })
            });

            if (res.ok) {
                showNotification(`Coach déplacé vers ${newTeams[targetTeamIndex].name} !`, 'success');
                router.refresh();
            } else {
                throw new Error("Failed to move");
            }
        } catch (error) {
            console.error(error);
            showNotification("Erreur lors du déplacement", 'error');
            setTeams(initialTeams); // Revert
        }
    };

    const handleDrop = async (e: React.DragEvent, newTeamId: string) => {
        e.preventDefault();
        setTargetTeamId(null);
        if (!draggedCoach || draggedCoach.sourceTeamId === newTeamId) return;

        await executeMove(draggedCoach.personId, draggedCoach.sourceTeamId, newTeamId);
        setDraggedCoach(null);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 relative">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <i className="fas fa-random text-sbc"></i> Mouvements des Coachs
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
                Glissez-déposez les coachs (PC) ou <strong>cliquez sur un coach puis sur sa nouvelle équipe</strong> (Mobile).
            </p>

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl text-white font-bold transition-all transform animate-bounce-in z-[100] flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} text-xl`}></i>
                    {notification.message}
                </div>
            )}

            <div className={`flex gap-4 overflow-x-auto pb-6 custom-scrollbar snap-x ${selectedCoach ? 'cursor-alias' : ''}`}>
                {teams.map(team => (
                    <div
                        key={team.id}
                        onClick={() => handleTeamClick(team.id)}
                        onDragOver={(e) => handleDragOver(e, team.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, team.id)}
                        className={`
                            min-w-[280px] w-[280px] bg-gray-50 rounded-xl border-2 transition-all duration-200 flex flex-col snap-start
                            ${targetTeamId === team.id ? 'border-sbc bg-green-50 shadow-lg scale-[1.02]' : 'border-dashed border-gray-200'}
                            ${(selectedCoach && selectedCoach.sourceTeamId !== team.id) ? 'hover:border-sbc hover:bg-green-50 cursor-pointer' : ''}
                            ${selectedCoach && selectedCoach.sourceTeamId === team.id ? 'opacity-50 grayscale' : ''}
                        `}
                    >
                        {/* Team Header */}
                        <div className="p-3 border-b border-gray-200 flex items-center gap-3 bg-white rounded-t-xl">
                            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                                <img src={team.image || "/img/default-team.png"} className="w-full h-full object-cover" alt={team.name} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-800 text-sm truncate">{team.name}</h3>
                                <div className="text-xs text-gray-400 font-medium">{team.coaches.length} coach(s)</div>
                            </div>
                        </div>

                        {/* Coaches List (Drop Zone) */}
                        <div className="p-3 flex-grow flex flex-col gap-2 min-h-[100px]">
                            {team.coaches.length === 0 && (
                                <div className="text-center text-gray-300 text-xs italic py-4">Aucun coach</div>
                            )}
                            {team.coaches.map(coach => (
                                <div
                                    key={coach.person_id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, coach, team.id)}
                                    onClick={(e) => handleCoachClick(e, coach, team.id)}
                                    className={`
                                        bg-white p-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing
                                        flex items-center gap-3 hover:shadow-md transition group select-none
                                        ${draggedCoach?.personId === coach.person_id ? 'opacity-50 ring-2 ring-sbc' : 'border-gray-200'}
                                        ${selectedCoach?.personId === coach.person_id ? 'ring-2 ring-sbc border-sbc bg-blue-50' : ''}
                                    `}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-50 flex-shrink-0">
                                        {coach.img ? (
                                            <img src={coach.img} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                                <i className="fas fa-user"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate">{coach.name}</p>
                                        <p className="text-xs text-sbc font-bold uppercase truncate">{coach.role}</p>
                                    </div>
                                    <div className="ml-auto text-gray-300 opacity-0 group-hover:opacity-100 transition">
                                        <i className="fas fa-arrows-alt"></i>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
