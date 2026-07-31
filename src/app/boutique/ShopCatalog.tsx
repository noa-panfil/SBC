"use client";
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShopProduct } from "@/types/shop";
import { addCartLine } from "@/lib/shop/cart";
import { formatEuros, SHOP_MAX_QUANTITY } from "@/lib/shop/constants";
import { useShopCart } from "@/hooks/useShopCart";

function ProductDialog({ product, onClose }: { product: ShopProduct; onClose: () => void }) {
    const colors = Array.from(new Set(product.variants.map((variant) => variant.color)));
    const [color, setColor] = useState(colors[0] || "");
    const sizes = product.variants.filter((variant) => variant.color === color).map((variant) => variant.size);
    const [size, setSize] = useState(sizes[0] || "");
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState("");
    const [activeImage, setActiveImage] = useState(product.images[0]?.url || null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const variant = product.variants.find((candidate) => candidate.color === color && candidate.size === size);

    useEffect(() => {
        closeRef.current?.focus();
        const listener = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
        document.addEventListener("keydown", listener);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", listener); document.body.style.overflow = ""; };
    }, [onClose]);

    const add = () => {
        if (!variant) { setMessage("Choisissez une combinaison de couleur et de taille disponible."); return; }
        const result = addCartLine({
            variantId: variant.id, productId: product.id, productName: product.name,
            imageUrl: product.images[0]?.url || null, size: variant.size, color: variant.color,
            priceCents: variant.priceCents, quantity,
        });
        setMessage(result.message);
    };

    return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-gray-950/65 backdrop-blur-sm md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl md:rounded-3xl">
            <div className="grid md:grid-cols-2">
                <div className="relative min-h-64 bg-gradient-to-br from-green-50 to-gray-100">
                    {activeImage ? <img src={activeImage} alt={product.name} className="h-full min-h-64 w-full object-cover" /> : <div className="flex min-h-64 items-center justify-center text-6xl text-sbc/25"><i className="fas fa-basketball-ball" /></div>}
                    <button ref={closeRef} onClick={onClose} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg focus:outline-none focus:ring-4 focus:ring-sbc/30" aria-label="Fermer la fiche produit"><i className="fas fa-times" /></button>
                    {product.images.length > 1 && <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto rounded-xl bg-white/90 p-2 backdrop-blur">{product.images.map((image, index) => <button key={image.id} onClick={() => setActiveImage(image.url)} className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 focus:outline-none focus:ring-4 focus:ring-sbc/25 ${activeImage === image.url ? "border-sbc" : "border-transparent"}`} aria-label={`Afficher l’image ${index + 1} de ${product.name}`}><img src={image.url} alt="" className="h-full w-full object-cover" /></button>)}</div>}
                </div>
                <div className="p-6 md:p-8">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-sbc">Équipement officiel</p>
                    <h2 id="product-dialog-title" className="mt-2 text-3xl font-black text-gray-950">{product.name}</h2>
                    <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-600">{product.description}</p>
                    <div className="mt-6 space-y-5">
                        <fieldset><legend className="mb-2 text-sm font-bold text-gray-800">Couleur</legend><div className="flex flex-wrap gap-2">{colors.map((value) => <button key={value} type="button" onClick={() => { setColor(value); setSize(product.variants.find((candidate) => candidate.color === value)?.size || ""); }} aria-pressed={color === value} className={`rounded-full border px-4 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sbc/20 ${color === value ? "border-sbc bg-sbc text-white" : "border-gray-200 bg-white text-gray-700 hover:border-sbc"}`}>{value}</button>)}</div></fieldset>
                        <fieldset><legend className="mb-2 text-sm font-bold text-gray-800">Taille</legend><div className="flex flex-wrap gap-2">{sizes.map((value) => <button key={value} type="button" onClick={() => setSize(value)} aria-pressed={size === value} className={`min-w-12 rounded-xl border px-4 py-2 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sbc/20 ${size === value ? "border-sbc bg-green-50 text-sbc-dark" : "border-gray-200 text-gray-700 hover:border-sbc"}`}>{value}</button>)}</div></fieldset>
                        <div className="flex items-end gap-4"><label><span className="mb-2 block text-sm font-bold text-gray-800">Quantité</span><select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="rounded-xl border border-gray-300 bg-white px-4 py-3 focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15">{Array.from({ length: SHOP_MAX_QUANTITY }, (_, index) => index + 1).map((value) => <option key={value}>{value}</option>)}</select></label><p className="ml-auto pb-2 text-2xl font-black text-gray-950">{variant ? formatEuros(variant.priceCents) : "—"}</p></div>
                        <button type="button" onClick={add} disabled={!variant} className="w-full rounded-xl bg-sbc px-5 py-4 font-black text-white shadow-lg shadow-green-800/20 hover:bg-sbc-dark focus:outline-none focus:ring-4 focus:ring-sbc/30 disabled:cursor-not-allowed disabled:bg-gray-300"><i className="fas fa-shopping-basket mr-2" />Ajouter au panier</button>
                        {message && <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-900">{message}</p>}
                    </div>
                </div>
            </div>
        </div>
    </div>;
}

export default function ShopCatalog() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [setupRequired, setSetupRequired] = useState(false);
    const [selected, setSelected] = useState<ShopProduct | null>(null);
    const { count } = useShopCart();
    useEffect(() => {
        fetch("/api/shop/products", { cache: "no-store" }).then(async (response) => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Impossible de charger la boutique.");
            setProducts(data.products); setSetupRequired(Boolean(data.setupRequired));
        }).catch((reason) => setError(reason instanceof Error ? reason.message : "Impossible de charger la boutique."))
            .finally(() => setLoading(false));
    }, []);
    const priceLabel = (product: ShopProduct) => {
        const values = product.variants.map((variant) => variant.priceCents);
        const min = Math.min(...values); const max = Math.max(...values);
        return min === max ? formatEuros(min) : `À partir de ${formatEuros(min)}`;
    };

    return <>
        <section className="relative overflow-hidden bg-sbc-dark text-white"><div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_15%_25%,#4ade80_0,transparent_28%),radial-gradient(circle_at_80%_70%,#15803d_0,transparent_32%)]" /><div className="container relative mx-auto px-4 py-16 md:py-24"><div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-[0.3em] text-sbc-light">Seclin Basket Club</p><h1 className="mt-3 text-4xl font-black uppercase italic leading-none md:text-7xl">Portez les <span className="text-sbc-light">couleurs</span> du club</h1><p className="mt-6 max-w-2xl text-base leading-7 text-green-50/85 md:text-lg">Vêtements et équipements officiels, commandés directement auprès de notre fournisseur.</p><Link href="/boutique/panier" className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 font-black text-sbc-dark shadow-xl focus:outline-none focus:ring-4 focus:ring-white/40"><i className="fas fa-shopping-basket" />Mon panier <span className="rounded-full bg-sbc px-2.5 py-1 text-xs text-white" aria-label={`${count} article(s) dans le panier`}>{count}</span></Link></div></div></section>
        <section className="container mx-auto px-4 py-10 md:py-14">
            <div className="mb-10 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-green-100 bg-green-50 p-5"><p className="font-black text-sbc-dark"><i className="fas fa-calendar-alt mr-2 text-sbc" />Commande groupée chaque mois</p><p className="mt-1 text-sm leading-6 text-green-950/75">Les commandes sont transmises au fournisseur au début du mois suivant.</p></div><div className="rounded-2xl border border-orange-100 bg-orange-50 p-5"><p className="font-black text-orange-900"><i className="fas fa-map-marker-alt mr-2 text-orange-600" />Retrait uniquement au club</p><p className="mt-1 text-sm leading-6 text-orange-950/75">Aucun envoi postal et aucun frais de livraison.</p></div></div>
            <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-sbc">Collection du club</p><h2 className="mt-1 text-3xl font-black text-gray-950">Nos équipements</h2></div>{products.length > 0 && <p className="text-sm font-semibold text-gray-500">{products.length} produit{products.length > 1 ? "s" : ""}</p>}</div>
            {loading && <div role="status" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((value) => <div key={value} className="overflow-hidden rounded-3xl border border-gray-100 bg-white"><div className="aspect-[4/3] animate-pulse bg-gray-100" /><div className="space-y-3 p-6"><div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" /><div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" /></div></div>)}</div>}
            {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900"><p className="font-black">La boutique n'a pas pu être chargée.</p><p className="mt-1 text-sm">{error}</p><button onClick={() => location.reload()} className="mt-4 rounded-lg bg-red-700 px-4 py-2 font-bold text-white focus:outline-none focus:ring-4 focus:ring-red-200">Réessayer</button></div>}
            {!loading && !error && products.length === 0 && <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-2xl text-sbc"><i className="fas fa-tshirt" /></div><h3 className="mt-5 text-2xl font-black text-gray-900">La boutique se prépare</h3><p className="mx-auto mt-2 max-w-lg text-gray-500">Aucun produit n'est disponible pour le moment. Revenez bientôt pour découvrir les équipements du club.</p>{setupRequired && <p className="mt-4 text-xs text-gray-400">Configuration initiale en attente.</p>}</div>}
            {!loading && !error && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <article key={product.id} className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><button onClick={() => setSelected(product)} className="block w-full text-left focus:outline-none focus:ring-4 focus:ring-inset focus:ring-sbc/25" aria-label={`Voir ${product.name}`}><div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-green-50 to-gray-100">{product.images[0] ? <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-5xl text-sbc/25"><i className="fas fa-basketball-ball" /></div>}<span className="absolute bottom-4 right-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-sbc-dark shadow">Voir le produit</span></div><div className="p-6"><h3 className="text-xl font-black text-gray-950">{product.name}</h3><p className="mt-2 font-black text-sbc">{priceLabel(product)}</p></div></button></article>)}</div>}
        </section>
        {selected && <ProductDialog product={selected} onClose={() => setSelected(null)} />}
    </>;
}
