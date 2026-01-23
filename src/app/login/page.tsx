"use client";

import { signIn, getSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [logoUrl, setLogoUrl] = useState("/img/logo.png");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        signOut({ redirect: false });
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.site_logo_id) {
                    setLogoUrl(`/api/image/${data.site_logo_id}`);
                }
            })
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError("Email ou mot de passe incorrect");
        } else {
            const session: any = await getSession();
            if (session?.user?.role === 'coach') {
                router.push("/coach");
            } else {
                router.push("/admin");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 overflow-hidden relative">
            {/* Abstract Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sbc blur-[120px] rounded-full"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 blur-[120px] rounded-full"></div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20 relative z-10 transition-all hover:shadow-sbc/10">
                <div className="text-center mb-10">
                    <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center transform hover:scale-105 transition duration-500">
                        <img src={logoUrl} alt="Logo SBC" className="w-full h-full object-contain drop-shadow-2xl" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Connexion</h1>
                    <p className="text-gray-400 font-medium mt-2 italic">Seclin Basket Club</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 mb-6 rounded-2xl text-sm font-bold flex items-center gap-3 animate-head-shake">
                        <i className="fas fa-exclamation-circle text-lg"></i>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 text-xs font-black uppercase tracking-widest mb-2 ml-4">Email</label>
                        <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-sbc transition">
                                <i className="fas fa-envelope"></i>
                            </span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 pl-14 pr-6 py-4 rounded-2xl text-white focus:ring-2 focus:ring-sbc focus:bg-white/10 outline-none transition placeholder-gray-600"
                                placeholder="votre@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-xs font-black uppercase tracking-widest mb-2 ml-4">Mot de passe</label>
                        <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-sbc transition">
                                <i className="fas fa-lock"></i>
                            </span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 pl-14 pr-6 py-4 rounded-2xl text-white focus:ring-2 focus:ring-sbc focus:bg-white/10 outline-none transition placeholder-gray-600"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center ml-1">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-sbc checked:border-sbc transition focus:ring-2 focus:ring-sbc/50 outline-none appearance-none cursor-pointer"
                                defaultChecked
                            />
                            <i className="fas fa-check text-white absolute ml-1 text-xs pointer-events-none opacity-0 peer-checked:opacity-100"></i>
                            <span className="text-sm font-bold text-gray-400 group-hover:text-white transition select-none">Rester connecté</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-sbc text-white font-black py-4 rounded-2xl hover:bg-sbc-light transition shadow-lg shadow-sbc/30 active:scale-95 flex items-center justify-center gap-3 text-lg"
                    >
                        Connexion <i className="fas fa-arrow-right text-sm"></i>
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-gray-500 hover:text-white text-sm font-bold transition">
                        <i className="fas fa-arrow-left mr-2"></i> Retour au site
                    </Link>
                </div>
            </div>
        </div>
    );
}
