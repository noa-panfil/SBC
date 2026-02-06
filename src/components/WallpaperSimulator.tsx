"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// --- CONFIGURATION ---

const WALLPAPERS = [
    { id: 1, src: "/1.jpeg", title: "SBC Vert", color: "from-green-600 to-green-900" },
    { id: 2, src: "/2.jpeg", title: "SBC Accessoire", color: "from-gray-800 to-black" },
    { id: 3, src: "/3.jpeg", title: "SBC Griffe Bleu", color: "from-orange-600 to-red-900" },
    { id: 4, src: "/4.jpeg", title: "SBC Fumée Verte", color: "from-blue-600 to-blue-900" },
    { id: 5, src: "/5.jpeg", title: "SBC Serpent", color: "from-gray-700 to-gray-900" },
    { id: 6, src: "/6.jpeg", title: "SBC Griffe Noire", color: "from-green-500 to-green-800" },
    { id: 7, src: "/7.jpeg", title: "SBC Accessoire 2", color: "from-green-800 to-black" },
];

// Comprehensive device list ~10 years
const DEVICES_BY_BRAND = {
    Apple: [
        // iPhone 16 / 15 Series (Dynamic Island)
        { id: "iphone15pro", name: "iPhone 15/16 Pro / Max", width: 305, height: 660, radius: "45px", bezel: "8px", notchType: "island" },
        { id: "iphone15", name: "iPhone 15/16 / Plus", width: 305, height: 660, radius: "45px", bezel: "10px", notchType: "island" },

        // iPhone 14 Series
        { id: "iphone14pro", name: "iPhone 14 Pro / Max", width: 305, height: 660, radius: "45px", bezel: "8px", notchType: "island" },
        { id: "iphone14", name: "iPhone 14 / Plus", width: 300, height: 650, radius: "40px", bezel: "10px", notchType: "notch" },

        // iPhone 13 Series
        { id: "iphone13pro", name: "iPhone 13 Pro / Max", width: 300, height: 650, radius: "40px", bezel: "9px", notchType: "notch" },
        { id: "iphone13", name: "iPhone 13 / Mini", width: 290, height: 630, radius: "38px", bezel: "10px", notchType: "notch" },

        // iPhone 12 Series
        { id: "iphone12pro", name: "iPhone 12 Pro / Max", width: 300, height: 650, radius: "40px", bezel: "9px", notchType: "notch" },
        { id: "iphone12", name: "iPhone 12 / Mini", width: 290, height: 630, radius: "38px", bezel: "10px", notchType: "notch" },

        // iPhone 11 Series
        { id: "iphone11pro", name: "iPhone 11 Pro / Max", width: 300, height: 650, radius: "36px", bezel: "10px", notchType: "notch" },
        { id: "iphone11", name: "iPhone 11", width: 305, height: 660, radius: "36px", bezel: "12px", notchType: "notch" },

        // iPhone X / XS / XR
        { id: "iphonexs", name: "iPhone XS / Max", width: 300, height: 650, radius: "36px", bezel: "10px", notchType: "notch" },
        { id: "iphonexr", name: "iPhone XR", width: 305, height: 660, radius: "36px", bezel: "12px", notchType: "notch" },
        { id: "iphonex", name: "iPhone X", width: 300, height: 650, radius: "36px", bezel: "10px", notchType: "notch" },

        // iPhone 8 / 7 / 6 / SE (Classic Home Button Design)
        { id: "iphone8", name: "iPhone 8 / Plus", width: 300, height: 650, radius: "8px", bezel: "14px", notchType: "none" }, // Simulation simplifiée (pas de bouton home physique affiché mais écran rectangulaire)
        { id: "iphone7", name: "iPhone 7 / Plus", width: 300, height: 650, radius: "8px", bezel: "14px", notchType: "none" },
        { id: "iphone6s", name: "iPhone 6S / 6", width: 300, height: 650, radius: "8px", bezel: "14px", notchType: "none" },
        { id: "iphonese", name: "iPhone SE (2020/22)", width: 290, height: 630, radius: "8px", bezel: "14px", notchType: "none" },
    ],
    Samsung: [
        // S24 Series
        { id: "s24ultra", name: "Galaxy S24 Ultra", width: 310, height: 640, radius: "4px", bezel: "2px", notchType: "punch" },
        { id: "s24plus", name: "Galaxy S24 / S24+", width: 300, height: 645, radius: "28px", bezel: "5px", notchType: "punch" },

        // S23 Series
        { id: "s23ultra", name: "Galaxy S23 Ultra", width: 310, height: 640, radius: "6px", bezel: "3px", notchType: "punch" },
        { id: "s23", name: "Galaxy S23 / S23+", width: 300, height: 645, radius: "28px", bezel: "5px", notchType: "punch" },

        // S22 Series
        { id: "s22ultra", name: "Galaxy S22 Ultra", width: 310, height: 640, radius: "6px", bezel: "3px", notchType: "punch" },
        { id: "s22", name: "Galaxy S22 / S22+", width: 300, height: 645, radius: "28px", bezel: "5px", notchType: "punch" },

        // S21 Series
        { id: "s21ultra", name: "Galaxy S21 Ultra", width: 310, height: 650, radius: "20px", bezel: "5px", notchType: "punch" },
        { id: "s21", name: "Galaxy S21 / S21+", width: 300, height: 645, radius: "24px", bezel: "6px", notchType: "punch" },

        // S20 Series
        { id: "s20ultra", name: "Galaxy S20 Ultra", width: 310, height: 655, radius: "20px", bezel: "5px", notchType: "punch" },
        { id: "s20", name: "Galaxy S20 / S20+", width: 300, height: 650, radius: "20px", bezel: "6px", notchType: "punch" },

        // S10 Series (Poinçon sur le côté pour S10, on simplifie en centré ou on adapte plus tard, ici centré pour simplicité)
        { id: "s10", name: "Galaxy S10 / S10+", width: 300, height: 640, radius: "18px", bezel: "7px", notchType: "punch" },

        // S9 / S8 (Bords incurvés, pas d'encoche mais bordure haut/bas)
        { id: "s9", name: "Galaxy S9 / S9+", width: 300, height: 640, radius: "18px", bezel: "10px", notchType: "none" },
        { id: "s8", name: "Galaxy S8 / S8+", width: 300, height: 650, radius: "18px", bezel: "10px", notchType: "none" },

        // S7 / S6 (Ecran classique 16:9)
        { id: "s7", name: "Galaxy S7 / Edge", width: 300, height: 533, radius: "10px", bezel: "15px", notchType: "none" }, // Ratio plus petit
        { id: "s6", name: "Galaxy S6 / Edge", width: 300, height: 533, radius: "10px", bezel: "15px", notchType: "none" },

        // Note Series
        { id: "note20", name: "Galaxy Note 20 Ultra", width: 315, height: 650, radius: "4px", bezel: "3px", notchType: "punch" },
        { id: "note10", name: "Galaxy Note 10 / 10+", width: 310, height: 650, radius: "6px", bezel: "4px", notchType: "punch" },
    ],
    Google: [
        // Pixel 6 to 8
        { id: "pixel8pro", name: "Pixel 8 Pro", width: 305, height: 645, radius: "24px", bezel: "5px", notchType: "punch" },
        { id: "pixel8", name: "Pixel 8", width: 300, height: 630, radius: "30px", bezel: "6px", notchType: "punch" },
        { id: "pixel7pro", name: "Pixel 7 Pro", width: 305, height: 645, radius: "20px", bezel: "5px", notchType: "punch" },
        { id: "pixel7", name: "Pixel 7 / 7a", width: 300, height: 635, radius: "24px", bezel: "6px", notchType: "punch" },
        { id: "pixel6pro", name: "Pixel 6 Pro", width: 305, height: 650, radius: "18px", bezel: "5px", notchType: "punch" },
        { id: "pixel6", name: "Pixel 6 / 6a", width: 300, height: 640, radius: "20px", bezel: "7px", notchType: "punch" },

        // Pixel 4 / 5
        { id: "pixel5", name: "Pixel 5 / 5a", width: 300, height: 635, radius: "16px", bezel: "8px", notchType: "punch" }, // Coin gauche en réalité, centré pour simu
        { id: "pixel4", name: "Pixel 4 / 4 XL", width: 300, height: 640, radius: "18px", bezel: "10px", notchType: "none" }, // Grosse bordure haut

        // Pixel 3
        { id: "pixel3xl", name: "Pixel 3 XL", width: 300, height: 640, radius: "18px", bezel: "8px", notchType: "notch" }, // Huge notch
        { id: "pixel3", name: "Pixel 3 / 3a", width: 300, height: 630, radius: "18px", bezel: "12px", notchType: "none" },

        // Pixel 1 / 2
        { id: "pixel2", name: "Pixel 2 / 2 XL", width: 300, height: 630, radius: "10px", bezel: "15px", notchType: "none" },
        { id: "pixel1", name: "Pixel 1 / XL", width: 300, height: 630, radius: "10px", bezel: "15px", notchType: "none" },
    ],
    Xiaomi: [
        // Xiaomi 14 / 13 Series
        { id: "xiaomi14ultra", name: "Xiaomi 14 Ultra", width: 310, height: 650, radius: "20px", bezel: "4px", notchType: "punch" },
        { id: "xiaomi14", name: "Xiaomi 14 / 14 Pro", width: 300, height: 645, radius: "24px", bezel: "3px", notchType: "punch" },
        { id: "xiaomi13", name: "Xiaomi 13 / 13 Pro", width: 300, height: 645, radius: "20px", bezel: "4px", notchType: "punch" },

        // Redmi Note Series
        { id: "redminote13", name: "Redmi Note 13 / Pro", width: 305, height: 650, radius: "16px", bezel: "5px", notchType: "punch" },
        { id: "redminote12", name: "Redmi Note 12", width: 305, height: 650, radius: "16px", bezel: "6px", notchType: "punch" },

        // Older
        { id: "xiaomi12", name: "Xiaomi 12 / 12 Pro", width: 300, height: 640, radius: "20px", bezel: "5px", notchType: "punch" },
        { id: "mi11", name: "Mi 11 / Ultra", width: 305, height: 650, radius: "24px", bezel: "5px", notchType: "punch" }, // Corner punch IRL, simulé centré
    ],
    Huawei: [
        // Pura / P Series
        { id: "pura70", name: "Huawei Pura 70", width: 305, height: 650, radius: "18px", bezel: "5px", notchType: "punch" },
        { id: "p60pro", name: "Huawei P60 Pro", width: 305, height: 650, radius: "16px", bezel: "5px", notchType: "punch" },
        { id: "p50pro", name: "Huawei P50 Pro", width: 300, height: 645, radius: "16px", bezel: "5px", notchType: "punch" },

        // Mate Series
        { id: "mate60", name: "Huawei Mate 60 Pro", width: 315, height: 655, radius: "12px", bezel: "4px", notchType: "island" }, // 3 trous souvent assimilés à un ilot
        { id: "mate50", name: "Huawei Mate 50 Pro", width: 310, height: 650, radius: "12px", bezel: "5px", notchType: "notch" }, // Large notch

        // Classics
        { id: "p30pro", name: "Huawei P30 Pro", width: 300, height: 640, radius: "14px", bezel: "6px", notchType: "punch" }, // Goutte d'eau (simulé punch ou notch)
        { id: "p20pro", name: "Huawei P20 Pro", width: 300, height: 630, radius: "10px", bezel: "10px", notchType: "none" }, // Notch physique (simulé none ou notch)
    ],
    OnePlus: [
        { id: "op12", name: "OnePlus 12", width: 305, height: 650, radius: "20px", bezel: "4px", notchType: "punch" },
        { id: "op11", name: "OnePlus 11", width: 305, height: 650, radius: "20px", bezel: "4px", notchType: "punch" },
        { id: "opnord3", name: "OnePlus Nord 3", width: 300, height: 645, radius: "16px", bezel: "6px", notchType: "punch" },
        { id: "op9", name: "OnePlus 9 Pro", width: 300, height: 645, radius: "18px", bezel: "5px", notchType: "punch" },
    ]
};

