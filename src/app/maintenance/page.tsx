import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Temps mort ! | Seclin Basket Club",
    description: "Le site du Seclin Basket Club revient bientôt sur le terrain.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function MaintenancePage() {
    return (
        <main className="flex min-h-screen flex-col bg-[#f7f7f5]">
            <section className="relative isolate flex flex-1 overflow-hidden bg-[#082b1d] text-white">
                <div className="absolute inset-0 -z-20 opacity-70 [background:radial-gradient(circle_at_15%_10%,rgba(34,197,94,.28),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(249,115,22,.18),transparent_30%)]" />

                <div className="container mx-auto flex w-full flex-col px-4 py-8 sm:py-10 md:py-14">
                    <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-lg shadow-black/15">
                            <Image
                                src="/logo.png"
                                alt="Logo du Seclin Basket Club"
                                width={56}
                                height={56}
                                priority
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-green-400">SBC</p>
                            <p className="font-black tracking-tight">Seclin Basket Club</p>
                        </div>
                    </div>

                    <div className="grid flex-1 items-center gap-12 py-14 md:grid-cols-[minmax(0,1fr)_340px] md:py-20 lg:grid-cols-[minmax(0,1fr)_430px]">
                        <div className="fade-in max-w-4xl">
                            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-green-100 backdrop-blur">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                                Maintenance en cours
                            </div>

                            <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl md:text-7xl">
                                Même les meilleurs ont besoin d&apos;un <span className="text-green-400">temps mort.</span>
                            </h1>
                            <p className="mt-7 max-w-2xl text-base leading-7 text-green-50/75 md:text-lg">
                                Notre équipe technique remet le site en condition. Encore quelques réglages, et nous serons de retour sur le terrain.
                            </p>

                            <div className="mt-9 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 font-black text-gray-950 shadow-lg shadow-black/15">
                                <i className="fas fa-clock text-sbc" />
                                Retour très bientôt
                            </div>
                        </div>

                        <div className="relative mx-auto hidden aspect-square w-full max-w-[430px] items-center justify-center md:flex" aria-hidden="true">
                            <div className="absolute inset-[2%] rounded-full border-[38px] border-white/[0.035]" />
                            <div className="absolute inset-[8%] rounded-full bg-orange-500/15 blur-3xl" />
                            <div className="relative flex h-64 w-64 rotate-[-8deg] items-center justify-center rounded-full border border-orange-300/30 bg-orange-600 text-[11rem] text-orange-950 shadow-[0_35px_80px_rgba(0,0,0,0.28)] lg:h-80 lg:w-80 lg:text-[14rem]">
                                <i className="fas fa-basketball-ball opacity-90" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
