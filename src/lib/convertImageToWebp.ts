import sharp from "sharp";

const acceptedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
]);

const acceptedExtensions = new Set(["jpg", "jpeg", "jfif", "png", "webp", "gif", "avif"]);

export class ImageConversionError extends Error {}

type ConversionOptions = {
    maxInputBytes?: number;
    expectedWidth?: number;
    expectedHeight?: number;
    quality?: number;
};

export async function convertImageToWebp(file: File, options: ConversionOptions = {}) {
    const maxInputBytes = options.maxInputBytes ?? 20 * 1024 * 1024;
    if (file.size < 1 || file.size > maxInputBytes) {
        throw new ImageConversionError(`L’image doit peser entre 1 octet et ${Math.floor(maxInputBytes / 1024 / 1024)} Mo.`);
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!acceptedMimeTypes.has(file.type.toLowerCase()) && !acceptedExtensions.has(extension)) {
        throw new ImageConversionError("Format non autorisé. Utilise une image JPEG, PNG, WebP, GIF ou AVIF.");
    }

    try {
        const input = Buffer.from(await file.arrayBuffer());
        let image = sharp(input, { animated: true, failOn: "error" });
        const metadata = await image.metadata();
        if (!metadata.width || !metadata.height) {
            throw new ImageConversionError("Les dimensions de l’image sont illisibles.");
        }

        if (options.expectedWidth && options.expectedHeight &&
            (metadata.width !== options.expectedWidth || metadata.height !== options.expectedHeight)) {
            throw new ImageConversionError(`L’image finale doit mesurer exactement ${options.expectedWidth} × ${options.expectedHeight} px.`);
        }

        // Les photos simples sont automatiquement réorientées selon leurs données EXIF.
        // Une animation reste intacte lors de sa conversion en WebP animé.
        if ((metadata.pages ?? 1) === 1) image = image.rotate();

        const data = await image.webp({
            quality: options.quality ?? 88,
            alphaQuality: 90,
            effort: 5,
            smartSubsample: true,
        }).toBuffer();

        const baseName = file.name.replace(/\.[^.]+$/, "").trim() || "image";
        return {
            data,
            name: `${baseName.slice(0, 250)}.webp`,
            mimeType: "image/webp" as const,
            byteSize: data.length,
            width: metadata.width,
            height: metadata.height,
        };
    } catch (error) {
        if (error instanceof ImageConversionError) throw error;
        throw new ImageConversionError("Le fichier reçu n’est pas une image valide ou ne peut pas être converti en WebP.");
    }
}
