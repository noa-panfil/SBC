"use client";

import { useState, useEffect } from "react";

interface Official {
    id: number;
    fullname: string;
    team: string | null;
    image_id: number | null;
    role: string | null;
}

interface BureauMember {
    id: number;
    fullname: string;
    role: string;
    image_id: number | null;
}

export default function BureauManager({ officials }: { officials: Official[] }) {
    const [members, setMembers] = useState<BureauMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedPerson, setSelectedPerson] = useState<Official | null>(null);
    const [role, setRole] = useState("");
    const [suggestedRoles] = useState([
        "Président",
        "Vice-Président",
        "Trésorier",
        "Secrétaire",
        "Communication",
        "Responsable Technique",
        "Membre du Bureau"
    ]);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await fetch('/api/bureau');
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (error) {
            console.error("Error fetching bureau members:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPerson || !role.trim()) return;

        try {
            const res = await fetch('/api/bureau', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedPerson.id, role: role.trim() })
            });

            if (res.ok) {
                setRole("");
                setSelectedPerson(null);
                setSearch("");
                fetchMembers();
            } else {
                alert("Erreur lors de l'ajout du membre.");
            }
        } catch (error) {
            console.error("Error adding bureau member:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Voulez-vous vraiment retirer ce membre du bureau ?")) return;

        try {
            const res = await fetch(`/api/bureau/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMembers(prev => prev.filter(m => m.id !== id));
            } else {
                alert("Erreur lors de la suppression.");
            }
        } catch (error) {
            console.error("Error deleting bureau member:", error);
        }
    };

    const filteredOfficials = search.trim() ? officials.filter(o =>
        o.fullname.toLowerCase().includes(search.toLowerCase()) &&
        !members.some(m => m.fullname === o.fullname)
    ).slice(0, 5) : [];

    if (loading) return <div className="p-6 text-center text-gray-500">Chargement...</div>;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Associer une personne au Bureau</h3>
            <form onSubmit={handleSubmit} className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher une personne</label>
                    {selectedPerson ? (
                        <div className="flex items-center gap-3 p-2 bg-sbc/10 rounded-lg border border-sbc border-dashed relative">
                            <div className="w-10 h-10 rounded-full bg-white overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                                {selectedPerson.image_id ? (
                                    <img src={`/api/image/${selectedPerson.image_id}`} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <i className="fas fa-user text-gray-300"></i>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-900 truncate">{selectedPerson.fullname}</p>
                                <p className="text-[10px] text-gray-500 truncate uppercase mt-0.5">{selectedPerson.team || selectedPerson.role || 'Indépendant'}</p>
                            </div>
                            <button type="button" onClick={() => { setSelectedPerson(null); setSearch(""); }} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg shrink-0 transition">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:border-sbc outline-none transition"
                                placeholder="Nom de la personne..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {search.trim() && filteredOfficials.length > 0 && (
                                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-gray-100">
                                    {filteredOfficials.map(o => (
                                        <button
                                            key={o.id}
                                            type="button"
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition"
                                            onClick={() => setSelectedPerson(o)}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                                {o.image_id ? (
                                                    <img src={`/api/image/${o.image_id}`} alt="" className="w-full h-full object-cover" />
                                                ) : <i className="fas fa-user text-gray-300 text-xs"></i>}
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className="font-bold text-gray-900 text-sm truncate">{o.fullname}</span>
                                                <span className="text-gray-500 text-[10px] uppercase tracking-wide truncate">{o.team || o.role || 'Indépendant'}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {search.trim() && filteredOfficials.length === 0 && (
                                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 text-center text-gray-500 text-sm italic">
                                    Aucune personne trouvée ou déjà ajoutée au bureau.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-4 items-end">
                    <div className="flex-grow relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rôle au bureau</label>
                        <input
                            type="text"
                            list="bureau-roles"
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-sbc outline-none transition"
                            placeholder="Ex: Président"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            required
                        />
                        <datalist id="bureau-roles">
                            {suggestedRoles.map(r => <option key={r} value={r} />)}
                        </datalist>
                    </div>

                    <button type="submit" disabled={!selectedPerson || !role.trim()} className="bg-sbc hover:bg-sbc-dark disabled:opacity-50 text-white font-bold h-[42px] px-6 rounded-xl transition shadow-sm shrink-0 uppercase tracking-wider text-sm flex items-center">
                        <i className="fas fa-plus mr-2"></i> Ajouter
                    </button>
                </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map(member => (
                    <div key={member.id} className="bg-white border rounded-xl overflow-hidden shadow-sm flex items-center p-3 relative group">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0 border-2 border-white shadow-sm mr-3">
                            {member.image_id ? (
                                <img src={`/api/image/${member.image_id}`} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                    <i className="fas fa-user text-gray-300 drop-shadow-sm"></i>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-gray-900 leading-tight truncate">{member.fullname}</span>
                            <span className="text-sbc text-xs uppercase font-black tracking-widest truncate">{member.role}</span>
                        </div>
                        <button
                            onClick={() => handleDelete(member.id)}
                            className="absolute top-2 right-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white w-8 h-8 rounded-lg transition opacity-0 group-hover:opacity-100 flex items-center justify-center focus:opacity-100"
                            title="Retirer du bureau"
                        >
                            <i className="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                ))}

                {members.length === 0 && (
                    <div className="col-span-full py-10 text-center text-gray-400 italic">
                        Aucun membre du bureau. Recherchez une personne pour l'ajouter.
                    </div>
                )}
            </div>
        </div>
    );
}
