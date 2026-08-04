import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedImageBlob: Blob) => void;
    onCancel: () => void;
    aspect?: number;
    cropShape?: "rect" | "round";
    outputWidth?: number;
    outputHeight?: number;
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
    title = "Ajuster la photo",
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [processing, setProcessing] = useState(false);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

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
                    mimeType: "image/jpeg",
                    quality: 0.92,
                }
            );
            onCropComplete(croppedImageBlob);
        } catch (e) {
            console.error(e);
            setProcessing(false);
        }
    }, [croppedAreaPixels, onCropComplete, imageSrc, outputHeight, outputWidth]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-fade-in-up m-4">
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <i className="fas fa-crop-alt"></i> {title}
                    </h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white transition">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div className="relative w-full h-80 bg-gray-100">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        cropShape={cropShape}
                        showGrid={cropShape === "rect"}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="p-6 bg-white space-y-6">
                    {outputWidth && outputHeight && <p className="text-center text-sm font-semibold text-gray-600">Format final imposé : {outputWidth} × {outputHeight} px</p>}
                    <div className="flex items-center gap-4">
                        <i className="fas fa-minus text-gray-400 text-xs"></i>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={10}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sbc"
                        />
                        <i className="fas fa-plus text-gray-400 text-xs"></i>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition uppercase tracking-wider text-xs"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={showCroppedImage}
                            disabled={processing}
                            className="flex-1 py-3 rounded-xl font-bold bg-sbc text-white shadow-lg hover:bg-sbc-dark transition uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <i className={`fas ${processing ? "fa-spinner fa-spin" : "fa-check"}`}></i> {processing ? "Traitement…" : "Valider"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
