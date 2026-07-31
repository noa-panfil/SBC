"use client";
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import ImageCropper from "@/components/ImageCropper";
import { ShopProduct, ShopVariant } from "@/types/shop";

type MediaImage = { id: number; mime_type: string };
type NewVariantForm = {
    sizes: string[];
    customSizes: string;
    color: string;
    colorHex: string;
    price: string;
    isActive: boolean;
    displayOrder: number;
};

const emptyProduct = { name: "", slug: "", description: "", isActive: false, displayOrder: 0 };
const emptyVariant: NewVariantForm = {
    sizes: [], customSizes: "", color: "", colorHex: "#111111",
    price: "", isActive: true, displayOrder: 0,
};
const standardSizes = ["4 ans", "6 ans", "8 ans", "10 ans", "12 ans", "14 ans", "XS", "S", "M", "L", "XL", "XXL", "3XL", "Taille unique"];

async function jsonRequest(url: string, options?: RequestInit) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
    return data;
}

function productIdentifier(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function SizePicker({ value, customSizes, onChange, onCustomSizesChange }: {
    value: string[];
    customSizes: string;
    onChange: (sizes: string[]) => void;
    onCustomSizesChange: (value: string) => void;
}) {
    const toggle = (size: string) => onChange(
        value.includes(size) ? value.filter((item) => item !== size) : [...value, size]
    );

    return (
        <fieldset className="rounded-2xl border border-green-200 bg-white p-4 sm:col-span-2 lg:col-span-4">
            <legend className="px-1 text-sm font-black text-green-950">Tailles disponibles</legend>
            <div className="flex flex-wrap gap-2">
                {standardSizes.map((size) => (
                    <label key={size} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-bold transition ${value.includes(size) ? "border-sbc bg-sbc text-white" : "border-gray-200 bg-white text-gray-700 hover:border-sbc"}`}>
                        <input type="checkbox" checked={value.includes(size)} onChange={() => toggle(size)} className="sr-only" />
                        {size}
                    </label>
                ))}
            </div>
            <label className="mt-4 block text-xs font-bold text-gray-700">
                Autres tailles, séparées par des virgules
                <input value={customSizes} onChange={(event) => onCustomSizesChange(event.target.value)} placeholder="Ex. 36, 38, 40" className="mt-1 w-full rounded-lg border p-2 font-normal" />
            </label>
        </fieldset>
    );
}

function VariantRow({ variant, reload }: { variant: ShopVariant; reload: () => void }) {
    const [form, setForm] = useState({
        sku: variant.sku || "",
        size: variant.size,
        color: variant.color,
        colorHex: variant.colorHex || "#64748b",
        price: (variant.priceCents / 100).toFixed(2),
        isActive: variant.isActive,
        displayOrder: variant.displayOrder,
    });

    const save = async () => {
        try {
            await jsonRequest(`/api/admin/shop/variants/${variant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    priceCents: Math.round(Number(form.price.replace(",", ".")) * 100),
                }),
            });
            reload();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erreur");
        }
    };

    const remove = async () => {
        if (!confirm(`Supprimer la variante ${variant.color} / ${variant.size} ?`)) return;
        try {
            await jsonRequest(`/api/admin/shop/variants/${variant.id}`, { method: "DELETE" });
            reload();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erreur");
        }
    };

    return (
        <div className="grid gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-[1fr_1fr_72px_1fr_110px_80px_80px_auto] md:items-end">
            <label className="text-xs font-bold">SKU<input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} className="mt-1 w-full rounded-lg border p-2 font-normal" /></label>
            <label className="text-xs font-bold">Couleur<input value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className="mt-1 w-full rounded-lg border p-2 font-normal" /></label>
            <label className="text-xs font-bold">Pastille<input type="color" value={form.colorHex} onChange={(event) => setForm({ ...form, colorHex: event.target.value })} className="mt-1 h-[38px] w-full cursor-pointer rounded-lg border bg-white p-1" /></label>
            <label className="text-xs font-bold">Taille<input value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} className="mt-1 w-full rounded-lg border p-2 font-normal" /></label>
            <label className="text-xs font-bold">Prix €<input value={form.price} inputMode="decimal" onChange={(event) => setForm({ ...form, price: event.target.value })} className="mt-1 w-full rounded-lg border p-2 font-normal" /></label>
            <label className="text-xs font-bold">Ordre<input type="number" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: Number(event.target.value) })} className="mt-1 w-full rounded-lg border p-2 font-normal" /></label>
            <label className="flex items-center gap-2 pb-2 text-xs font-bold"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Active</label>
            <div className="flex gap-2">
                <button type="button" onClick={save} className="rounded-lg bg-sbc px-3 py-2 text-white" aria-label="Enregistrer la variante"><i className="fas fa-save" /></button>
                <button type="button" onClick={remove} className="rounded-lg bg-red-50 px-3 py-2 text-red-700" aria-label="Supprimer la variante"><i className="fas fa-trash" /></button>
            </div>
        </div>
    );
}

