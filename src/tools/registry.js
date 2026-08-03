import { lazy } from 'react';

/**
 * Maps tool IDs from data.js to their React component implementations.
 * Lazy-loaded so PDF libraries only download when a tool page is visited.
 */
export const toolRegistry = {
  'json-formatter': lazy(() => import('./developer/JSONFormatter')),
  'base64-encoder': lazy(() => import('./developer/Base64Encoder')),
  'regex-tester': lazy(() => import('./developer/RegexTester')),
  'pdf-merger': lazy(() => import('./pdf/PdfMerger')),
  'pdf-splitter': lazy(() => import('./pdf/PdfSplitter')),
  'pdf-compressor': lazy(() => import('./pdf/PdfCompressor')),
  'pdf-to-image': lazy(() => import('./pdf/PdfToImage')),
  'image-to-pdf': lazy(() => import('./pdf/ImageToPdf')),
  'favicon-generator': lazy(() => import('./image/FaviconGenerator')),
  'background-remover': lazy(() => import('./image/BackgroundRemover')),
  'qr-code-generator': lazy(() => import('./generators/QrCodeGenerator')),
  'barcode-generator': lazy(() => import('./generators/BarcodeGenerator')),
};
