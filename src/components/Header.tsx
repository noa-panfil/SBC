"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUtilsOpen, setIsUtilsOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState("/img/logo.png");
    const pathname = usePathname();

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.site_logo_id) {
                    setLogoUrl(`/api/image/${data.site_logo_id}`);
                }
            })
            .catch(console.error);
    }, []);

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const isActive = (path: string) => {
        if (path === "/" && pathname === "/") return true;
        if (path !== "/" && pathname.startsWith(path)) return true;
        return false;
    };

    const linkClass = (path: string, mobile = false) => {
        const active = isActive(path);
        if (mobile) {
            return `hover:text-sbc-light py-2 border-b border-green-800/30 ${active ? 'text-sbc-light font-bold' : ''}`;
        }
        return `hover:text-sbc-light transition pb-1 border-b-2 hover:border-sbc-light ${active ? 'text-sbc-light border-sbc-light' : 'border-transparent'}`;
    };

    return (
        <nav className="bg-sbc-dark text-white shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center relative z-50 bg-sbc-dark">
                <Link href="/" className="flex items-center gap-3">
                    <img src={logoUrl} alt="Logo SBC" className="h-10 md:h-12 w-auto" />
                    <span className="text-lg md:text-2xl font-extrabold tracking-wider whitespace-nowrap">SECLIN BASKET CLUB</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden lg:flex space-x-5 items-center font-medium text-sm lg:text-base" id="desktop-menu">
                    <Link href="/" className={linkClass("/")}>Accueil</Link>
                    <Link href="/equipes" className={linkClass("/equipes")}>Équipes</Link>
                    <Link href="/palmares" className={linkClass("/palmares")}>Palmarès</Link>
                    <Link href="/informations" className={linkClass("/informations")}>Infos</Link>

                    {/* Utils Dropdown */}
                    <div className="relative group">
                        <button className={`flex items-center gap-1 ${isActive("/buvette") || isActive("/fonds-ecran") ? 'text-sbc-light border-sbc-light border-b-2' : 'hover:text-sbc-light border-transparent border-b-2 hover:border-sbc-light'} transition pb-1`}>
                            Utiles <i className="fas fa-angle-down text-xs mt-0.5 ml-1"></i>
                        </button>
                        <div className="absolute top-full text-left left-1/2 -translate-x-1/2 mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top pt-1">
                            <Link href="/buvette" className="block px-4 py-3 hover:bg-gray-50 hover:text-sbc transition text-sm font-bold border-b border-gray-100 flex items-center">
                                <i className="fas fa-utensils w-6 text-sbc/80"></i> Buvette
                            </Link>
                            <Link href="/fonds-ecran" className="block px-4 py-3 hover:bg-gray-50 hover:text-sbc transition text-sm font-bold flex items-center">
                                <i className="fas fa-mobile-alt w-6 text-sbc/80"></i> Fonds d'écran
                            </Link>
                            <Link href="/planning" className="block px-4 py-3 hover:bg-gray-50 hover:text-sbc transition text-sm font-bold flex items-center">
                                <i className="fas fa-calendar-alt w-6 text-sbc/80"></i> Planning
                            </Link>
                        </div>
                    </div>

                    <Link href="/boutique" className={linkClass("/boutique")}>Boutique</Link>
                    <Link href="/partenaires" className={linkClass("/partenaires")}>Partenaires</Link>
                    <Link href="/contact" className="bg-sbc hover:bg-sbc-light text-white px-4 py-2 rounded-full transition shadow-md">Contact</Link>

                    <div className="flex items-center gap-3 ml-2 pl-2 border-l border-gray-700">
                        <a href="https://www.facebook.com/share/1BfEPGLcYV/" target="_blank" className="text-gray-400 hover:text-[#1877F2] transition transform hover:scale-110">
                            <i className="fab fa-facebook text-xl"></i>
                        </a>
                        <a href="https://www.instagram.com/seclinbasketclub/" target="_blank" className="text-gray-400 hover:text-[#E4405F] transition transform hover:scale-110">
                            <i className="fab fa-instagram text-xl"></i>
                        </a>
                    </div>

                    <Link href="/login" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition shadow-md flex items-center gap-2">
                        <i className="fas fa-user text-xs"></i> Connexion
                    </Link>
                </div>

                {/* Burger Button */}
                <button
                    id="burger-btn"
                    className={`lg:hidden text-white text-2xl focus:outline-none transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : ''}`}
                    onClick={toggleMenu}
                >
                    <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`} id="burger-icon"></i>
                </button>
            </div>

            {/* Mobile Menu */}
            <div id="mobile-menu" className={`absolute top-full left-0 w-full bg-sbc-dark border-t border-green-800 shadow-2xl 
                    transition-all duration-300 ease-in-out transform 
                    ${isMobileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto z-40' : 'opacity-0 -translate-y-4 pointer-events-none -z-10'}`}>

                <div className="container mx-auto px-4 py-6 flex flex-col space-y-4 text-center text-lg">
                    <Link href="/" className={linkClass("/", true)} onClick={() => setIsMobileMenuOpen(false)}>Accueil</Link>
                    <Link href="/equipes" className={linkClass("/equipes", true)} onClick={() => setIsMobileMenuOpen(false)}>Nos Équipes</Link>
                    <Link href="/palmares" className={linkClass("/palmares", true)} onClick={() => setIsMobileMenuOpen(false)}>Palmarès</Link>
                    <Link href="/informations" className={linkClass("/informations", true)} onClick={() => setIsMobileMenuOpen(false)}>Infos Pratiques</Link>

                    {/* Utils Mobile Accordion */}
                    <div className="w-full">
                        <button
                            onClick={() => setIsUtilsOpen(!isUtilsOpen)}
                            className={`${linkClass("/buvette", true)} w-full flex items-center justify-center gap-2`}
                        >
                            Utiles <i className={`fas fa-chevron-down text-sm transition-transform duration-300 ${isUtilsOpen ? 'rotate-180' : ''}`}></i>
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 bg-sbc-dark/50 ${isUtilsOpen ? 'max-h-52 opacity-100 py-2' : 'max-h-0 opacity-0 py-0'}`}>
                            <Link href="/buvette" className="block py-2 text-gray-300 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                                <i className="fas fa-utensils w-6 text-center"></i> Buvette
                            </Link>
                            <Link href="/fonds-ecran" className="block py-2 text-gray-300 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                                <i className="fas fa-mobile-alt w-6 text-center"></i> Fonds d'écran
                            </Link>
                            <Link href="/planning" className="block py-2 text-gray-300 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                                <i className="fas fa-calendar-alt w-6 text-center"></i> Planning
                            </Link>
                        </div>
                    </div>

                    <Link href="/boutique" className={linkClass("/boutique", true)} onClick={() => setIsMobileMenuOpen(false)}>Boutique</Link>
                    <Link href="/partenaires" className={linkClass("/partenaires", true)} onClick={() => setIsMobileMenuOpen(false)}>Partenaires</Link>
                    <Link href="/contact" className="text-sbc-light font-bold py-2 bg-green-900/30 rounded-lg mt-2" onClick={() => setIsMobileMenuOpen(false)}>Nous Contacter</Link>
                    <Link href="/login" className="text-white font-bold py-2 bg-white/10 rounded-lg flex items-center justify-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                        <i className="fas fa-lock text-sm"></i> Connexion
                    </Link>

                    <div className="flex justify-center gap-6 pt-4 border-t border-green-800/30">
                        <a href="https://www.facebook.com/share/1BfEPGLcYV/" target="_blank" className="text-white hover:text-[#1877F2] transition">
                            <i className="fab fa-facebook text-2xl"></i>
                        </a>
                        <a href="https://www.instagram.com/seclinbasketclub/" target="_blank" className="text-white hover:text-[#E4405F] transition">
                            <i className="fab fa-instagram text-2xl"></i>
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
}
