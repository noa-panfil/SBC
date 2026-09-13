import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedImageBlob: Blob) => void;
    onCancel: () => void;
    aspect?: number;
    cropShape?: "rect" | "round";
    outputWidth?: number;
    outputHeight?: number;
    outputMimeType?: "image/jpeg" | "image/png" | "image/webp";
    faceGuide?: boolean;
    title?: string;
}

export default function ImageCropper({
    imageSrc,
    onCropComplete,
    onCancel,
    aspect = 1,
    cropShape = "round",
    outputWidth,
    outputHeight,
    outputMimeType = "image/jpeg",
    faceGuide = false,
    title = "Ajuster la photo",
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [processing, setProcessing] = useState(false);

    const showCroppedImage = useCallback(async () => {
        try {
            if (!croppedAreaPixels) return;
            setProcessing(true);
            const croppedImageBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                0,
                { horizontal: false, vertical: false },
                {
                    width: outputWidth || croppedAreaPixels.width,
                    height: outputHeight || croppedAreaPixels.height,
                    mimeType: outputMimeType,
                    quality: 0.92,
                }
            );
            onCropComplete(croppedImageBlob);
        } catch (error) {
            console.error(error);
            setProcessing(false);
        }
    }, [croppedAreaPixels, imageSrc, onCropComplete, outputHeight, outputMimeType, outputWidth]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="m-4 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in-up">
                <div className="flex items-center justify-between bg-gray-900 p-4 text-white">
                    <h3 className="flex items-center gap-2 font-bold"><i className="fas fa-crop-alt" />{title}</h3>
                    <button type="button" onClick={onCancel} aria-label="Fermer le recadrage" className="text-gray-400 transition hover:text-white"><i className="fas fa-times text-xl" /></button>
                </div>

                <div className="relative h-80 w-full bg-gray-100">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        cropShape={cropShape}
                        showGrid={cropShape === "rect"}
                        onCropChange={setCrop}
                        onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)}
                        onZoomChange={setZoom}
                    />
                    {faceGuide && <div className="pointer-events-none absolute left-1/2 top-[8%] z-10 h-[clamp(100px,34%,120px)] w-[clamp(76px,17%,90px)] -translate-x-1/2 rounded-[50%] border-2 border-dashed border-white/90 shadow-[0_0_0_1px_rgba(8,43,29,.7),0_0_20px_rgba(0,0,0,.3)]"><span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-white/80" /><span className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-white/80" /></div>}
                </div>

                <div className="space-y-6 bg-white p-6">
                    {faceGuide && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-950"><p className="font-black"><i className="far fa-user mr-2 text-sbc" />Alignez le visage dans l’ovale</p><p className="mt-1 text-xs leading-5 text-green-800">Gardez la même position pour les deux portraits. Ce repère ne sera pas visible sur la photo finale.</p></div>}
                    {outputWidth && outputHeight && <p className="text-center text-sm font-semibold text-gray-600">Format final imposé : {outputWidth} × {outputHeight} px</p>}
                    <div className="flex items-center gap-4"><i className="fas fa-minus text-xs text-gray-400" /><input type="range" value={zoom} min={1} max={10} step={0.1} aria-label="Zoom" onChange={(event) => setZoom(Number(event.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-sbc" /><i className="fas fa-plus text-xs text-gray-400" /></div>
                    <div className="flex gap-3"><button type="button" onClick={onCancel} className="flex-1 rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-gray-500 transition hover:bg-gray-100">Annuler</button><button type="button" onClick={showCroppedImage} disabled={processing} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sbc py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-sbc-dark disabled:opacity-50"><i className={`fas ${processing ? "fa-spinner fa-spin" : "fa-check"}`} />{processing ? "Traitement…" : "Valider"}</button></div>
                </div>
            </div>
        </div>
    );
}
