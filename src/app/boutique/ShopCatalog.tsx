"use client";
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useShopCart } from "@/hooks/useShopCart";
import { addCartLine, cartLineId } from "@/lib/shop/cart";
import { colorHex } from "@/lib/shop/colors";
import { formatEuros, SHOP_MAX_QUANTITY } from "@/lib/shop/constants";
import { ShopImage, ShopProduct, ShopVariant } from "@/types/shop";

type ProductColor = { name: string; hex: string };

function colorsOf(product: ShopProduct): ProductColor[] {
    const colors = new Map<string, string>();
    for (const variant of product.variants) {
        if (!colors.has(variant.color)) colors.set(variant.color, colorHex(variant.color, variant.colorHex));
    }
    return Array.from(colors, ([name, hex]) => ({ name, hex }));
}

function imagesForColor(product: ShopProduct, color: string): ShopImage[] {
    const exact = product.images.filter((image) => image.color === color);
    if (exact.length) return exact;
    const generic = product.images.filter((image) => image.color === null);
    return generic.length ? generic : product.images;
}

function variantsForColor(product: ShopProduct, color: string): ShopVariant[] {
    return product.variants.filter((variant) => variant.color === color);
}

function priceLabel(variants: ShopVariant[]): string {
    const prices = variants.map((variant) => variant.priceCents);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatEuros(min) : `Dès ${formatEuros(min)}`;
}

function personalizationSummary(product: ShopProduct): string {
    const details: string[] = [];
    if (product.personalizationTextEnabled) {
        const placements = [product.personalizationTextFrontEnabled ? "devant" : null, product.personalizationTextBackEnabled ? "dos" : null].filter(Boolean);
        details.push(`Texte : ${placements.join(" ou ")}`);
    }
    if (product.personalizationNumberEnabled) {
        const placements = [product.personalizationNumberFrontEnabled ? "devant" : null, product.personalizationNumberBackEnabled ? "dos" : null].filter(Boolean);
        details.push(`Numéro : ${placements.join(" ou ")}`);
    }
    return details.join(" · ");
}

function ColorSwatch({ color, selected, onSelect, compact = false }: {
    color: ProductColor;
    selected: boolean;
    onSelect: () => void;
    compact?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-label={`Choisir la couleur ${color.name}`}
            aria-pressed={selected}
            title={color.name}
            className={`${compact ? "h-7 w-7" : "h-10 w-10"} flex items-center justify-center rounded-full border bg-white transition focus:outline-none focus:ring-4 focus:ring-sbc/20 ${selected ? "border-gray-950 ring-2 ring-gray-950 ring-offset-2" : "border-gray-200 hover:scale-110 hover:border-gray-400"}`}
        >
            <span className={`${compact ? "h-5 w-5" : "h-7 w-7"} rounded-full border border-black/10`} style={{ backgroundColor: color.hex }} />
        </button>
    );
}

