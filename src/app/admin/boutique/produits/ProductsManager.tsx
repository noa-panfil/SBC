"use client";
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ImageCropper from "@/components/ImageCropper";
import { ShopCollection, ShopProduct, ShopVariant } from "@/types/shop";

type MediaImage = { id: number; mime_type: string; purpose: "product" | "collection_banner" };
type AdminCollection = ShopCollection & { productCount: number };
type EditorTab = "details" | "variants" | "images";
type ProductForm = {
    name: string;
    slug: string;
    description: string;
    collectionId: number | null;
    isActive: boolean;
    displayOrder: number;
    personalizationEnabled: boolean;
    personalizationPrice: string;
    personalizationTextEnabled: boolean;
    personalizationNumberEnabled: boolean;
    personalizationFrontEnabled: boolean;
    personalizationBackEnabled: boolean;
    personalizationTextFrontEnabled: boolean;
    personalizationTextBackEnabled: boolean;
    personalizationNumberFrontEnabled: boolean;
    personalizationNumberBackEnabled: boolean;
};
type NewVariantForm = {
    sizes: string[];
    customSizes: string;
    color: string;
    colorHex: string;
    price: string;
    isActive: boolean;
    displayOrder: number;
};

const emptyProduct: ProductForm = { name: "", slug: "", description: "", collectionId: null, isActive: false, displayOrder: 0, personalizationEnabled: false, personalizationPrice: "", personalizationTextEnabled: true, personalizationNumberEnabled: true, personalizationFrontEnabled: true, personalizationBackEnabled: true, personalizationTextFrontEnabled: true, personalizationTextBackEnabled: true, personalizationNumberFrontEnabled: true, personalizationNumberBackEnabled: true };
const emptyCollection = { name: "", slug: "", description: "", bannerImageId: null as number | null, bannerImageUrl: null as string | null, isActive: true, displayOrder: 0 };
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

