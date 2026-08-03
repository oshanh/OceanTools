/**
 * Utility for resizing images directly in the browser using HTML Canvas.
 */

/**
 * Resizes an image file based on given width/height parameters.
 * @param {File} file - The original image file
 * @param {Object} options - Configuration object
 * @param {number} options.width - Target width
 * @param {number} options.height - Target height
 * @param {boolean} options.maintainAspectRatio - If true, scales dimensions based on original ratio
 * @param {boolean} options.isWidthPriority - If true and maintaining ratio, width is the driver. Otherwise height.
 * @returns {Promise<{ blob: Blob, originalDimensions: {width, height}, resultDimensions: {width, height} }>}
 */
export async function resizeImage(file, options) {
    return new Promise((resolve, reject) => {
        const { width, height, maintainAspectRatio = true, isWidthPriority = true } = options;

        // Ensure we have an image
        if (!file.type.startsWith('image/')) {
            return reject(new Error('Selected file is not an image.'));
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            let targetWidth = width;
            let targetHeight = height;

            if (maintainAspectRatio) {
                const ratio = img.width / img.height;
                if (isWidthPriority) {
                    targetHeight = Math.round(width / ratio);
                } else {
                    targetWidth = Math.round(height * ratio);
                }
            }

            // Create canvas for resizing
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext('2d');

            // For smoother resizing, particularly scaling down
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw image scaled
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Export logic (preserving formats like webp, jpeg, png)
            let exportType = file.type;
            // Native browsers support outputting jpeg, png, webp
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(exportType)) {
                exportType = 'image/png'; // Fallback for tiff/bmp or others
            }

            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas to Blob conversion failed.'));
                }

                resolve({
                    blob,
                    originalDimensions: { width: img.width, height: img.height },
                    resultDimensions: { width: targetWidth, height: targetHeight }
                });
            }, exportType, 0.95);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image for resizing.'));
        };

        img.src = objectUrl;
    });
}

/**
 * Very fast helper to just extract original dimensions without resizing
 */
export async function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => reject(new Error('Could not read dimensions'));
        img.src = objectUrl;
    });
}
