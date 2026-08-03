import { lazy } from 'react';

/**
 * Maps tool IDs from data.js to their React component implementations.
 * Lazy-loaded so PDF libraries only download when a tool page is visited.
 */
export const toolRegistry = {
  'pdf-to-image': lazy(() => import('./pdf/PdfToImage')),
  'image-to-pdf': lazy(() => import('./pdf/ImageToPdf')),
  'favicon-generator': lazy(() => import('./image/FaviconGenerator')),
};