function identifier(value: string): string {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function SizePicker({ value, customSizes, onChange, onCustomSizesChange }: {
    value: string[];
    customSizes: string;
    onChange: (sizes: string[]) => void;
    onCustomSizesChange: (value: string) => void;
}) {
    const toggle = (size: string) => onChange(value.includes(size) ? value.filter((item) => item !== size) : [...value, size]);
    return (
        <fieldset className="rounded-2xl border border-green-200 bg-white p-4 sm:col-span-2 lg:col-span-3">
            <legend className="px-1 text-sm font-black text-green-950">2. Sélectionnez toutes les tailles disponibles</legend>
            <div className="mt-1 flex flex-wrap gap-2">
                {standardSizes.map((size) => <label key={size} className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-black transition ${value.includes(size) ? "border-sbc bg-sbc text-white shadow-sm" : "border-gray-200 bg-white text-gray-700 hover:border-sbc"}`}><input type="checkbox" checked={value.includes(size)} onChange={() => toggle(size)} className="sr-only" />{size}</label>)}
            </div>
            <label className="mt-4 block text-xs font-bold text-gray-700">Autres tailles, séparées par des virgules<input value={customSizes} onChange={(event) => onCustomSizesChange(event.target.value)} placeholder="Ex. 36, 38, 40" className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" /></label>
        </fieldset>
    );
}

function VariantSizeRow({ variant, color, colorHex, reload }: { variant: ShopVariant; color: string; colorHex: string; reload: () => void }) {
    const [form, setForm] = useState({
        sku: variant.sku || "", size: variant.size, price: (variant.priceCents / 100).toFixed(2),
        isActive: variant.isActive, displayOrder: variant.displayOrder,
    });
    const [busy, setBusy] = useState(false);

    const save = async () => {
        setBusy(true);
        try {
            await jsonRequest(`/api/admin/shop/variants/${variant.id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, color, colorHex, priceCents: Math.round(Number(form.price.replace(",", ".")) * 100) }),
            });
            await reload();
        } catch (error) { alert(error instanceof Error ? error.message : "Erreur"); }
        finally { setBusy(false); }
    };
    const remove = async () => {
        if (!confirm(`Supprimer la taille ${variant.size} en ${color} ?`)) return;
        try { await jsonRequest(`/api/admin/shop/variants/${variant.id}`, { method: "DELETE" }); await reload(); }
        catch (error) { alert(error instanceof Error ? error.message : "Erreur"); }
    };

    return (
        <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-[100px_1fr_110px_90px_auto] sm:items-end">
            <label className="text-xs font-black text-gray-600">Taille<input value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal text-gray-900" /></label>
            <label className="text-xs font-black text-gray-600">SKU <span className="font-normal text-gray-400">(facultatif)</span><input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} placeholder="Référence fournisseur" className="mt-1 w-full rounded-lg border px-3 py-2 font-normal text-gray-900" /></label>
            <label className="text-xs font-black text-gray-600">Prix €<input value={form.price} inputMode="decimal" onChange={(event) => setForm({ ...form, price: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal text-gray-900" /></label>
            <label className="flex h-[38px] items-center gap-2 rounded-lg bg-gray-50 px-3 text-xs font-black"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="accent-sbc" />Disponible</label>
            <div className="flex gap-2"><button type="button" disabled={busy} onClick={save} className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-sbc text-white disabled:opacity-50" aria-label="Enregistrer cette taille"><i className="fas fa-save" /></button><button type="button" onClick={remove} className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-red-50 text-red-700" aria-label="Supprimer cette taille"><i className="fas fa-trash" /></button></div>
        </div>
    );
}

function ColorGroup({ variants, reload }: { variants: ShopVariant[]; reload: () => void }) {
    const originalColor = variants[0].color;
    const [color, setColor] = useState(originalColor);
    const [hex, setHex] = useState(variants[0].colorHex || "#64748b");
    const [busy, setBusy] = useState(false);

    const saveColor = async () => {
        if (!color.trim()) return;
        setBusy(true);
        try {
            for (const variant of variants) {
                await jsonRequest(`/api/admin/shop/variants/${variant.id}`, {
                    method: "PATCH", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sku: variant.sku || "", size: variant.size, color: color.trim(), colorHex: hex,
                        priceCents: variant.priceCents, isActive: variant.isActive, displayOrder: variant.displayOrder,
                    }),
                });
            }
            await reload();
        } catch (error) { alert(error instanceof Error ? error.message : "Erreur"); }
        finally { setBusy(false); }
    };

    return (
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50">
            <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 bg-white p-4 sm:p-5">
                <span className="mb-1 h-11 w-11 shrink-0 rounded-full border-4 border-white shadow ring-1 ring-gray-200" style={{ backgroundColor: hex }} />
                <label className="min-w-[180px] flex-1 text-xs font-black text-gray-600">Nom de la couleur<input value={color} onChange={(event) => setColor(event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold text-gray-950" /></label>
                <label className="text-xs font-black text-gray-600">Pastille<div className="mt-1 flex h-[42px] items-center gap-2 rounded-xl border bg-white px-2"><input type="color" value={hex} onChange={(event) => setHex(event.target.value)} className="h-8 w-10 cursor-pointer border-0 bg-transparent" /><span className="text-xs font-mono text-gray-500">{hex}</span></div></label>
                <button type="button" disabled={busy || (color === originalColor && hex === (variants[0].colorHex || "#64748b"))} onClick={saveColor} className="h-[42px] rounded-xl bg-gray-950 px-4 text-sm font-black text-white disabled:opacity-35"><i className="fas fa-save mr-2" />Couleur</button>
                <span className="w-full text-xs font-semibold text-gray-400 sm:ml-auto sm:w-auto">{variants.length} taille{variants.length > 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-3 p-4">{variants.map((variant) => <VariantSizeRow key={variant.id} variant={variant} color={originalColor} colorHex={variants[0].colorHex || "#64748b"} reload={reload} />)}</div>
        </section>
    );
}

export default function ProductsManager() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [collections, setCollections] = useState<AdminCollection[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [form, setForm] = useState<ProductForm>(emptyProduct);
    const [variant, setVariant] = useState<NewVariantForm>(emptyVariant);
    const [activeTab, setActiveTab] = useState<EditorTab>("details");
    const [catalogSearch, setCatalogSearch] = useState("");
    const [media, setMedia] = useState<MediaImage[]>([]);
    const [mediaId, setMediaId] = useState("");
    const [imageColor, setImageColor] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [setupRequired, setSetupRequired] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [collectionBannerCropSrc, setCollectionBannerCropSrc] = useState<string | null>(null);
    const [showCollections, setShowCollections] = useState(false);
    const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
    const [collectionForm, setCollectionForm] = useState(emptyCollection);
    const productFormRef = useRef<HTMLFormElement>(null);
    const selected = products.find((product) => product.id === selectedId) || null;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [productsData, mediaData, collectionsData] = await Promise.all([
                jsonRequest("/api/admin/shop/products"), jsonRequest("/api/admin/shop/images"), jsonRequest("/api/admin/shop/collections"),
            ]);
            setProducts(productsData.products);
            setCollections(collectionsData.collections);
            setSetupRequired(Boolean(productsData.setupRequired || collectionsData.setupRequired));
            setMedia(mediaData);
            if (selectedId && !productsData.products.some((product: ShopProduct) => product.id === selectedId)) setSelectedId(null);
        } catch (error) { setMessage(error instanceof Error ? error.message : "Erreur"); }
        finally { setLoading(false); }
    }, [selectedId]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        setForm(selected ? {
            name: selected.name, slug: selected.slug, description: selected.description,
            collectionId: selected.collectionId, isActive: selected.isActive, displayOrder: selected.displayOrder,
            personalizationEnabled: selected.personalizationEnabled,
            personalizationPrice: selected.personalizationPriceCents ? (selected.personalizationPriceCents / 100).toFixed(2) : "",
            personalizationTextEnabled: selected.personalizationTextEnabled,
            personalizationNumberEnabled: selected.personalizationNumberEnabled,
            personalizationFrontEnabled: selected.personalizationFrontEnabled,
            personalizationBackEnabled: selected.personalizationBackEnabled,
            personalizationTextFrontEnabled: selected.personalizationTextFrontEnabled,
            personalizationTextBackEnabled: selected.personalizationTextBackEnabled,
            personalizationNumberFrontEnabled: selected.personalizationNumberFrontEnabled,
            personalizationNumberBackEnabled: selected.personalizationNumberBackEnabled,
        } : emptyProduct);
        setImageColor("");
    }, [selected]);

    const catalogGroups = useMemo(() => {
        const query = catalogSearch.trim().toLowerCase();
        const filtered = products.filter((product) => !query || product.name.toLowerCase().includes(query));
        const groups = collections.map((collection) => ({ id: String(collection.id), name: collection.name, products: filtered.filter((product) => product.collectionId === collection.id) }));
        const unassigned = filtered.filter((product) => product.collectionId === null);
        if (unassigned.length) groups.push({ id: "none", name: "Sans collection", products: unassigned });
        return groups.filter((group) => group.products.length);
    }, [catalogSearch, collections, products]);

    const colorGroups = useMemo(() => {
        const groups = new Map<string, ShopVariant[]>();
        for (const item of selected?.variants || []) groups.set(item.color, [...(groups.get(item.color) || []), item]);
        return Array.from(groups.values());
    }, [selected]);

    const saveProduct = async (event: FormEvent) => {
        event.preventDefault();
        const personalizationPrice = Number(form.personalizationPrice.replace(",", "."));
        if (form.personalizationEnabled && (!Number.isFinite(personalizationPrice) || personalizationPrice <= 0)) {
            setMessage("Renseignez un prix de personnalisation supérieur à 0 €.");
            return;
        }
        if (form.personalizationEnabled && (!form.personalizationTextEnabled && !form.personalizationNumberEnabled)) {
            setMessage("Cochez au moins un type de personnalisation : texte ou numéro.");
            return;
        }
        if (form.personalizationEnabled && form.personalizationTextEnabled && !form.personalizationTextFrontEnabled && !form.personalizationTextBackEnabled) {
            setMessage("Cochez au moins un emplacement autorisé pour le texte.");
            return;
        }
        if (form.personalizationEnabled && form.personalizationNumberEnabled && !form.personalizationNumberFrontEnabled && !form.personalizationNumberBackEnabled) {
            setMessage("Cochez au moins un emplacement autorisé pour le numéro.");
            return;
        }
        setMessage(""); setSaving(true);
        try {
            const data = await jsonRequest(selected ? `/api/admin/shop/products/${selected.id}` : "/api/admin/shop/products", {
                method: selected ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    personalizationFrontEnabled: form.personalizationTextFrontEnabled || form.personalizationNumberFrontEnabled,
                    personalizationBackEnabled: form.personalizationTextBackEnabled || form.personalizationNumberBackEnabled,
                    personalizationPriceCents: form.personalizationEnabled
                        ? Math.round(Number(form.personalizationPrice.replace(",", ".")) * 100)
                        : 0,
                }),
            });
            setMessage(selected ? "Produit enregistré." : "Produit créé. Ajoutez maintenant ses couleurs et ses tailles.");
            if (!selected) { setSelectedId(data.id); setActiveTab("variants"); }
            await load();
        } catch (error) { setMessage(error instanceof Error ? error.message : "Erreur"); }
        finally { setSaving(false); }
    };

    const removeProduct = async () => {
        if (!selected || !confirm(`Supprimer le produit « ${selected.name} » ? Un produit déjà commandé sera seulement archivé.`)) return;
        try {
            const data = await jsonRequest(`/api/admin/shop/products/${selected.id}`, { method: "DELETE" });
            setMessage(data.archived ? "Produit déjà commandé : il a été archivé." : "Produit supprimé.");
            setSelectedId(null); setActiveTab("details"); await load();
        } catch (error) { setMessage(error instanceof Error ? error.message : "Erreur"); }
    };

    const startNewProduct = () => { setSelectedId(null); setForm(emptyProduct); setActiveTab("details"); setMessage(""); };

    const editCollection = (collection?: AdminCollection) => {
        setEditingCollectionId(collection?.id || null);
        setCollectionForm(collection ? { name: collection.name, slug: collection.slug, description: collection.description, bannerImageId: collection.bannerImageId, bannerImageUrl: collection.bannerImageUrl, isActive: collection.isActive, displayOrder: collection.displayOrder } : emptyCollection);
    };
    const saveCollection = async (event: FormEvent) => {
        event.preventDefault();
        try {
            const data = await jsonRequest(editingCollectionId ? `/api/admin/shop/collections/${editingCollectionId}` : "/api/admin/shop/collections", {
                method: editingCollectionId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(collectionForm),
            });
            if (editingCollectionId) setMessage("Collection enregistrée.");
            else { setEditingCollectionId(data.id); setMessage("Collection créée. Vous pouvez maintenant ajouter sa bannière."); }
            await load();
        } catch (error) { alert(error instanceof Error ? error.message : "Erreur"); }
    };
    const removeCollection = async (collection: AdminCollection) => {
        if (!confirm(`Supprimer la collection « ${collection.name} » ? Ses ${collection.productCount} produit(s) passeront dans « Sans collection ».`)) return;
        try { await jsonRequest(`/api/admin/shop/collections/${collection.id}`, { method: "DELETE" }); editCollection(); await load(); }
        catch (error) { alert(error instanceof Error ? error.message : "Erreur"); }
    };

    const addVariant = async (event: FormEvent) => {
        event.preventDefault();
        if (!selected) return;
        const customSizes = variant.customSizes.split(",").map((size) => size.trim()).filter(Boolean);
        const sizes = [...new Set([...variant.sizes, ...customSizes])];
        if (!sizes.length) { alert("Sélectionnez au moins une taille."); return; }
        try {
            await jsonRequest(`/api/admin/shop/products/${selected.id}/variants`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sizes, color: variant.color, colorHex: variant.colorHex, priceCents: Math.round(Number(variant.price.replace(",", ".")) * 100), isActive: variant.isActive, displayOrder: variant.displayOrder }),
            });
            setVariant(emptyVariant); await load();
        } catch (error) { alert(error instanceof Error ? error.message : "Erreur"); }
    };

    const productColors = selected ? Array.from(new Map(selected.variants.map((item) => [item.color, item.colorHex])).entries()) : [];
    const imagePayload = (imageId: number) => ({ imageId, color: imageColor || null, displayOrder: selected?.images.length || 0, isPrimary: !selected?.images.some((image) => image.color === (imageColor || null)) });
    const addImage = async () => {
        if (!selected || !mediaId) return;
        try { await jsonRequest(`/api/admin/shop/products/${selected.id}/images`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(imagePayload(Number(mediaId))) }); setMediaId(""); await load(); }
        catch (error) { alert(error instanceof Error ? error.message : "Erreur"); }
    };
    const updateImage = async (associationId: number, color: string | null, displayOrder: number, isPrimary: boolean) => {
        if (!selected) return;
        try { await jsonRequest(`/api/admin/shop/products/${selected.id}/images`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ associationId, color, displayOrder, isPrimary }) }); await load(); }
        catch (error) { alert(error instanceof Error ? error.message : "Erreur"); }
    };
    const removeImage = async (associationId: number) => {
        if (!selected || !confirm("Retirer cette image du produit ?")) return;
        try { await jsonRequest(`/api/admin/shop/products/${selected.id}/images?associationId=${associationId}`, { method: "DELETE" }); await load(); }
        catch (error) { alert(error instanceof Error ? error.message : "Erreur"); }
    };
    const closeCollectionBannerCropper = () => {
        if (collectionBannerCropSrc) URL.revokeObjectURL(collectionBannerCropSrc);
        setCollectionBannerCropSrc(null);
    };
    const selectCollectionBannerToCrop = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; event.target.value = "";
        if (!file) return;
        if (!editingCollectionId) { alert("Enregistrez d'abord la collection avant d'ajouter sa bannière."); return; }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { alert("Choisissez une image JPEG, PNG ou WebP."); return; }
        if (file.size > 10 * 1024 * 1024) { alert("L'image doit peser moins de 10 Mo."); return; }
        setCollectionBannerCropSrc(URL.createObjectURL(file));
    };
    const uploadCollectionBanner = async (croppedBlob: Blob) => {
        if (!editingCollectionId) { closeCollectionBannerCropper(); return; }
        const body = new FormData();
        body.append("file", new File([croppedBlob], `${collectionForm.slug}-banniere-1600x300.jpg`, { type: "image/jpeg" }));
        body.append("purpose", "collection_banner");
        closeCollectionBannerCropper();
        try {
            const response = await fetch("/api/admin/shop/images", { method: "POST", body });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            await jsonRequest(`/api/admin/shop/collections/${editingCollectionId}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...collectionForm, bannerImageId: data.id }),
            });
            setCollectionForm({ ...collectionForm, bannerImageId: data.id, bannerImageUrl: `/api/shop/images/${data.id}` });
            setMessage("Bannière de collection enregistrée.");
            await load();
        } catch (error) { alert(error instanceof Error ? error.message : "Erreur"); }
    };
    const removeCollectionBanner = async () => {
        if (!editingCollectionId || !collectionForm.bannerImageId || !confirm("Retirer la bannière de cette collection ?")) return;
        try {
            await jsonRequest(`/api/admin/shop/collections/${editingCollectionId}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...collectionForm, bannerImageId: null }),
            });
            setCollectionForm({ ...collectionForm, bannerImageId: null, bannerImageUrl: null });
            await load();
        } catch (error) { alert(error instanceof Error ? error.message : "Erreur"); }
    };
    const closeCropper = () => { if (cropImageSrc) URL.revokeObjectURL(cropImageSrc); setCropImageSrc(null); };
    const selectImageToCrop = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; event.target.value = "";
        if (!file || !selected) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { alert("Choisissez une image JPEG, PNG ou WebP."); return; }
        if (file.size > 10 * 1024 * 1024) { alert("L'image doit peser moins de 10 Mo."); return; }
        setCropImageSrc(URL.createObjectURL(file));
    };
    const uploadCroppedImage = async (croppedBlob: Blob) => {
        if (!selected) { closeCropper(); return; }
        const body = new FormData(); body.append("file", new File([croppedBlob], `${selected.slug}-1200x1200.jpg`, { type: "image/jpeg" })); body.append("purpose", "product"); closeCropper();
        try {
            const response = await fetch("/api/admin/shop/images", { method: "POST", body }); const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            await jsonRequest(`/api/admin/shop/products/${selected.id}/images`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(imagePayload(data.id)) }); await load();
        } catch (error) { alert(error instanceof Error ? error.message : "Erreur"); }
    };

    const tabs: Array<{ id: EditorTab; label: string; icon: string; count?: number }> = [
        { id: "details", label: "Informations", icon: "fa-pen" },
        { id: "variants", label: "Couleurs & tailles", icon: "fa-palette", count: colorGroups.length },
        { id: "images", label: "Photos", icon: "fa-images", count: selected?.images.length || 0 },
    ];

    return (
        <main className="min-h-screen bg-gray-100 pb-28">
            {cropImageSrc && <ImageCropper imageSrc={cropImageSrc} aspect={1} cropShape="rect" outputWidth={1200} outputHeight={1200} title="Recadrer l’image du produit" onCropComplete={uploadCroppedImage} onCancel={closeCropper} />}
            {collectionBannerCropSrc && <ImageCropper imageSrc={collectionBannerCropSrc} aspect={16 / 3} cropShape="rect" outputWidth={1600} outputHeight={300} title="Recadrer la bannière de collection" onCropComplete={uploadCollectionBanner} onCancel={closeCollectionBannerCropper} />}
            <div className="mx-auto w-full max-w-[1500px] p-4 md:p-8">
                <header className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><Link href="/admin/boutique" className="text-sm font-bold text-sbc"><i className="fas fa-arrow-left mr-2" />Boutique</Link><h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 md:text-4xl">Construire la boutique</h1><p className="mt-2 text-sm text-gray-500">Organisez les collections, puis configurez chaque produit étape par étape.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setShowCollections(!showCollections)} className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-black text-gray-800 shadow-sm"><i className="fas fa-layer-group mr-2 text-sbc" />Collections</button><button type="button" onClick={startNewProduct} className="rounded-xl bg-sbc px-5 py-3 font-black text-white shadow-lg shadow-green-900/15"><i className="fas fa-plus mr-2" />Nouveau produit</button></div></header>

                {message && <p role="status" className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 font-semibold text-green-950"><i className="fas fa-check-circle mr-2 text-sbc" />{message}</p>}
                {setupRequired && <p className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 font-semibold text-orange-950"><i className="fas fa-database mr-2" />La mise à jour SQL des collections doit être exécutée avant d'utiliser ce panel.</p>}

                {showCollections && <section className="mb-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b bg-gray-950 px-5 py-4 text-white"><div><h2 className="text-xl font-black">Collections de la boutique</h2><p className="mt-1 text-xs text-gray-300">Une collection inactive masque tous ses produits sur la boutique publique.</p></div><button type="button" onClick={() => setShowCollections(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10" aria-label="Fermer"><i className="fas fa-times" /></button></div><div className="grid lg:grid-cols-[1fr_420px]"><div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">{collections.map((collection) => <article key={collection.id} className={`overflow-hidden rounded-2xl border ${collection.isActive ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-gray-50"}`}>{collection.bannerImageUrl ? <img src={collection.bannerImageUrl} alt="" className="aspect-[16/3] w-full object-cover object-center" /> : <div className="flex aspect-[16/3] items-center justify-center bg-gradient-to-br from-sbc to-sbc-dark px-3 text-center text-sm font-black text-white">{collection.name}</div>}<div className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-gray-950">{collection.name}</h3><p className="mt-1 text-xs text-gray-500">{collection.productCount} produit(s) · ordre {collection.displayOrder}</p></div><span className={`h-2.5 w-2.5 rounded-full ${collection.isActive ? "bg-green-500" : "bg-gray-300"}`} /></div><p className="mt-3 line-clamp-2 text-sm text-gray-600">{collection.description || "Aucune description"}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => editCollection(collection)} className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-black text-gray-800 shadow-sm"><i className="fas fa-pen mr-2 text-sbc" />Modifier</button><button type="button" onClick={() => removeCollection(collection)} className="rounded-lg bg-red-50 px-3 py-2 text-red-700" aria-label="Supprimer la collection"><i className="fas fa-trash" /></button></div></div></article>)}{!collections.length && <div className="col-span-full rounded-2xl border-2 border-dashed p-8 text-center text-sm text-gray-500">Aucune collection. Créez la première à droite.</div>}</div><form onSubmit={saveCollection} className="border-t bg-gray-50 p-5 lg:border-l lg:border-t-0"><div className="flex items-center justify-between"><h3 className="text-lg font-black">{editingCollectionId ? "Modifier la collection" : "Nouvelle collection"}</h3>{editingCollectionId && <button type="button" onClick={() => editCollection()} className="text-xs font-black text-sbc">Créer une nouvelle</button>}</div><div className="mt-4 space-y-4"><label className="block text-sm font-black">Nom<input required maxLength={160} value={collectionForm.name} onChange={(event) => { const name = event.target.value; setCollectionForm({ ...collectionForm, name, slug: editingCollectionId ? collectionForm.slug : identifier(name) }); }} placeholder="Ex. Collection supporter" className="mt-1 w-full rounded-xl border px-3 py-2.5 font-normal" /></label><label className="block text-sm font-black">Identifiant<input required value={collectionForm.slug} onChange={(event) => setCollectionForm({ ...collectionForm, slug: identifier(event.target.value) })} className="mt-1 w-full rounded-xl border px-3 py-2.5 font-normal" /></label><label className="block text-sm font-black">Description<textarea rows={3} maxLength={2000} value={collectionForm.description} onChange={(event) => setCollectionForm({ ...collectionForm, description: event.target.value })} placeholder="Présentez cette collection aux visiteurs." className="mt-1 w-full rounded-xl border px-3 py-2.5 font-normal" /></label><div><p className="text-sm font-black">Bannière de collection</p>{collectionForm.bannerImageUrl ? <div className="mt-2 overflow-hidden rounded-xl border bg-white"><img src={collectionForm.bannerImageUrl} alt="Aperçu de la bannière" className="aspect-[16/3] w-full object-cover object-center" /><div className="flex gap-2 p-2"><label className="flex-1 cursor-pointer rounded-lg bg-sbc px-3 py-2 text-center text-xs font-black text-white"><i className="fas fa-crop-alt mr-2" />Remplacer<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectCollectionBannerToCrop} className="sr-only" /></label><button type="button" onClick={removeCollectionBanner} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-700"><i className="fas fa-trash mr-1" />Retirer</button></div></div> : <label className={`mt-2 flex aspect-[16/3] items-center justify-center rounded-xl border-2 border-dashed text-center text-sm font-black ${editingCollectionId ? "cursor-pointer border-sbc/40 bg-green-50 text-sbc" : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"}`}><span><i className="far fa-image mb-2 block text-2xl" />{editingCollectionId ? "Importer et recadrer" : "Enregistrez d'abord la collection"}<small className="mt-1 block font-normal">Format imposé : 1600 × 300 px</small></span>{editingCollectionId && <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectCollectionBannerToCrop} className="sr-only" />}</label>}</div><div className="grid grid-cols-2 gap-3"><label className="text-sm font-black">Ordre<input type="number" value={collectionForm.displayOrder} onChange={(event) => setCollectionForm({ ...collectionForm, displayOrder: Number(event.target.value) })} className="mt-1 w-full rounded-xl border px-3 py-2.5 font-normal" /></label><label className="flex items-center gap-2 self-end rounded-xl bg-white p-3 text-sm font-black"><input type="checkbox" checked={collectionForm.isActive} onChange={(event) => setCollectionForm({ ...collectionForm, isActive: event.target.checked })} className="accent-sbc" />Visible</label></div><button className="w-full rounded-xl bg-gray-950 px-4 py-3 font-black text-white"><i className="fas fa-save mr-2" />Enregistrer la collection</button></div></form></div></section>}

                <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
                    <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-3 shadow-sm lg:sticky lg:top-4"><div className="p-2"><h2 className="text-sm font-black uppercase tracking-[0.15em] text-gray-500">Catalogue</h2><div className="relative mt-3"><i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" /><input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Rechercher un produit" className="w-full rounded-xl border bg-gray-50 py-2.5 pl-9 pr-3 text-sm focus:border-sbc focus:outline-none" /></div></div>{loading ? <p className="p-4 text-sm text-gray-400">Chargement…</p> : <div className="max-h-[70vh] space-y-4 overflow-y-auto px-1 pb-2">{catalogGroups.map((group) => <div key={group.id}><p className="px-3 pb-1 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{group.name}</p><div className="space-y-1">{group.products.map((product) => <button key={product.id} type="button" onClick={() => { setSelectedId(product.id); setActiveTab("details"); }} className={`w-full rounded-xl p-3 text-left transition ${selectedId === product.id ? "bg-sbc text-white shadow-md" : "hover:bg-gray-50"}`}><span className="block truncate font-black">{product.name}</span><span className={`mt-1 flex items-center gap-2 text-xs ${selectedId === product.id ? "text-green-100" : "text-gray-400"}`}><span>{product.variants.length} variante(s)</span><span>·</span><span>{product.images.length} photo(s)</span></span></button>)}</div></div>)}{!catalogGroups.length && <p className="p-4 text-center text-sm text-gray-400">Aucun produit</p>}</div>}</aside>

                    <div className="min-w-0">
                        <div className="sticky top-3 z-30 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur"><div className="min-w-0"><p className="truncate font-black text-gray-950">{selected ? selected.name : "Nouveau produit"}</p><p className="text-xs text-gray-500">{selected ? `${selected.isActive ? "Visible" : "Brouillon"} · ${selected.collection?.name || "Sans collection"}` : "Commencez par enregistrer les informations générales"}</p></div><div className="flex flex-wrap items-center gap-2">{selected && <Link href="/boutique" target="_blank" className="rounded-xl border px-3 py-2.5 text-sm font-black text-gray-700"><i className="fas fa-eye mr-2" />Voir la boutique</Link>}<button type="button" disabled={saving} onClick={() => productFormRef.current?.requestSubmit()} className="rounded-xl bg-sbc px-5 py-2.5 text-sm font-black text-white shadow-md disabled:opacity-50">{saving ? <><i className="fas fa-circle-notch fa-spin mr-2" />Enregistrement…</> : <><i className="fas fa-save mr-2" />Enregistrer</>}</button></div></div>

                        <nav className="mb-4 grid grid-cols-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm" aria-label="Configuration du produit">{tabs.map((tab, index) => { const disabled = !selected && tab.id !== "details"; return <button key={tab.id} type="button" disabled={disabled} onClick={() => setActiveTab(tab.id)} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-black transition sm:text-sm ${activeTab === tab.id ? "bg-gray-950 text-white shadow" : "text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35"}`}><span className={`hidden h-6 w-6 items-center justify-center rounded-full text-[10px] sm:flex ${activeTab === tab.id ? "bg-white/15" : "bg-gray-100"}`}>{index + 1}</span><i className={`fas ${tab.icon} sm:hidden`} /><span>{tab.label}</span>{tab.count !== undefined && <span className={`rounded-full px-2 py-0.5 text-[10px] ${activeTab === tab.id ? "bg-white/15" : "bg-gray-100"}`}>{tab.count}</span>}</button>; })}</nav>

                        <form ref={productFormRef} onSubmit={saveProduct} className={activeTab === "details" ? "rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-7" : "hidden"}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-sbc">Étape 1</p><h2 className="mt-1 text-2xl font-black">Informations du produit</h2><p className="mt-1 text-sm text-gray-500">Définissez son nom, sa collection et sa visibilité.</p></div><label className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 font-black ${form.isActive ? "bg-green-50 text-green-900" : "bg-gray-100 text-gray-500"}`}><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="h-4 w-4 accent-sbc" />{form.isActive ? "Produit visible" : "Conserver en brouillon"}</label></div><div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="text-sm font-black">Nom du produit<input required maxLength={160} value={form.name} onChange={(event) => { const name = event.target.value; setForm({ ...form, name, slug: selected ? form.slug : identifier(name) }); }} placeholder="Ex. Sweat à capuche SBC" className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" /></label><label className="text-sm font-black">Collection<select value={form.collectionId || ""} onChange={(event) => setForm({ ...form, collectionId: event.target.value ? Number(event.target.value) : null })} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-normal focus:border-sbc focus:outline-none"><option value="">Sans collection</option>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}{collection.isActive ? "" : " (masquée)"}</option>)}</select><button type="button" onClick={() => setShowCollections(true)} className="mt-2 text-xs font-black text-sbc"><i className="fas fa-plus mr-1" />Créer ou gérer les collections</button></label><label className="text-sm font-black sm:col-span-2">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={6} placeholder="Coupe, matière, usage et détails utiles pour le client…" className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 font-normal leading-6 focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" /><span className="mt-1 block text-right text-xs font-normal text-gray-400">{form.description.length} caractères</span></label><details className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:col-span-2"><summary className="cursor-pointer text-sm font-black text-gray-700">Réglages avancés</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-black">Identifiant<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: identifier(event.target.value) })} className="mt-1 w-full rounded-xl border px-3 py-2.5 font-mono font-normal" /><span className="mt-1 block text-xs font-normal text-gray-400">Généré automatiquement depuis le nom.</span></label><label className="text-sm font-black">Ordre dans la collection<input type="number" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: Number(event.target.value) })} className="mt-1 w-full rounded-xl border px-3 py-2.5 font-normal" /></label></div></details></div>{selected && <div className="mt-7 border-t pt-5"><button type="button" onClick={removeProduct} className="text-sm font-black text-red-700"><i className="fas fa-trash mr-2" />Supprimer ou archiver ce produit</button></div>}</form>

                        {selected && activeTab === "variants" && <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-7"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-sbc">Étape 2</p><h2 className="mt-1 text-2xl font-black">Couleurs et tailles</h2><p className="mt-1 text-sm text-gray-500">Créez une couleur une seule fois, puis cochez toutes les tailles disponibles.</p></div><form onSubmit={addVariant} className="mt-7 grid gap-4 rounded-3xl border border-green-200 bg-green-50 p-4 lg:grid-cols-3 lg:p-5"><label className="text-sm font-black">1. Nom de la couleur<input required placeholder="Ex. Bleu marine" value={variant.color} onChange={(event) => setVariant({ ...variant, color: event.target.value })} className="mt-2 w-full rounded-xl border px-3 py-2.5 font-normal" /></label><label className="text-sm font-black">Couleur de la pastille<div className="mt-2 flex h-[42px] items-center gap-3 rounded-xl border bg-white px-2"><input type="color" value={variant.colorHex} onChange={(event) => setVariant({ ...variant, colorHex: event.target.value })} className="h-8 w-12 cursor-pointer border-0 bg-transparent" /><span className="text-sm font-mono font-normal text-gray-500">{variant.colorHex}</span></div></label><label className="text-sm font-black">Prix commun €<input required placeholder="Ex. 25,00" inputMode="decimal" value={variant.price} onChange={(event) => setVariant({ ...variant, price: event.target.value })} className="mt-2 w-full rounded-xl border px-3 py-2.5 font-normal" /></label><SizePicker value={variant.sizes} customSizes={variant.customSizes} onChange={(sizes) => setVariant({ ...variant, sizes })} onCustomSizesChange={(customSizes) => setVariant({ ...variant, customSizes })} /><div className="flex flex-col justify-end gap-2"><p className="text-xs leading-5 text-green-900">Une variante sera créée automatiquement pour chaque taille choisie.</p><button className="rounded-xl bg-sbc px-4 py-3 font-black text-white shadow-md"><i className="fas fa-plus mr-2" />Ajouter cette couleur</button></div></form><div className="mt-8 space-y-5">{colorGroups.map((group) => <ColorGroup key={group[0].color} variants={group} reload={load} />)}{!colorGroups.length && <div className="rounded-3xl border-2 border-dashed border-gray-200 p-10 text-center"><i className="fas fa-palette text-4xl text-sbc/25" /><h3 className="mt-4 font-black">Aucune couleur configurée</h3><p className="mt-1 text-sm text-gray-500">Utilisez le formulaire ci-dessus pour créer la première.</p></div>}</div></section>}

                        {selected && activeTab === "images" && <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-7"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-sbc">Étape 3</p><h2 className="mt-1 text-2xl font-black">Photos par couleur</h2><p className="mt-1 text-sm text-gray-500">Choisissez d'abord la couleur, puis importez ses photos. La première devient automatiquement principale.</p></div>{!productColors.length ? <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-950"><i className="fas fa-arrow-left mr-2" />Créez au moins une couleur à l'étape précédente avant d'ajouter des photos.</div> : <div className="mt-7 grid gap-4 rounded-3xl border border-green-200 bg-green-50 p-5 md:grid-cols-[1fr_auto] md:items-end"><label className="text-sm font-black">Ces photos correspondent à<select value={imageColor} onChange={(event) => setImageColor(event.target.value)} className="mt-2 w-full rounded-xl border bg-white px-4 py-3 font-normal"><option value="">Toutes les couleurs (photo générale)</option>{productColors.map(([color]) => <option key={color} value={color}>{color}</option>)}</select></label><label className="cursor-pointer rounded-xl bg-sbc px-5 py-3 text-center font-black text-white shadow-md"><i className="fas fa-upload mr-2" />Importer et recadrer<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImageToCrop} className="sr-only" /></label><p className="text-xs text-green-900 md:col-span-2"><i className="fas fa-crop-alt mr-2" />Chaque image sera obligatoirement recadrée au format carré 1200 × 1200 px.</p></div>}<div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{selected.images.map((image) => <article key={image.id} className="overflow-hidden rounded-2xl border bg-gray-50"><div className="relative aspect-square bg-white"><img src={image.url} alt="" className="h-full w-full object-cover" />{image.isPrimary && <span className="absolute left-3 top-3 rounded-full bg-sbc px-3 py-1 text-[10px] font-black uppercase text-white shadow">Principale</span>}</div><div className="space-y-3 p-4"><label className="block text-xs font-black text-gray-700">Affichée pour<select value={image.color || ""} onChange={(event) => updateImage(image.id, event.target.value || null, image.displayOrder, image.isPrimary)} className="mt-1 w-full rounded-xl border bg-white p-2.5 font-normal"><option value="">Toutes les couleurs</option>{productColors.map(([color]) => <option key={color} value={color}>{color}</option>)}</select></label><div className="flex gap-2"><button type="button" disabled={image.isPrimary} onClick={() => updateImage(image.id, image.color, image.displayOrder, true)} className="flex-1 rounded-xl border border-sbc px-3 py-2 text-xs font-black text-sbc disabled:border-gray-200 disabled:text-gray-400"><i className="fas fa-star mr-1" />{image.isPrimary ? "Photo principale" : "Définir principale"}</button><button type="button" onClick={() => removeImage(image.id)} className="rounded-xl bg-red-50 px-3 py-2 text-red-700" aria-label="Retirer l'image"><i className="fas fa-trash" /></button></div></div></article>)}</div>{!selected.images.length && <div className="mt-7 rounded-3xl border-2 border-dashed border-gray-200 p-10 text-center"><i className="far fa-images text-4xl text-sbc/25" /><h3 className="mt-4 font-black">Aucune photo</h3><p className="mt-1 text-sm text-gray-500">Importez la première photo de ce produit.</p></div>}<details className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4"><summary className="cursor-pointer text-sm font-black text-gray-700">Associer une image déjà importée</summary><div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]"><select value={mediaId} onChange={(event) => setMediaId(event.target.value)} className="rounded-xl border bg-white px-3 py-2.5 text-sm"><option value="">Choisir une image boutique</option>{media.filter((image) => image.purpose === "product" && !selected.images.some((assigned) => assigned.imageId === image.id)).map((image) => <option key={image.id} value={image.id}>Image boutique #{image.id}</option>)}</select><select value={imageColor} onChange={(event) => setImageColor(event.target.value)} className="rounded-xl border bg-white px-3 py-2.5 text-sm"><option value="">Toutes les couleurs</option>{productColors.map(([color]) => <option key={color} value={color}>{color}</option>)}</select><button type="button" disabled={!mediaId} onClick={addImage} className="rounded-xl bg-gray-950 px-4 py-2.5 font-black text-white disabled:opacity-40">Associer</button></div></details></section>}
                        {activeTab === "details" && <section className={`mt-4 rounded-3xl border p-5 shadow-sm md:p-7 ${form.personalizationEnabled ? "border-sbc/30 bg-green-50" : "border-gray-200 bg-white"}`}><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={form.personalizationEnabled} onChange={(event) => setForm({ ...form, personalizationEnabled: event.target.checked })} className="mt-1 h-5 w-5 accent-sbc" /><span><strong className="block text-base text-gray-950">Ce vêtement est personnalisable</strong><span className="mt-1 block text-sm font-normal leading-6 text-gray-600">Le client pourra ajouter un texte ou un numéro, devant ou dans le dos.</span></span></label>{form.personalizationEnabled && <label className="mt-5 block max-w-xs text-sm font-black">Prix de la personnalisation (€)<input min="0.01" step="0.01" inputMode="decimal" value={form.personalizationPrice} onChange={(event) => setForm({ ...form, personalizationPrice: event.target.value })} placeholder="Ex. 5,00" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-normal focus:border-sbc focus:outline-none focus:ring-4 focus:ring-sbc/15" /><span className="mt-1 block text-xs font-normal text-gray-500">Supplément ajouté à chaque vêtement personnalisé.</span></label>}</section>}
                        {activeTab === "details" && form.personalizationEnabled && <section className="mt-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-7"><div><h2 className="text-lg font-black text-gray-950">Options proposées au client</h2><p className="mt-1 text-sm text-gray-500">Activez chaque type puis choisissez précisément où il peut être placé.</p></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><fieldset className={`rounded-2xl border p-4 ${form.personalizationTextEnabled ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}><legend className="px-1 text-sm font-black text-gray-950"><label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={form.personalizationTextEnabled} onChange={(event) => setForm({ ...form, personalizationTextEnabled: event.target.checked })} className="h-4 w-4 accent-sbc" /><i className="fas fa-font text-sbc" />Texte</label></legend>{form.personalizationTextEnabled ? <div className="mt-3"><p className="text-xs font-black uppercase tracking-wide text-gray-600">Le texte peut être placé</p><div className="mt-2 grid grid-cols-2 gap-2"><label className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-bold ${form.personalizationTextFrontEnabled ? "border-sbc bg-sbc text-white" : "border-gray-200 bg-white text-gray-600"}`}><input type="checkbox" checked={form.personalizationTextFrontEnabled} onChange={(event) => setForm({ ...form, personalizationTextFrontEnabled: event.target.checked })} className="sr-only" />Devant</label><label className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-bold ${form.personalizationTextBackEnabled ? "border-sbc bg-sbc text-white" : "border-gray-200 bg-white text-gray-600"}`}><input type="checkbox" checked={form.personalizationTextBackEnabled} onChange={(event) => setForm({ ...form, personalizationTextBackEnabled: event.target.checked })} className="sr-only" />Dos</label></div></div> : <p className="mt-3 text-xs text-gray-500">Le texte ne sera pas proposé.</p>}</fieldset><fieldset className={`rounded-2xl border p-4 ${form.personalizationNumberEnabled ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}><legend className="px-1 text-sm font-black text-gray-950"><label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={form.personalizationNumberEnabled} onChange={(event) => setForm({ ...form, personalizationNumberEnabled: event.target.checked })} className="h-4 w-4 accent-sbc" /><i className="fas fa-hashtag text-sbc" />Numéro</label></legend>{form.personalizationNumberEnabled ? <div className="mt-3"><p className="text-xs font-black uppercase tracking-wide text-gray-600">Le numéro peut être placé</p><div className="mt-2 grid grid-cols-2 gap-2"><label className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-bold ${form.personalizationNumberFrontEnabled ? "border-sbc bg-sbc text-white" : "border-gray-200 bg-white text-gray-600"}`}><input type="checkbox" checked={form.personalizationNumberFrontEnabled} onChange={(event) => setForm({ ...form, personalizationNumberFrontEnabled: event.target.checked })} className="sr-only" />Devant</label><label className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-bold ${form.personalizationNumberBackEnabled ? "border-sbc bg-sbc text-white" : "border-gray-200 bg-white text-gray-600"}`}><input type="checkbox" checked={form.personalizationNumberBackEnabled} onChange={(event) => setForm({ ...form, personalizationNumberBackEnabled: event.target.checked })} className="sr-only" />Dos</label></div></div> : <p className="mt-3 text-xs text-gray-500">Le numéro ne sera pas proposé.</p>}</fieldset></div></section>}
                    </div>
                </div>
            </div>
        </main>
    );
}
