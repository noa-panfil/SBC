"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminMaintenanceManagerProps = {
    initialEnabled: boolean;
};

export default function AdminMaintenanceManager({ initialEnabled }: AdminMaintenanceManagerProps) {
    const router = useRouter();
    const [enabled, setEnabled] = useState(initialEnabled);
    const [savedEnabled, setSavedEnabled] = useState(initialEnabled);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const hasChanged = enabled !== savedEnabled;

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

        try {
            const response = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ maintenance_mode: enabled }),
            });

            if (!response.ok) {
                throw new Error("La mise à jour a échoué");
            }

            setSavedEnabled(enabled);
            setMessage({
                type: "success",
                text: enabled
                    ? "Mode maintenance activé : les visiteurs voient désormais la page d'attente."
                    : "Le site public est de nouveau accessible.",
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Impossible de modifier le mode maintenance." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${savedEnabled ? "border-amber-300" : "border-emerald-200"}`}>
            <div className={`flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between ${savedEnabled ? "bg-amber-50" : "bg-emerald-50"}`}>
                <div className="flex items-center gap-4">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl text-white shadow-lg ${savedEnabled ? "bg-amber-500 shadow-amber-200" : "bg-emerald-600 shadow-emerald-200"}`}>
                        <i className={`fas ${savedEnabled ? "fa-tools" : "fa-check-circle"}`} />
                    </span>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">État du site</p>
                        <h2 className="text-xl font-black text-gray-900">
                            {savedEnabled ? "Maintenance en cours" : "Site public en ligne"}
                        </h2>
                    </div>
                </div>
                <span className={`w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest ${savedEnabled ? "bg-amber-200 text-amber-900" : "bg-emerald-200 text-emerald-900"}`}>
                    {savedEnabled ? "Maintenance" : "En ligne"}
                </span>
            </div>

            <div className="p-6">
                <p className="mb-5 max-w-3xl text-sm leading-relaxed text-gray-600">
                    En maintenance, toutes les pages publiques sont redirigées vers la page « Temps mort ! ». La connexion et l&apos;administration restent accessibles pour pouvoir remettre le site en ligne.
                </p>

                <fieldset>
                    <legend className="mb-3 text-sm font-black text-gray-900">Choisir la disponibilité du site</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition ${!enabled ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100" : "border-gray-100 hover:border-gray-200"}`}>
                            <input
                                type="radio"
                                name="maintenance-mode"
                                value="online"
                                checked={!enabled}
                                onChange={() => setEnabled(false)}
                                className="h-5 w-5 accent-emerald-600"
                            />
                            <span>
                                <span className="block font-black text-gray-900">Site ouvert</span>
                                <span className="text-xs text-gray-500">Les visiteurs accèdent normalement au site.</span>
                            </span>
                        </label>

                        <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition ${enabled ? "border-amber-500 bg-amber-50 ring-4 ring-amber-100" : "border-gray-100 hover:border-gray-200"}`}>
                            <input
                                type="radio"
                                name="maintenance-mode"
                                value="maintenance"
                                checked={enabled}
                                onChange={() => setEnabled(true)}
                                className="h-5 w-5 accent-amber-600"
                            />
                            <span>
                                <span className="block font-black text-gray-900">Mode maintenance</span>
                                <span className="text-xs text-gray-500">Les visiteurs voient la page « Temps mort ! ».</span>
                            </span>
                        </label>
                    </div>
                </fieldset>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div aria-live="polite" className="min-h-5 text-sm font-bold">
                        {message && (
                            <span className={message.type === "success" ? "text-emerald-700" : "text-red-600"}>
                                <i className={`fas ${message.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} mr-2`} />
                                {message.text}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !hasChanged}
                        className={`rounded-xl px-6 py-3 text-sm font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none ${enabled ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                    >
                        {isSaving ? (
                            <><i className="fas fa-spinner fa-spin mr-2" />Mise à jour...</>
                        ) : enabled ? (
                            <><i className="fas fa-tools mr-2" />Activer la maintenance</>
                        ) : (
                            <><i className="fas fa-play mr-2" />Remettre le site en ligne</>
                        )}
                    </button>
                </div>
            </div>
        </section>
    );
}
