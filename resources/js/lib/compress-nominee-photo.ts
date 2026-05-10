/** Matches server rule: StorePartySlateCandidateRequest `photo` max:3072 (kilobytes). */
export const NOMINEE_PHOTO_MAX_BYTES = 3072 * 1024;

function canvasToJpegBlob(
    canvas: HTMLCanvasElement,
    quality: number,
): Promise<Blob | null> {
    return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    });
}

function outputBaseName(originalName: string): string {
    const trimmed = originalName.trim();
    if (!trimmed) {
        return 'nominee-photo';
    }
    return trimmed.replace(/\.[^/.]+$/i, '') || 'nominee-photo';
}

/**
 * If {@link file} is larger than {@link maxBytes}, re-encode as JPEG via canvas (scale + quality)
 * until it fits or limits are reached. Non-image types are returned unchanged.
 */
export async function compressNomineePhotoIfNeeded(
    file: File,
    maxBytes: number = NOMINEE_PHOTO_MAX_BYTES,
): Promise<File> {
    if (file.size <= maxBytes) {
        return file;
    }

    if (
        file.type !== 'image/jpeg' &&
        file.type !== 'image/png' &&
        file.type !== 'image/gif' &&
        file.type !== 'image/webp'
    ) {
        return file;
    }

    let bitmap: ImageBitmap | null = null;

    try {
        bitmap = await createImageBitmap(file);
    } catch {
        return file;
    }

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx || bitmap.width < 1 || bitmap.height < 1) {
            return file;
        }

        let scale = Math.min(1, Math.sqrt(maxBytes / (file.size * 1.1)) || 1);
        let quality = 0.92;
        let bestTooLarge: Blob | null = null;
        let bestTooLargeSize = Number.POSITIVE_INFINITY;

        const baseName = outputBaseName(file.name);
        let lastBlob: Blob | null = null;

        let attempts = 0;
        while (attempts < 36) {
            attempts += 1;
            const w = Math.max(1, Math.round(bitmap.width * scale));
            const h = Math.max(1, Math.round(bitmap.height * scale));
            canvas.width = w;
            canvas.height = h;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(bitmap, 0, 0, w, h);

            const blob = await canvasToJpegBlob(canvas, quality);
            lastBlob = blob;

            if (!blob) {
                scale *= 0.85;
                quality = Math.max(0.4, quality - 0.08);
                continue;
            }

            if (blob.size <= maxBytes) {
                console.log(
                    '[compressNomineePhoto] compressed',
                    file.size,
                    '→',
                    blob.size,
                    'bytes',
                    { scale: scale.toFixed(3), quality: quality.toFixed(2) },
                );
                return new File([blob], `${baseName}.jpg`, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });
            }

            if (blob.size < bestTooLargeSize) {
                bestTooLargeSize = blob.size;
                bestTooLarge = blob;
            }

            if (quality > 0.52) {
                quality -= 0.06;
            } else {
                scale *= 0.86;
                quality = 0.85;
            }

            if (w <= 280 && h <= 280 && quality < 0.48) {
                break;
            }
        }

        if (bestTooLarge !== null && bestTooLarge.size < file.size) {
            console.log(
                '[compressNomineePhoto] using best-effort JPEG',
                file.size,
                '→',
                bestTooLarge.size,
            );
            return new File([bestTooLarge], `${baseName}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
            });
        }

        if (lastBlob !== null && lastBlob.size < file.size) {
            return new File([lastBlob], `${baseName}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
            });
        }

        return file;
    } finally {
        bitmap?.close();
    }
}