function ProductCard({ product, onOpen }: { product: ShopProduct; onOpen: (product: ShopProduct, color: string) => void }) {
    const colors = useMemo(() => colorsOf(product), [product]);
    const [selectedColor, setSelectedColor] = useState(colors[0]?.name || "");
    const variants = variantsForColor(product, selectedColor);
    const images = imagesForColor(product, selectedColor);
    const sizes = variants.map((variant) => variant.size);

    return (
        <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white shadow-[0_8px_35px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(15,23,42,0.12)]">
            <button type="button" onClick={() => onOpen(product, selectedColor)} className="group/image relative block aspect-square w-full overflow-hidden bg-[#f4f5f3] text-left focus:outline-none focus:ring-4 focus:ring-inset focus:ring-sbc/25" aria-label={`Découvrir ${product.name}`}>
                {images[0] ? <>
                    <img key={`primary-${images[0].url}`} src={images[0].url} alt={`${product.name} - ${selectedColor}`} className={`absolute inset-0 h-full w-full object-cover opacity-100 transition-[opacity,transform] duration-500 ease-out group-hover/image:scale-[1.035] ${images[1] ? "group-hover/image:opacity-0" : ""}`} />
                    {images[1] && <img key={`secondary-${images[1].url}`} src={images[1].url} alt={`${product.name} - ${selectedColor}, seconde vue`} className="absolute inset-0 h-full w-full object-cover opacity-0 transition-[opacity,transform] duration-500 ease-out group-hover/image:scale-[1.035] group-hover/image:opacity-100" />}
                </> : <div className="flex h-full items-center justify-center text-6xl text-sbc/20"><i className="fas fa-tshirt" /></div>}
                {images.length > 1 && <span className="absolute bottom-4 right-4 flex h-9 min-w-9 items-center justify-center rounded-full bg-gray-950/80 px-2 text-xs font-black text-white backdrop-blur"><i className="far fa-images mr-1.5" />{images.length}</span>}
                {product.personalizationEnabled && <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black text-sbc-dark shadow-sm backdrop-blur"><i className="fas fa-pen mr-1.5" />Personnalisable</span>}
            </button>

            <div className="flex flex-1 flex-col p-5 md:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0"><h3 className="truncate text-xl font-black tracking-tight text-gray-950">{product.name}</h3><p className="mt-1 text-sm font-medium text-gray-500">{selectedColor}</p></div>
                    <p className="shrink-0 text-lg font-black text-sbc-dark">{priceLabel(variants)}</p>
                </div>

                <div className="mt-5">
                    <div className="flex items-center justify-between"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">Couleurs</p><span className="text-xs text-gray-400">{colors.length} disponible{colors.length > 1 ? "s" : ""}</span></div>
                    <div className="mt-2.5 flex flex-wrap gap-2.5">{colors.map((item) => <ColorSwatch key={item.name} color={item} selected={selectedColor === item.name} compact onSelect={() => setSelectedColor(item.name)} />)}</div>
                </div>

                <div className="mt-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">Tailles disponibles</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">{sizes.slice(0, 7).map((size) => <span key={size} className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700">{size}</span>)}{sizes.length > 7 && <span className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-bold text-white">+{sizes.length - 7}</span>}</div>
                </div>

                {product.personalizationEnabled && <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-xs text-green-950"><p className="font-black"><i className="fas fa-pen mr-2 text-sbc" />Personnalisation +{formatEuros(product.personalizationPriceCents)}</p><p className="mt-1 font-semibold text-green-800">{personalizationSummary(product)}</p></div>}

                <div className="mt-auto pt-6"><button type="button" onClick={() => onOpen(product, selectedColor)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3.5 text-sm font-black text-white transition hover:bg-sbc focus:outline-none focus:ring-4 focus:ring-sbc/25">Voir le produit <i className="fas fa-arrow-right text-xs" /></button></div>
            </div>
        </article>
    );
}

function ProductDialog({ product, initialColor, onClose }: { product: ShopProduct; initialColor: string; onClose: () => void }) {
    const colors = useMemo(() => colorsOf(product), [product]);
    const [selectedColor, setSelectedColor] = useState(initialColor || colors[0]?.name || "");
    const variants = variantsForColor(product, selectedColor);
    const images = imagesForColor(product, selectedColor);
    const allowedPersonalizationTypes = (["text", "number"] as const).filter((type) =>
        type === "text" ? product.personalizationTextEnabled : product.personalizationNumberEnabled
    );
    const allowedTextPlacements = (["front", "back"] as const).filter((placement) =>
        placement === "front" ? product.personalizationTextFrontEnabled : product.personalizationTextBackEnabled
    );
    const allowedNumberPlacements = (["front", "back"] as const).filter((placement) =>
        placement === "front" ? product.personalizationNumberFrontEnabled : product.personalizationNumberBackEnabled
    );
    const [size, setSize] = useState(variants[0]?.size || "");
    const [quantity, setQuantity] = useState(1);
    const [wantsPersonalization, setWantsPersonalization] = useState(false);
    const [selectedPersonalizationTypes, setSelectedPersonalizationTypes] = useState<Array<"text" | "number">>(allowedPersonalizationTypes.length === 1 ? [allowedPersonalizationTypes[0]] : []);
    const [textPlacement, setTextPlacement] = useState<"front" | "back" | null>(allowedTextPlacements.length === 1 ? allowedTextPlacements[0] : null);
    const [numberPlacement, setNumberPlacement] = useState<"front" | "back" | null>(allowedNumberPlacements.length === 1 ? allowedNumberPlacements[0] : null);
    const [textValue, setTextValue] = useState("");
    const [numberValue, setNumberValue] = useState("");
    const [message, setMessage] = useState("");
    const [activeImage, setActiveImage] = useState(images[0]?.url || null);
    const [isZoomed, setIsZoomed] = useState(false);
    const closeRef = useRef<HTMLButtonElement>(null);
    const variant = variants.find((candidate) => candidate.size === size);
    const displayedPrice = (variant?.priceCents || 0) + (wantsPersonalization ? product.personalizationPriceCents : 0);
    const activeImageIndex = Math.max(0, images.findIndex((image) => image.url === activeImage));

    useEffect(() => {
        closeRef.current?.focus();
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, [onClose]);

    useEffect(() => {
        const listener = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            if (isZoomed) setIsZoomed(false);
            else onClose();
        };
        document.addEventListener("keydown", listener);
        return () => document.removeEventListener("keydown", listener);
    }, [isZoomed, onClose]);

    const chooseColor = (color: string) => {
        const nextVariants = variantsForColor(product, color);
        const nextImages = imagesForColor(product, color);
        setSelectedColor(color);
        setSize(nextVariants[0]?.size || "");
        setActiveImage(nextImages[0]?.url || null);
        setMessage("");
    };

    const showAdjacentImage = (direction: -1 | 1) => {
        if (images.length < 2) return;
        const nextIndex = (activeImageIndex + direction + images.length) % images.length;
        setActiveImage(images[nextIndex].url);
    };

    const togglePersonalizationType = (type: "text" | "number") => {
        setSelectedPersonalizationTypes((current) => current.includes(type)
            ? current.filter((item) => item !== type)
            : [...current, type]);
        setMessage("");
    };

    const add = () => {
        if (!variant) { setMessage("Choisissez une taille disponible."); return; }
        const personalizations: Array<{ type: "text" | "number"; placement: "front" | "back"; value: string }> = [];
        if (wantsPersonalization) {
            const selectedTypes = allowedPersonalizationTypes.filter((type) => selectedPersonalizationTypes.includes(type));
            if (!selectedTypes.length) {
                setMessage("Choisissez au moins une personnalisation : texte, numéro ou les deux.");
                return;
            }
            for (const type of selectedTypes) {
                const placement = type === "text" ? textPlacement : numberPlacement;
                const allowedPlacements = type === "text" ? allowedTextPlacements : allowedNumberPlacements;
                if (!placement || !allowedPlacements.includes(placement)) {
                    setMessage(`Choisissez l'emplacement du ${type === "text" ? "texte" : "numéro"}.`);
                    return;
                }
                const value = type === "text" ? textValue.trim().toUpperCase() : numberValue.trim();
                const valid = type === "number"
                    ? /^\d{1,3}$/.test(value)
                    : value.length >= 1 && value.length <= 30 && /^[\p{L}\p{N} .'-]+$/u.test(value);
                if (!valid) {
                    setMessage(type === "number" ? "Saisissez un numéro de 1 à 3 chiffres." : "Saisissez un texte valide de 1 à 30 caractères.");
                    return;
                }
                personalizations.push({ type, placement, value });
            }
        }
        const result = addCartLine({
            lineId: cartLineId(variant.id, personalizations),
            variantId: variant.id,
            productId: product.id,
            productName: product.name,
            imageUrl: activeImage || images[0]?.url || null,
            size: variant.size,
            color: variant.color,
            priceCents: variant.priceCents + (personalizations.length ? product.personalizationPriceCents : 0),
            quantity,
            personalizations,
            personalizationPriceCents: personalizations.length ? product.personalizationPriceCents : 0,
        });
        setMessage(result.message);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-gray-950/75 backdrop-blur-md md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <div className="max-h-[96vh] w-full max-w-6xl overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl md:rounded-[2rem]">
                <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="bg-[#f2f3f1] p-4 sm:p-6">
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
                            {activeImage ? <button type="button" onClick={() => setIsZoomed(true)} className="group/zoom relative h-full w-full cursor-zoom-in focus:outline-none focus:ring-4 focus:ring-inset focus:ring-sbc/30" aria-label={`Agrandir la photo de ${product.name}`}><img src={activeImage} alt={`${product.name} - ${selectedColor}`} className="h-full w-full object-cover transition duration-500 group-hover/zoom:scale-[1.02]" /><span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-2 text-xs font-black text-gray-900 opacity-0 shadow-lg backdrop-blur transition group-hover/zoom:opacity-100 group-focus/zoom:opacity-100"><i className="fas fa-search-plus mr-2" />Agrandir</span></button> : <div className="flex h-full items-center justify-center text-7xl text-sbc/20"><i className="fas fa-tshirt" /></div>}
                            {images.length > 1 && <>
                                <button type="button" onClick={() => showAdjacentImage(-1)} className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg backdrop-blur transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sbc/30" aria-label="Afficher la photo précédente"><i className="fas fa-chevron-left" /></button>
                                <button type="button" onClick={() => showAdjacentImage(1)} className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg backdrop-blur transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sbc/30" aria-label="Afficher la photo suivante"><i className="fas fa-chevron-right" /></button>
                                <span className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-full bg-gray-950/75 px-3 py-1.5 text-xs font-black text-white backdrop-blur">{activeImageIndex + 1} / {images.length}</span>
                            </>}
                            <button ref={closeRef} onClick={onClose} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sbc/30" aria-label="Fermer la fiche produit"><i className="fas fa-times" /></button>
                        </div>
                        {images.length > 1 && <div className="mt-3"><p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-gray-500">Toutes les photos · {selectedColor}</p><div className="flex gap-3 overflow-x-auto pb-1">{images.map((image, index) => <button type="button" key={image.id} onClick={() => setActiveImage(image.url)} className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition focus:outline-none focus:ring-4 focus:ring-sbc/20 ${activeImage === image.url ? "border-sbc" : "border-transparent hover:border-gray-300"}`} aria-label={`Afficher la photo ${index + 1} sur ${images.length}`}><img src={image.url} alt="" className="h-full w-full object-cover" /></button>)}</div></div>}
                    </div>

                    <div className="flex flex-col p-6 sm:p-8 lg:p-10">
                        <div><p className="text-xs font-black uppercase tracking-[0.24em] text-sbc">Boutique officielle</p><h2 id="product-dialog-title" className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">{product.name}</h2><p className="mt-3 text-2xl font-black text-sbc-dark">{variant ? formatEuros(displayedPrice) : priceLabel(variants)}</p><p className="mt-5 whitespace-pre-line text-sm leading-7 text-gray-600">{product.description}</p></div>

                        <div className="mt-8 border-t border-gray-100 pt-7">
                            <fieldset><div className="flex items-center justify-between"><legend className="text-sm font-black text-gray-950">Couleur : <span className="font-semibold text-gray-500">{selectedColor}</span></legend><span className="text-xs text-gray-400">{colors.length} choix</span></div><div className="mt-3 flex flex-wrap gap-3">{colors.map((item) => <ColorSwatch key={item.name} color={item} selected={selectedColor === item.name} onSelect={() => chooseColor(item.name)} />)}</div></fieldset>

                            <fieldset className="mt-7"><div className="flex items-center justify-between"><legend className="text-sm font-black text-gray-950">Choisir la taille</legend><span className="text-xs text-gray-400">{variants.length} disponible{variants.length > 1 ? "s" : ""}</span></div><div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">{variants.map((item) => <button key={item.id} type="button" onClick={() => { setSize(item.size); setMessage(""); }} aria-pressed={size === item.size} className={`rounded-xl border px-3 py-3 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-sbc/20 ${size === item.size ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 bg-white text-gray-800 hover:border-gray-500"}`}>{item.size}</button>)}</div></fieldset>

                            {product.personalizationEnabled && <div className={`mt-7 rounded-2xl border p-4 ${wantsPersonalization ? "border-sbc/30 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                                <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={wantsPersonalization} onChange={(event) => { setWantsPersonalization(event.target.checked); setMessage(""); }} className="mt-0.5 h-5 w-5 accent-sbc" /><span><strong className="block text-sm text-gray-950">Je souhaite personnaliser ce vêtement</strong><span className="mt-1 block text-xs text-gray-600">+ {formatEuros(product.personalizationPriceCents)} par article</span></span></label>
                                {wantsPersonalization && <div className="mt-4 space-y-4 border-t border-green-200 pt-4">
                                    <fieldset>
                                        <legend className="text-xs font-black uppercase tracking-wide text-gray-600">Choisissez une ou plusieurs options</legend>
                                        {allowedPersonalizationTypes.length === 1
                                            ? <p className="mt-2 rounded-xl border border-gray-950 bg-gray-950 px-3 py-2.5 text-center text-sm font-black text-white">{allowedPersonalizationTypes[0] === "text" ? "Texte" : "Numéro"}</p>
                                            : <div className="mt-2 grid grid-cols-2 gap-2">{allowedPersonalizationTypes.map((type) => { const selected = selectedPersonalizationTypes.includes(type); return <button key={type} type="button" aria-pressed={selected} onClick={() => togglePersonalizationType(type)} className={`rounded-xl border px-3 py-2.5 text-sm font-black ${selected ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 bg-white text-gray-700"}`}><i className={`fas ${selected ? "fa-check-square" : "fa-square"} mr-2`} />{type === "text" ? "Ajouter un texte" : "Ajouter un numéro"}</button>; })}</div>}
                                    </fieldset>
                                    {selectedPersonalizationTypes.includes("text") && <section className="rounded-2xl border border-gray-200 bg-white p-4"><h3 className="text-sm font-black text-gray-950"><i className="fas fa-font mr-2 text-sbc" />Personnalisation texte</h3><label className="mt-3 block text-sm font-black text-gray-950">Votre texte<input autoComplete="off" maxLength={30} value={textValue} onChange={(event) => setTextValue(event.target.value.slice(0, 30))} placeholder="Ex. NOA" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-normal uppercase focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" /><span className="mt-1 block text-right text-xs font-normal text-gray-500">{textValue.length}/30</span></label><fieldset className="mt-3"><legend className="text-xs font-black uppercase tracking-wide text-gray-600">Emplacement du texte</legend>{allowedTextPlacements.length === 1 ? <p className="mt-2 rounded-xl bg-sbc px-3 py-2.5 text-center text-sm font-black text-white">{allowedTextPlacements[0] === "front" ? "Devant" : "Dos"}</p> : <div className="mt-2 grid grid-cols-2 gap-2">{allowedTextPlacements.map((placement) => <button key={placement} type="button" aria-pressed={textPlacement === placement} onClick={() => { setTextPlacement(placement); setMessage(""); }} className={`rounded-xl border px-3 py-2.5 text-sm font-black ${textPlacement === placement ? "border-sbc bg-sbc text-white" : "border-gray-200 text-gray-700"}`}>{placement === "front" ? "Devant" : "Dos"}</button>)}</div>}</fieldset></section>}
                                    {selectedPersonalizationTypes.includes("number") && <section className="rounded-2xl border border-gray-200 bg-white p-4"><h3 className="text-sm font-black text-gray-950"><i className="fas fa-hashtag mr-2 text-sbc" />Personnalisation numéro</h3><label className="mt-3 block text-sm font-black text-gray-950">Votre numéro<input autoComplete="off" inputMode="numeric" maxLength={3} value={numberValue} onChange={(event) => setNumberValue(event.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Ex. 10" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" /><span className="mt-1 block text-right text-xs font-normal text-gray-500">{numberValue.length}/3</span></label><fieldset className="mt-3"><legend className="text-xs font-black uppercase tracking-wide text-gray-600">Emplacement du numéro</legend>{allowedNumberPlacements.length === 1 ? <p className="mt-2 rounded-xl bg-sbc px-3 py-2.5 text-center text-sm font-black text-white">{allowedNumberPlacements[0] === "front" ? "Devant" : "Dos"}</p> : <div className="mt-2 grid grid-cols-2 gap-2">{allowedNumberPlacements.map((placement) => <button key={placement} type="button" aria-pressed={numberPlacement === placement} onClick={() => { setNumberPlacement(placement); setMessage(""); }} className={`rounded-xl border px-3 py-2.5 text-sm font-black ${numberPlacement === placement ? "border-sbc bg-sbc text-white" : "border-gray-200 text-gray-700"}`}>{placement === "front" ? "Devant" : "Dos"}</button>)}</div>}</fieldset></section>}
                                </div>}
                            </div>}

                            <div className="mt-7 flex items-end gap-4"><label className="text-sm font-black text-gray-950">Quantité<select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="mt-2 block rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15">{Array.from({ length: SHOP_MAX_QUANTITY }, (_, index) => index + 1).map((value) => <option key={value}>{value}</option>)}</select></label><p className="ml-auto pb-3 text-sm font-semibold text-gray-500">Retrait au club uniquement</p></div>

                            <button type="button" onClick={add} disabled={!variant} className="mt-6 w-full rounded-xl bg-sbc px-5 py-4 font-black text-white shadow-lg shadow-green-900/20 transition hover:bg-sbc-dark focus:outline-none focus:ring-4 focus:ring-sbc/30 disabled:cursor-not-allowed disabled:bg-gray-300"><i className="fas fa-shopping-bag mr-2" />Ajouter au panier</button>
                            {message && <p role="status" className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-900">{message}</p>}
                        </div>

                        <div className="mt-7 grid grid-cols-2 gap-3 border-t border-gray-100 pt-6 text-xs text-gray-600"><p className="flex items-center gap-2"><i className="fas fa-lock text-sbc" />Paiement sécurisé</p><p className="flex items-center gap-2"><i className="fas fa-map-marker-alt text-sbc" />Retrait au club</p></div>
                    </div>
                </div>
            </div>
            {isZoomed && activeImage && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" aria-label={`Photo agrandie de ${product.name}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setIsZoomed(false); }}>
                    <img src={activeImage} alt={`${product.name} - ${selectedColor}, vue agrandie`} className="max-h-[92vh] max-w-[94vw] object-contain drop-shadow-2xl" />
                    <button type="button" onClick={() => setIsZoomed(false)} className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-950 shadow-xl transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sbc/40 sm:right-8 sm:top-8" aria-label="Fermer la photo agrandie"><i className="fas fa-times" /></button>
                    {images.length > 1 && <>
                        <button type="button" onClick={() => showAdjacentImage(-1)} className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-950 shadow-xl transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sbc/40 sm:left-8" aria-label="Photo agrandie précédente"><i className="fas fa-chevron-left" /></button>
                        <button type="button" onClick={() => showAdjacentImage(1)} className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-950 shadow-xl transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sbc/40 sm:right-8" aria-label="Photo agrandie suivante"><i className="fas fa-chevron-right" /></button>
                        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur sm:bottom-8">{activeImageIndex + 1} / {images.length}</span>
                    </>}
                </div>
            )}
        </div>
    );
}

export default function ShopCatalog() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [setupRequired, setSetupRequired] = useState(false);
    const [selected, setSelected] = useState<{ product: ShopProduct; color: string } | null>(null);
    const { count } = useShopCart();
    const collectionGroups = useMemo(() => {
        const groups = new Map<string, { slug: string; name: string; description: string; bannerImageUrl: string | null; products: ShopProduct[] }>();
        for (const product of products) {
            const key = product.collection ? String(product.collection.id) : "unassigned";
            if (!groups.has(key)) {
                groups.set(key, product.collection ? {
                    slug: product.collection.slug,
                    name: product.collection.name,
                    description: product.collection.description,
                    bannerImageUrl: product.collection.bannerImageUrl,
                    products: [],
                } : {
                    slug: "autres-produits",
                    name: "Les essentiels du club",
                    description: "Retrouvez ici les produits disponibles hors collection.",
                    bannerImageUrl: null,
                    products: [],
                });
            }
            groups.get(key)!.products.push(product);
        }
        return Array.from(groups.values());
    }, [products]);

    useEffect(() => {
        fetch("/api/shop/products", { cache: "no-store" }).then(async (response) => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Impossible de charger la boutique.");
            setProducts(data.products);
            setSetupRequired(Boolean(data.setupRequired));
        }).catch((reason) => setError(reason instanceof Error ? reason.message : "Impossible de charger la boutique."))
            .finally(() => setLoading(false));
    }, []);

    return <>
        <section className="relative isolate overflow-hidden bg-[#082b1d] text-white">
            <div className="absolute inset-0 -z-10 opacity-70 [background:radial-gradient(circle_at_15%_10%,rgba(34,197,94,.28),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(249,115,22,.18),transparent_30%)]" />
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl"><h1 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl md:text-7xl">Les couleurs du club, <span className="text-green-400">sur le terrain</span> comme en gradin.</h1><p className="mt-6 max-w-2xl text-base leading-7 text-green-50/75 md:text-lg">Découvrez les vêtements officiels du Seclin Basket Club, disponibles en plusieurs couleurs et tailles.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#collection" className="rounded-full bg-white px-6 py-3.5 font-black text-gray-950 transition hover:bg-green-100">Découvrir la collection</a><Link href="/boutique/panier" className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 font-black text-white backdrop-blur transition hover:bg-white/20"><i className="fas fa-shopping-bag" />Panier <span className="rounded-full bg-green-400 px-2.5 py-1 text-xs text-green-950">{count}</span></Link></div></div>
            </div>
        </section>

        <section className="border-b border-gray-200 bg-white"><div className="container mx-auto grid divide-y divide-gray-100 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0"><div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-shield-alt text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Paiement sécurisé</p><p className="text-xs text-gray-500">Propulsé par Stripe</p></div></div><div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-calendar-check text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Commande groupée</p><p className="text-xs text-gray-500">Transmise chaque mois</p></div></div><div className="flex items-center gap-3 py-5 sm:px-5"><i className="fas fa-store text-xl text-sbc" /><div><p className="text-sm font-black text-gray-950">Retrait au club</p><p className="text-xs text-gray-500">Aucun frais de livraison</p></div></div></div></section>

        <section id="collection" className="bg-[#f7f7f5] py-12 md:py-20">
            <div className="container mx-auto px-4">
                <div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-sbc">Vestiaire officiel</p><h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950 md:text-4xl">Les collections du club</h2></div>{products.length > 0 && <p className="rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-500 shadow-sm">{products.length} produit{products.length > 1 ? "s" : ""}</p>}</div>

                {loading && <div role="status" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[1, 2, 3, 4].map((value) => <div key={value} className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white"><div className="aspect-square animate-pulse bg-gray-200" /><div className="space-y-3 p-6"><div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" /><div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" /><div className="h-10 animate-pulse rounded bg-gray-100" /></div></div>)}</div>}
                {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900"><p className="font-black">La boutique n'a pas pu être chargée.</p><p className="mt-1 text-sm">{error}</p><button onClick={() => location.reload()} className="mt-4 rounded-lg bg-red-700 px-4 py-2 font-bold text-white">Réessayer</button></div>}
                {!loading && !error && products.length === 0 && <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-16 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-2xl text-sbc"><i className="fas fa-tshirt" /></div><h3 className="mt-5 text-2xl font-black text-gray-900">La collection arrive bientôt</h3><p className="mx-auto mt-2 max-w-lg text-gray-500">Aucun produit n'est disponible pour le moment.</p>{setupRequired && <p className="mt-4 text-xs text-gray-400">Configuration initiale en attente.</p>}</div>}
                {!loading && !error && products.length > 0 && <div className="space-y-16">{collectionGroups.map((group) => <section key={group.slug} id={`collection-${group.slug}`} className="scroll-mt-28"><div className="mb-7">{group.bannerImageUrl ? <><h3 className="sr-only">{group.name}</h3><div className="relative aspect-[16/3] w-full overflow-hidden rounded-3xl bg-gray-200 shadow-sm"><img src={group.bannerImageUrl} alt={`Bannière de la collection ${group.name}`} className="h-full w-full object-cover object-center" /><span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1.5 text-xs font-black text-white backdrop-blur sm:bottom-4 sm:right-4">{group.products.length} produit{group.products.length > 1 ? "s" : ""}</span></div></> : <div className="relative flex aspect-[16/3] w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-sbc to-sbc-dark px-6 text-center text-white shadow-sm"><div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.35),transparent_35%)]" /><h3 className="relative text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">{group.name}</h3><span className="absolute bottom-3 right-3 rounded-full bg-black/25 px-3 py-1.5 text-xs font-black text-white backdrop-blur sm:bottom-4 sm:right-4">{group.products.length} produit{group.products.length > 1 ? "s" : ""}</span></div>}{group.description && <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-500">{group.description}</p>}</div><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{group.products.map((product) => <ProductCard key={product.id} product={product} onOpen={(item, color) => setSelected({ product: item, color })} />)}</div></section>)}</div>}
            </div>
        </section>

        {selected && <ProductDialog product={selected.product} initialColor={selected.color} onClose={() => setSelected(null)} />}
    </>;
}
