/**
 * Favicon generation helpers.
 * Creates standard favicon files fully in-browser.
 */

/** Load a user-selected image file into an HTMLImageElement. */
export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read image. Please upload a valid PNG, JPG, WebP, or SVG.'));
    };

    image.src = url;
  });
}

/** Render an image into a square canvas at the requested size. */
export function renderImageToCanvas(image, size, { fit = 'cover', background = 'transparent' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not supported in this browser.');
  }

  if (background !== 'transparent') {
    context.fillStyle = background;
    context.fillRect(0, 0, size, size);
  } else {
    context.clearRect(0, 0, size, size);
  }

  const scale = fit === 'contain'
    ? Math.min(size / image.width, size / image.height)
    : Math.max(size / image.width, size / image.height);

  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const dx = (size - drawWidth) / 2;
  const dy = (size - drawHeight) / 2;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, dx, dy, drawWidth, drawHeight);

  return canvas;
}

/** Convert a canvas to PNG blob. */
export function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate image blob.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

/** Convert a canvas into an SVG favicon by embedding PNG data. */
export function canvasToSvgBlob(canvas) {
  const dataUrl = canvas.toDataURL('image/png');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">\n  <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>\n</svg>`;
  return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
}

/** Build a valid favicon.ico file with PNG payloads. */
export async function createIcoBlob(pngBlobs) {
  if (!pngBlobs.length) {
    throw new Error('No images provided for ICO generation.');
  }

  const pngBytes = await Promise.all(
    pngBlobs.map(async ({ size, blob }) => ({
      size,
      bytes: new Uint8Array(await blob.arrayBuffer()),
    })),
  );

  const headerSize = 6;
  const directoryEntrySize = 16;
  const directorySize = directoryEntrySize * pngBytes.length;
  const imageBytesTotal = pngBytes.reduce((sum, item) => sum + item.bytes.length, 0);
  const totalSize = headerSize + directorySize + imageBytesTotal;

  const output = new Uint8Array(totalSize);
  const view = new DataView(output.buffer);

  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // image type: icon
  view.setUint16(4, pngBytes.length, true);

  let imageOffset = headerSize + directorySize;

  pngBytes.forEach((item, index) => {
    const entryOffset = headerSize + index * directoryEntrySize;
    const sizeByte = item.size >= 256 ? 0 : item.size;

    output[entryOffset] = sizeByte; // width
    output[entryOffset + 1] = sizeByte; // height
    output[entryOffset + 2] = 0; // color palette
    output[entryOffset + 3] = 0; // reserved

    view.setUint16(entryOffset + 4, 1, true); // planes
    view.setUint16(entryOffset + 6, 32, true); // bpp
    view.setUint32(entryOffset + 8, item.bytes.length, true); // image bytes length
    view.setUint32(entryOffset + 12, imageOffset, true); // offset

    output.set(item.bytes, imageOffset);
    imageOffset += item.bytes.length;
  });

  return new Blob([output], { type: 'image/x-icon' });
}

/**
 * Generate a standard favicon pack from a source image.
 * @returns {Promise<Array<{ filename: string, blob: Blob, size?: number, label: string }>>}
 */
export async function generateFaviconAssets(file, options = {}) {
  const image = await loadImageFromFile(file);
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const pngSizes = [16, 32, 180, 192, 512];
  const iconSizes = [...new Set([...icoSizes, ...pngSizes])];

  const pngBySize = {};
  const canvasBySize = {};
  for (const size of iconSizes) {
    const canvas = renderImageToCanvas(image, size, options);
    canvasBySize[size] = canvas;
    pngBySize[size] = await canvasToPngBlob(canvas);
  }

  const svgBlob = canvasToSvgBlob(canvasBySize[512]);

  const icoBlob = await createIcoBlob(
    icoSizes.map((size) => ({ size, blob: pngBySize[size] })),
  );

  const icoAssets = await Promise.all(
    icoSizes.map(async (size) => ({
      filename: `favicon-${size}x${size}.ico`,
      blob: await createIcoBlob([{ size, blob: pngBySize[size] }]),
      size,
      label: `Favicon ICO ${size}x${size}`,
    })),
  );

  return [
    { filename: 'favicon.ico', blob: icoBlob, label: 'favicon.ico (multi-size)' },
    { filename: 'favicon.svg', blob: svgBlob, size: 512, label: 'Favicon SVG' },
    ...icoAssets,
    { filename: 'favicon-16x16.png', blob: pngBySize[16], size: 16, label: 'Favicon 16x16' },
    { filename: 'favicon-32x32.png', blob: pngBySize[32], size: 32, label: 'Favicon 32x32' },
    { filename: 'apple-touch-icon.png', blob: pngBySize[180], size: 180, label: 'Apple Touch Icon' },
    { filename: 'android-chrome-192x192.png', blob: pngBySize[192], size: 192, label: 'Android 192x192' },
    { filename: 'android-chrome-512x512.png', blob: pngBySize[512], size: 512, label: 'Android 512x512' },
  ];
}
