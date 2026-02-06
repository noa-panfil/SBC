import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedImageBlob: Blob) => void;
    onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        try {
            if (!croppedAreaPixels) return;
            const croppedImageBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels
            );
            onCropComplete(croppedImageBlob);
        } catch (e) {
            console.error(e);
        }
    }, [croppedAreaPixels, onCropComplete, imageSrc]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-fade-in-up m-4">
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <i className="fas fa-crop-alt"></i> Ajuster la photo
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
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="p-6 bg-white space-y-6">
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
                            className="flex-1 py-3 rounded-xl font-bold bg-sbc text-white shadow-lg hover:bg-sbc-dark transition uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-check"></i> Valider
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