export default function ProductsManager() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [form, setForm] = useState(emptyProduct);
    const [variant, setVariant] = useState<NewVariantForm>(emptyVariant);
    const [media, setMedia] = useState<MediaImage[]>([]);
    const [mediaId, setMediaId] = useState("");
    const [imageColor, setImageColor] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [setupRequired, setSetupRequired] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const selected = products.find((product) => product.id === selectedId) || null;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [productsData, mediaData] = await Promise.all([
                jsonRequest("/api/admin/shop/products"),
                jsonRequest("/api/admin/shop/images"),
            ]);
            setProducts(productsData.products);
            setSetupRequired(Boolean(productsData.setupRequired));
            setMedia(mediaData);
            if (selectedId && !productsData.products.some((product: ShopProduct) => product.id === selectedId)) setSelectedId(null);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Erreur");
        } finally {
            setLoading(false);
        }
    }, [selectedId]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        setForm(selected ? {
            name: selected.name,
            slug: selected.slug,
            description: selected.description,
            isActive: selected.isActive,
            displayOrder: selected.displayOrder,
        } : emptyProduct);
        setImageColor("");
    }, [selected]);

    const saveProduct = async (event: FormEvent) => {
        event.preventDefault();
        setMessage("");
        try {
            const data = await jsonRequest(selected ? `/api/admin/shop/products/${selected.id}` : "/api/admin/shop/products", {
                method: selected ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            setMessage(selected ? "Produit enregistré." : "Produit créé.");
            if (!selected) setSelectedId(data.id);
            await load();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Erreur");
        }
    };

    const removeProduct = async () => {
        if (!selected || !confirm(`Supprimer le produit « ${selected.name} » ? Un produit déjà commandé sera seulement archivé.`)) return;
        try {
            const data = await jsonRequest(`/api/admin/shop/products/${selected.id}`, { method: "DELETE" });
            setMessage(data.archived ? "Produit déjà commandé : il a été archivé." : "Produit supprimé.");
            setSelectedId(null);
            await load();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Erreur");
        }
    };

    const addVariant = async (event: FormEvent) => {
        event.preventDefault();
        if (!selected) return;
        const customSizes = variant.customSizes.split(",").map((size) => size.trim()).filter(Boolean);
        const sizes = [...new Set([...variant.sizes, ...customSizes])];
        if (!sizes.length) { alert("Sélectionnez au moins une taille."); return; }
        try {
            await jsonRequest(`/api/admin/shop/products/${selected.id}/variants`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sizes,
                    color: variant.color,
                    colorHex: variant.colorHex,
                    priceCents: Math.round(Number(variant.price.replace(",", ".")) * 100),
                    isActive: variant.isActive,
                    displayOrder: variant.displayOrder,
                }),
            });
            setVariant(emptyVariant);
            await load();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erreur");
        }
    };

    const productColors = selected
        ? Array.from(new Map(selected.variants.map((item) => [item.color, item.colorHex])).entries())
        : [];

    const imagePayload = (imageId: number) => ({
        imageId,
        color: imageColor || null,
        displayOrder: selected?.images.length || 0,
        isPrimary: !selected?.images.some((image) => image.color === (imageColor || null)),
    });

    const addImage = async () => {
        if (!selected || !mediaId) return;
        try {
            await jsonRequest(`/api/admin/shop/products/${selected.id}/images`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(imagePayload(Number(mediaId))),
            });
            setMediaId("");
            await load();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erreur");
        }
    };

    const updateImage = async (associationId: number, color: string | null, displayOrder: number, isPrimary: boolean) => {
        if (!selected) return;
        try {
            await jsonRequest(`/api/admin/shop/products/${selected.id}/images`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ associationId, color, displayOrder, isPrimary }),
            });
            await load();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erreur");
        }
    };

    const removeImage = async (associationId: number) => {
        if (!selected || !confirm("Retirer cette image du produit ?")) return;
        try {
            await jsonRequest(`/api/admin/shop/products/${selected.id}/images?associationId=${associationId}`, { method: "DELETE" });
            await load();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erreur");
        }
    };

    const closeCropper = () => {
        if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
        setCropImageSrc(null);
    };

    const selectImageToCrop = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || !selected) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { alert("Choisissez une image JPEG, PNG ou WebP."); return; }
        if (file.size > 10 * 1024 * 1024) { alert("L'image doit peser moins de 10 Mo."); return; }
        setCropImageSrc(URL.createObjectURL(file));
    };

    const uploadCroppedImage = async (croppedBlob: Blob) => {
        if (!selected) { closeCropper(); return; }
        const body = new FormData();
        body.append("file", new File([croppedBlob], `${selected.slug}-1200x1200.jpg`, { type: "image/jpeg" }));
        closeCropper();
        try {
            const response = await fetch("/api/admin/shop/images", { method: "POST", body });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            await jsonRequest(`/api/admin/shop/products/${selected.id}/images`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(imagePayload(data.id)),
            });
            await load();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Erreur");
        }
    };

    return (
        <main className="mx-auto min-h-screen w-full max-w-7xl p-4 pb-28 md:p-8">
            {cropImageSrc && <ImageCropper imageSrc={cropImageSrc} aspect={1} cropShape="rect" outputWidth={1200} outputHeight={1200} title="Recadrer l’image du produit" onCropComplete={uploadCroppedImage} onCancel={closeCropper} />}

            <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div><Link href="/admin/boutique" className="text-sm font-bold text-sbc"><i className="fas fa-arrow-left mr-2" />Boutique</Link><h1 className="mt-2 text-3xl font-black">Produits</h1></div>
                <button onClick={() => { setSelectedId(null); setForm(emptyProduct); }} className="rounded-xl bg-sbc px-5 py-3 font-black text-white"><i className="fas fa-plus mr-2" />Nouveau produit</button>
            </header>

            {message && <p role="status" className="mb-5 rounded-xl bg-green-50 p-4 font-semibold text-green-900">{message}</p>}
            {setupRequired && <p className="mb-5 rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-900">Créez d'abord les tables avec le fichier SQL fourni.</p>}

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                <aside className="h-fit rounded-2xl border bg-white p-3 shadow-sm">
                    <h2 className="px-3 py-2 text-sm font-black uppercase tracking-wider text-gray-500">Catalogue</h2>
                    {loading ? <p className="p-3 text-sm text-gray-400">Chargement…</p> : products.map((product) => (
                        <button key={product.id} onClick={() => setSelectedId(product.id)} className={`mb-1 w-full rounded-xl p-3 text-left ${selectedId === product.id ? "bg-sbc text-white" : "hover:bg-gray-50"}`}>
                            <span className="block font-black">{product.name}</span>
                            <span className={`text-xs ${selectedId === product.id ? "text-green-100" : "text-gray-400"}`}>{product.variants.length} variante(s) · {product.isActive ? "Actif" : "Inactif"}</span>
                        </button>
                    ))}
                </aside>

                <div className="space-y-6">
                    <form onSubmit={saveProduct} className="rounded-2xl border bg-white p-5 shadow-sm md:p-7">
                        <h2 className="text-xl font-black">{selected ? `Modifier ${selected.name}` : "Créer un produit"}</h2>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <label className="text-sm font-bold">Nom<input required maxLength={160} value={form.name} onChange={(event) => { const name = event.target.value; setForm({ ...form, name, slug: selected ? form.slug : productIdentifier(name) }); }} className="mt-2 w-full rounded-xl border p-3 font-normal" /></label>
                            <label className="text-sm font-bold">Identifiant<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="sweat-du-club" value={form.slug} onChange={(event) => setForm({ ...form, slug: productIdentifier(event.target.value) })} className="mt-2 w-full rounded-xl border p-3 font-normal" /><span className="mt-1 block text-xs font-normal text-gray-500">Généré automatiquement à partir du nom.</span></label>
                            <label className="text-sm font-bold sm:col-span-2">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={5} className="mt-2 w-full rounded-xl border p-3 font-normal" /></label>
                            <label className="text-sm font-bold">Ordre d'affichage<input type="number" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: Number(event.target.value) })} className="mt-2 w-full rounded-xl border p-3 font-normal" /></label>
                            <label className="flex items-center gap-3 self-end rounded-xl bg-green-50 p-3 font-bold text-sbc-dark"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Produit actif</label>
                        </div>
                        <div className="mt-5 flex gap-3"><button className="rounded-xl bg-sbc px-5 py-3 font-black text-white">Enregistrer</button>{selected && <button type="button" onClick={removeProduct} className="rounded-xl bg-red-50 px-5 py-3 font-black text-red-700">Supprimer / archiver</button>}</div>
                    </form>

                    {selected && <>
                        <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-7">
                            <div><h2 className="text-xl font-black">Photos par couleur</h2><p className="mt-1 text-sm text-gray-500">Une photo sans couleur sert de visuel général. Une photo colorée s'affiche quand le client choisit cette couleur.</p></div>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {selected.images.map((image) => (
                                    <article key={image.id} className="overflow-hidden rounded-2xl border bg-gray-50">
                                        <div className="relative aspect-square bg-white"><img src={image.url} alt="" className="h-full w-full object-cover" />{image.isPrimary && <span className="absolute left-2 top-2 rounded-full bg-sbc px-2.5 py-1 text-[10px] font-black text-white">Principale</span>}</div>
                                        <div className="space-y-3 p-3">
                                            <label className="block text-xs font-bold text-gray-700">Photo affichée pour<select value={image.color || ""} onChange={(event) => updateImage(image.id, event.target.value || null, image.displayOrder, image.isPrimary)} className="mt-1 w-full rounded-lg border bg-white p-2 font-normal"><option value="">Toutes les couleurs</option>{productColors.map(([color]) => <option key={color} value={color}>{color}</option>)}</select></label>
                                            <div className="flex gap-2"><button type="button" onClick={() => updateImage(image.id, image.color, image.displayOrder, true)} className="flex-1 rounded-lg border border-sbc px-3 py-2 text-xs font-black text-sbc"><i className="fas fa-star mr-1" />Principale</button><button type="button" onClick={() => removeImage(image.id)} className="rounded-lg bg-red-50 px-3 py-2 text-red-700" aria-label="Retirer l'image"><i className="fas fa-trash" /></button></div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                            {!selected.images.length && <p className="mt-5 rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">Aucune photo pour ce produit.</p>}
                            <div className="mt-6 grid gap-3 rounded-2xl bg-green-50 p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
                                <label className="text-xs font-bold">Image déjà uploadée<select value={mediaId} onChange={(event) => setMediaId(event.target.value)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="">Choisir une image boutique</option>{media.filter((image) => !selected.images.some((assigned) => assigned.imageId === image.id)).map((image) => <option key={image.id} value={image.id}>Image boutique #{image.id}</option>)}</select></label>
                                <label className="text-xs font-bold">Associer à une couleur<select value={imageColor} onChange={(event) => setImageColor(event.target.value)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 font-normal"><option value="">Toutes les couleurs</option>{productColors.map(([color]) => <option key={color} value={color}>{color}</option>)}</select></label>
                                <button type="button" disabled={!mediaId} onClick={addImage} className="rounded-xl bg-gray-900 px-4 py-2.5 font-bold text-white disabled:opacity-40">Associer</button>
                                <label className="cursor-pointer rounded-xl border border-sbc bg-white px-4 py-2.5 text-center font-bold text-sbc">Uploader et recadrer<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImageToCrop} className="sr-only" /></label>
                            </div>
                        </section>

                        <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-7">
                            <div className="flex items-center justify-between"><div><h2 className="text-xl font-black">Variantes</h2><p className="mt-1 text-sm text-gray-500">Chaque couleur possède sa pastille et ses tailles.</p></div><span className="text-sm text-gray-400">Prix en centimes côté serveur</span></div>
                            <div className="mt-4 space-y-3">{selected.variants.map((item) => <VariantRow key={item.id} variant={item} reload={load} />)}{!selected.variants.length && <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Ajoutez au moins une variante active pour afficher ce produit dans la boutique.</p>}</div>
                            <form onSubmit={addVariant} className="mt-5 grid gap-3 rounded-2xl bg-green-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                                <label className="text-xs font-bold">Nom de la couleur<input required placeholder="Ex. Bleu marine" value={variant.color} onChange={(event) => setVariant({ ...variant, color: event.target.value })} className="mt-1 w-full rounded-lg border p-2.5 font-normal" /></label>
                                <label className="text-xs font-bold">Couleur de la pastille<div className="mt-1 flex items-center gap-2 rounded-lg border bg-white p-1.5"><input type="color" value={variant.colorHex} onChange={(event) => setVariant({ ...variant, colorHex: event.target.value })} className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent" /><span className="text-xs font-normal text-gray-500">{variant.colorHex}</span></div></label>
                                <label className="text-xs font-bold">Prix €<input required placeholder="Ex. 25,00" inputMode="decimal" value={variant.price} onChange={(event) => setVariant({ ...variant, price: event.target.value })} className="mt-1 w-full rounded-lg border p-2.5 font-normal" /></label>
                                <div className="hidden lg:block" />
                                <SizePicker value={variant.sizes} customSizes={variant.customSizes} onChange={(sizes) => setVariant({ ...variant, sizes })} onCustomSizesChange={(customSizes) => setVariant({ ...variant, customSizes })} />
                                <button className="rounded-lg bg-sbc px-4 py-3 font-bold text-white sm:col-span-2 lg:col-span-1"><i className="fas fa-plus mr-2" />Créer les tailles</button>
                                <p className="self-center text-xs text-green-900 sm:col-span-2">Une variante sera créée pour chaque taille cochée.</p>
                            </form>
                        </section>
                    </>}
                </div>
            </div>
        </main>
    );
}
