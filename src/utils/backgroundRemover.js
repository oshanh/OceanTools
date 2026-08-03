/**
 * Lightweight, client-side background removal.
 * Strategy: detect colors near the edges, flood-fill connected similar pixels,
 * then make those pixels transparent with optional feathering.
 */

/** Load an image file into an HTMLImageElement. */
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to read this image. Try PNG, JPG, or WebP.'));
    };

    image.src = url;
  });
}

/** Draw an image to canvas, optionally downscaling for processing speed. */
function drawImageToCanvas(image, maxDimension = 1800) {
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not supported in this browser.');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  return { canvas, context };
}

function colorDistance(data, index, r, g, b) {
  const dr = data[index] - r;
  const dg = data[index + 1] - g;
  const db = data[index + 2] - b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/** Sample border colors so we can infer probable background tones. */
function sampleEdgePalette(data, width, height) {
  const samples = [];
  const stride = Math.max(1, Math.floor(Math.min(width, height) / 60));

  for (let x = 0; x < width; x += stride) {
    const top = (0 * width + x) * 4;
    const bottom = ((height - 1) * width + x) * 4;
    samples.push([data[top], data[top + 1], data[top + 2]]);
    samples.push([data[bottom], data[bottom + 1], data[bottom + 2]]);
  }

  for (let y = 0; y < height; y += stride) {
    const left = (y * width + 0) * 4;
    const right = (y * width + (width - 1)) * 4;
    samples.push([data[left], data[left + 1], data[left + 2]]);
    samples.push([data[right], data[right + 1], data[right + 2]]);
  }

  return samples;
}

function minDistanceToPalette(data, index, palette) {
  let min = Number.POSITIVE_INFINITY;

  for (let i = 0; i < palette.length; i++) {
    const [r, g, b] = palette[i];
    const dist = colorDistance(data, index, r, g, b);
    if (dist < min) min = dist;
  }

  return min;
}

/**
 * Remove background from an image file.
 * @param {File} file
 * @param {{ threshold?: number, feather?: number, maxDimension?: number }} options
 */
export async function removeImageBackground(file, options = {}) {
  const {
    threshold = 58,
    feather = 24,
    maxDimension = 1800,
  } = options;

  const image = await loadImageFile(file);
  const { canvas, context } = drawImageToCanvas(image, maxDimension);
  const width = canvas.width;
  const height = canvas.height;

  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;

  const palette = sampleEdgePalette(data, width, height);
  const visited = new Uint8Array(width * height);
  const background = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;

    const px = idx * 4;
    const alpha = data[px + 3];
    if (alpha === 0) return;

    const dist = minDistanceToPalette(data, px, palette);
    if (dist > threshold) return;

    visited[idx] = 1;
    background[idx] = 1;
    queue[tail++] = idx;
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }

  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % width;
    const y = Math.floor(idx / width);

    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  const featherRange = Math.max(1, feather);

  for (let idx = 0; idx < background.length; idx++) {
    if (!background[idx]) continue;

    const px = idx * 4;
    const dist = minDistanceToPalette(data, px, palette);
    const softness = Math.max(0, Math.min(1, (dist - threshold) / featherRange));
    const newAlpha = Math.round(255 * softness);

    data[px + 3] = Math.min(data[px + 3], newAlpha);
  }

  context.putImageData(imageData, 0, 0);

  const outputBlob = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to export output image.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });

  const outputUrl = URL.createObjectURL(outputBlob);

  return {
    blob: outputBlob,
    previewUrl: outputUrl,
    width,
    height,
  };
}
