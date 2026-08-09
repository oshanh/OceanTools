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
  'document-scanner': lazy(() => import('./pdf/DocumentScanner')),
  'pdf-to-powerpoint': lazy(() => import('./pdf/PdfToPowerpoint')),
  'favicon-generator': lazy(() => import('./image/FaviconGenerator')),
  'background-remover': lazy(() => import('./image/BackgroundRemover')),
  'color-picker': lazy(() => import('./image/ColorPicker')),
  'qr-code-generator': lazy(() => import('./generators/QrCodeGenerator')),
  'barcode-generator': lazy(() => import('./generators/BarcodeGenerator')),
  'age-calculator': lazy(() => import('./converters/AgeCalculator')),
  'browser-fingerprint': lazy(() => import('./interesting/BrowserFingerprint')),
  'random-quote-generator': lazy(() => import('./interesting/RandomQuoteGenerator')),
  'url-encoder': lazy(() => import('./developer/UrlEncoder')),
  'timestamp-converter': lazy(() => import('./converters/TimestampConverter')),
  'number-base-converter': lazy(() => import('./converters/NumberBaseConverter')),
  'color-converter': lazy(() => import('./converters/ColorConverter')),
  'image-resizer': lazy(() => import('./image/ImageResizer')),
  'image-compressor': lazy(() => import('./image/ImageCompressor')),
  'image-converter': lazy(() => import('./image/ImageConverter')),
  'unit-converter': lazy(() => import('./converters/UnitConverter')),
  'word-counter': lazy(() => import('./text/WordCounter')),
  'case-converter': lazy(() => import('./text/CaseConverter')),
  'markdown-preview': lazy(() => import('./text/MarkdownPreview')),
  'text-diff': lazy(() => import('./text/TextDiff')),
  'lorem-ipsum': lazy(() => import('./text/LoremIpsumGenerator')),
  'password-generator': lazy(() => import('./security/PasswordGenerator')),
  'uuid-generator': lazy(() => import('./security/UuidGenerator')),
  'hash-generator': lazy(() => import('./security/HashGenerator')),
  'jwt-decoder': lazy(() => import('./security/JwtDecoder')),
  'message-encryptor': lazy(() => import('./security/MessageEncryptor')),
};