export default function WallpaperSimulator() {
    const [selectedBrand, setSelectedBrand] = useState<keyof typeof DEVICES_BY_BRAND>("Apple");
    const [selectedDevice, setSelectedDevice] = useState(DEVICES_BY_BRAND["Apple"][0]);
    const [selectedWallpaper, setSelectedWallpaper] = useState(WALLPAPERS[0]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentTime, setCurrentTime] = useState("");
    const [currentDate, setCurrentDate] = useState("");

    // Clock Logic
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
            setCurrentDate(now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    // When brand changes, default to first device of that brand
    const handleBrandChange = (brand: keyof typeof DEVICES_BY_BRAND) => {
        setSelectedBrand(brand);
        setSelectedDevice(DEVICES_BY_BRAND[brand][0]);
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(selectedWallpaper.src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `SBC-Wallpaper-${selectedWallpaper.title.replace(/\s+/g, '-')}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed", error);
            // Fallback: open in new tab
            window.open(selectedWallpaper.src, '_blank');
        }
    };

    // Filter devices based on brand and search term
    const filteredDevices = DEVICES_BY_BRAND[selectedBrand].filter((d: any) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col xl:flex-row gap-8 items-start justify-center min-h-[600px]">

            {/* COLUMN 1: Device Selection (Left) */}
            <div className="w-full xl:w-1/4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6 max-h-[80vh] sticky top-24 overflow-hidden">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
                    <i className="fas fa-mobile-alt mr-2"></i> Appareil
                </h3>

                {/* Brand Tabs */}
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(DEVICES_BY_BRAND) as Array<keyof typeof DEVICES_BY_BRAND>).map(brand => (
                        <button
                            key={brand}
                            onClick={() => { handleBrandChange(brand); setSearchTerm(""); }}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedBrand === brand
                                ? 'bg-gray-900 text-white shadow-md transform scale-105'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {brand}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                    <input
                        type="text"
                        placeholder={`Chercher un modèle...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-sbc focus:ring-1 focus:ring-sbc transition text-xs font-medium"
                    />
                </div>

                {/* Model List (Scrollable) */}
                <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 flex-grow">
                    {filteredDevices.map((device: any) => (
                        <button
                            key={device.id}
                            onClick={() => setSelectedDevice(device)}
                            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between group
                                    ${selectedDevice.id === device.id
                                    ? 'border-sbc bg-green-50 text-sbc shadow-sm'
                                    : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <span>{device.name}</span>
                            {selectedDevice.id === device.id && <i className="fas fa-check"></i>}
                        </button>
                    ))}
                    {filteredDevices.length === 0 && (
                        <div className="text-center text-gray-400 py-8 text-xs italic">
                            Aucun modèle trouvé
                        </div>
                    )}
                </div>
            </div>

            {/* COLUMN 2: Simulator (Center) */}
            <div className="w-full xl:w-2/4 flex flex-col items-center justify-center py-10 xl:py-20 bg-gray-50/50 rounded-[3rem] sticky top-24 min-h-[600px] xl:h-[80vh]">
                {/* THE PHONE */}
                <div
                    className="relative bg-black transition-all duration-500 ease-in-out shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] ring-1 ring-gray-900/5 origin-center transform scale-[0.85] sm:scale-100 xl:scale-125"
                    style={{
                        width: selectedDevice.width,
                        height: selectedDevice.height,
                        borderRadius: selectedDevice.radius,
                        padding: selectedDevice.bezel
                    }}
                >
                    {/* Hardware Buttons (Decorative) */}
                    <div className="absolute -left-[2px] top-24 w-[2px] h-8 bg-gray-700 rounded-l-sm"></div> {/* Mute */}
                    <div className="absolute -left-[2px] top-40 w-[2px] h-16 bg-gray-700 rounded-l-sm"></div> {/* Volume Up */}
                    <div className="absolute -right-[2px] top-48 w-[2px] h-24 bg-gray-700 rounded-r-sm"></div> {/* Power */}

                    {/* The Screen */}
                    <div
                        className="relative w-full h-full bg-gray-800 overflow-hidden"
                        style={{ borderRadius: `calc(${selectedDevice.radius} - ${selectedDevice.bezel})` }}
                    >
                        {/* Wallpaper Image */}
                        <div className="absolute inset-0">
                            <Image
                                src={selectedWallpaper.src}
                                alt="Wallpaper Preview"
                                fill
                                className="object-cover"
                            />
                            {/* Dark Overlay for Locking Screen readability */}
                            <div className="absolute inset-0 bg-black/10"></div>
                        </div>

                        {/* Top Status Bar (Fake) */}
                        <div className="absolute top-0 w-full p-4 flex justify-between items-start z-20 text-white text-[10px] font-medium opacity-90">
                            <span>SBC Mobile</span>
                            <div className="flex gap-1.5">
                                <i className="fas fa-signal"></i>
                                <i className="fas fa-wifi"></i>
                                <i className="fas fa-battery-full"></i>
                            </div>
                        </div>

                        {/* Notch / Dynamic Island */}
                        <div className="absolute top-0 w-full flex justify-center z-30">
                            {selectedDevice.notchType === 'island' && (
                                <div className="bg-black w-[90px] h-[25px] rounded-full mt-2 flex items-center justify-center gap-3 px-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-900/30"></div> {/* lens */}
                                </div>
                            )}
                            {selectedDevice.notchType === 'notch' && (
                                <div className="bg-black w-[120px] h-[25px] rounded-b-xl"></div>
                            )}
                            {selectedDevice.notchType === 'punch' && (
                                <div className="bg-black w-3 h-3 rounded-full mt-3"></div>
                            )}
                        </div>

                        {/* Lock Screen UI */}
                        <div className="absolute top-[15%] w-full text-center z-10 text-white drop-shadow-md">
                            <div className="text-xs font-bold uppercase mb-1 opacity-80">{currentDate}</div>
                            <div className="text-6xl font-black tracking-tight">{currentTime}</div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="absolute bottom-8 w-full px-8 flex justify-between items-center z-10">
                            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition">
                                <i className="fas fa-flashlight"></i>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition">
                                <i className="fas fa-camera"></i>
                            </div>
                        </div>

                        {/* Home Bar */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-white/50 rounded-full z-20"></div>
                    </div>
                </div>
            </div>

            {/* COLUMN 3: Wallpapers & DL (Right) */}
            <div className="w-full xl:w-1/4 space-y-6">

                {/* Wallpaper Gallery */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
                        <i className="fas fa-images mr-2"></i> Design
                    </h3>
                    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                        {WALLPAPERS.map(wp => (
                            <div
                                key={wp.id}
                                onClick={() => setSelectedWallpaper(wp)}
                                className={`cursor-pointer group relative aspect-[9/16] rounded-xl overflow-hidden border-4 transition-all duration-300
                                    ${selectedWallpaper.id === wp.id
                                        ? 'border-sbc shadow-lg scale-95 z-10'
                                        : 'border-transparent hover:border-gray-200 opacity-80 hover:opacity-100'
                                    }`}
                            >
                                <Image
                                    src={wp.src}
                                    alt={wp.title}
                                    fill
                                    className="object-cover transition duration-500 group-hover:scale-110"
                                />
                                {selectedWallpaper.id === wp.id && (
                                    <div className="absolute inset-0 bg-sbc/20 flex items-center justify-center">
                                        <div className="w-6 h-6 bg-sbc rounded-full flex items-center justify-center text-white shadow-lg text-xs">
                                            <i className="fas fa-check"></i>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Download Button */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-2xl text-center shadow-xl">
                    <h3 className="text-white font-bold text-lg mb-1">{selectedWallpaper.title}</h3>
                    <p className="text-gray-400 text-xs mb-4">Téléchargez la version haute définition.</p>
                    <button
                        onClick={handleDownload}
                        className="w-full inline-flex justify-center items-center gap-2 bg-sbc hover:bg-sbc-light text-white font-black py-3 px-6 rounded-xl transition-all hover:scale-105 shadow-lg shadow-sbc/20 text-sm"
                    >
                        <i className="fas fa-download"></i>
                        Télécharger
                    </button>
                    <p className="text-[10px] text-gray-500 mt-3 italic">Optimisé pour {selectedDevice.name}</p>
                </div>
            </div>
        </div>
    );
}
