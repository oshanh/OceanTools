/**
 * Mock data for OceanTools — categories and their associated tools.
 * Each category has an id, display metadata, and a list of tool references.
 * Tools are stored in a flat array and linked to categories via categoryId.
 */

export const categories = [
  {
    id: 'developer-tools',
    name: 'Developer Tools',
    description: 'Essential utilities for coding, debugging, and data manipulation.',
    icon: 'Code2',
    toolCount: 8,
    accent: 'cyan',
  },
  {
    id: 'image-tools',
    name: 'Image Tools',
    description: 'Resize, convert, compress, and optimize your images online.',
    icon: 'Image',
    toolCount: 6,
    accent: 'emerald',
  },
  {
    id: 'text-formatting',
    name: 'Text Formatting',
    description: 'Format, analyze, and transform text with powerful utilities.',
    icon: 'Type',
    toolCount: 5,
    accent: 'cyan',
  },
  {
    id: 'security-tools',
    name: 'Security Tools',
    description: 'Generate passwords, hash data, and encode sensitive information.',
    icon: 'Shield',
    toolCount: 4,
    accent: 'emerald',
  },
  {
    id: 'converters',
    name: 'Converters',
    description: 'Convert between units, formats, and encodings instantly.',
    icon: 'ArrowLeftRight',
    toolCount: 4,
    accent: 'cyan',
  },
  {
    id: 'generators',
    name: 'Generators',
    description: 'Create UUIDs, QR codes, lorem ipsum, and more.',
    icon: 'Sparkles',
    toolCount: 4,
    accent: 'emerald',
  },
  {
    id: 'pdf-tools',
    name: 'PDF Tools',
    description: 'Merge, split, convert, and compress PDF documents in your browser.',
    icon: 'FileText',
    toolCount: 8,
    accent: 'cyan',
  },
  {
    id: 'interesting-tools',
    name: 'Interesting Tools',
    description: 'Curious experiments — see what the web knows about you and explore hidden browser capabilities.',
    icon: 'FlaskConical',
    toolCount: 1,
    accent: 'emerald',
  },
];

export const tools = [
  // Developer Tools
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Beautify, minify, and validate JSON data with syntax highlighting.',
    categoryId: 'developer-tools',
    icon: 'Braces',
    popular: true,
  },
  {
    id: 'base64-encoder',
    name: 'Base64 Encoder/Decoder',
    description: 'Encode and decode text or files to and from Base64 format.',
    categoryId: 'developer-tools',
    icon: 'Binary',
    popular: false,
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test regular expressions against sample text with match highlighting.',
    categoryId: 'developer-tools',
    icon: 'SearchCode',
    popular: true,
  },
  {
    id: 'url-encoder',
    name: 'URL Encoder/Decoder',
    description: 'Encode or decode URL components safely for web applications.',
    categoryId: 'developer-tools',
    icon: 'Link',
    popular: false,
  },
  {
    id: 'html-formatter',
    name: 'HTML Formatter',
    description: 'Format and minify HTML markup for readability or production.',
    categoryId: 'developer-tools',
    icon: 'FileCode',
    popular: false,
  },
  {
    id: 'css-formatter',
    name: 'CSS Formatter',
    description: 'Beautify and minify CSS stylesheets with proper indentation.',
    categoryId: 'developer-tools',
    icon: 'Palette',
    popular: false,
  },

  // Image Tools
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    description: 'Resize images to custom dimensions while maintaining quality.',
    categoryId: 'image-tools',
    icon: 'Maximize2',
    popular: true,
  },
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Reduce file size without noticeable quality loss.',
    categoryId: 'image-tools',
    icon: 'Minimize2',
    popular: true,
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    description: 'Convert between PNG, JPG, WebP, and other image formats.',
    categoryId: 'image-tools',
    icon: 'RefreshCw',
    popular: false,
  },
  {
    id: 'color-picker',
    name: 'Color Picker',
    description: 'Pick colors from images and get HEX, RGB, and HSL values.',
    categoryId: 'image-tools',
    icon: 'Pipette',
    popular: false,
  },
  {
    id: 'favicon-generator',
    name: 'Favicon Generator',
    description: 'Create favicons in multiple sizes from a single image upload.',
    categoryId: 'image-tools',
    icon: 'Square',
    popular: false,
  },
  {
    id: 'background-remover',
    name: 'Background Remover',
    description: 'Remove image backgrounds automatically and export transparent PNGs.',
    categoryId: 'image-tools',
    icon: 'Eraser',
    popular: true,
  },

  // Text Formatting
  {
    id: 'word-counter',
    name: 'Word Counter',
    description: 'Count words, characters, sentences, and paragraphs in your text.',
    categoryId: 'text-formatting',
    icon: 'WholeWord',
    popular: true,
  },
  {
    id: 'case-converter',
    name: 'Case Converter',
    description: 'Convert text between uppercase, lowercase, title case, and more.',
    categoryId: 'text-formatting',
    icon: 'CaseSensitive',
    popular: false,
  },
  {
    id: 'markdown-preview',
    name: 'Markdown Preview',
    description: 'Write Markdown and preview the rendered HTML output live.',
    categoryId: 'text-formatting',
    icon: 'FileText',
    popular: true,
  },
  {
    id: 'text-diff',
    name: 'Text Diff',
    description: 'Compare two text blocks and highlight the differences.',
    categoryId: 'text-formatting',
    icon: 'GitCompare',
    popular: false,
  },
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    description: 'Generate placeholder text for designs and mockups.',
    categoryId: 'text-formatting',
    icon: 'AlignLeft',
    popular: false,
  },

  // Security Tools
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Create strong, random passwords with customizable options.',
    categoryId: 'security-tools',
    icon: 'KeyRound',
    popular: true,
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    description: 'Generate MD5, SHA-1, SHA-256, and other cryptographic hashes.',
    categoryId: 'security-tools',
    icon: 'Fingerprint',
    popular: false,
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    description: 'Decode JSON Web Tokens and inspect header and payload claims.',
    categoryId: 'security-tools',
    icon: 'Lock',
    popular: true,
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Generate universally unique identifiers (v4) instantly.',
    categoryId: 'security-tools',
    icon: 'Key',
    popular: false,
  },
  {
    id: 'message-encryptor',
    name: 'Message Encryptor',
    description: 'Encrypt and decrypt secret messages using AES-256 password protection.',
    categoryId: 'security-tools',
    icon: 'FileKey2',
    popular: true,
  },

  // Converters
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    description: 'Convert Unix timestamps to human-readable dates and back.',
    categoryId: 'converters',
    icon: 'Clock',
    popular: true,
  },
  {
    id: 'number-base-converter',
    name: 'Number Base Converter',
    description: 'Convert numbers between binary, decimal, hex, and octal.',
    categoryId: 'converters',
    icon: 'Calculator',
    popular: false,
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    description: 'Convert colors between HEX, RGB, HSL, and CMYK formats.',
    categoryId: 'converters',
    icon: 'Droplets',
    popular: false,
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    description: 'Convert length, weight, temperature, and other units.',
    categoryId: 'converters',
    icon: 'Ruler',
    popular: false,
  },
  {
    id: 'age-calculator',
    name: 'Age Calculator',
    description: 'Calculate exact age or duration between two dates down to the second, with a live ticking counter.',
    categoryId: 'converters',
    icon: 'CalendarClock',
    popular: true,
  },

  // Generators
  {
    id: 'qr-code-generator',
    name: 'QR Code Generator',
    description: 'Create QR codes for URLs, text, Wi-Fi, and contact info.',
    categoryId: 'generators',
    icon: 'QrCode',
    popular: true,
  },
  {
    id: 'barcode-generator',
    name: 'Barcode Generator',
    description: 'Generate barcodes in various formats for products and labels.',
    categoryId: 'generators',
    icon: 'ScanBarcode',
    popular: false,
  },


  // PDF Tools
  {
    id: 'pdf-merger',
    name: 'PDF Merger',
    description: 'Combine multiple PDF files into a single document.',
    categoryId: 'pdf-tools',
    icon: 'Files',
    popular: true,
  },
  {
    id: 'pdf-splitter',
    name: 'PDF Splitter',
    description: 'Split a PDF into separate pages or custom page ranges.',
    categoryId: 'pdf-tools',
    icon: 'Scissors',
    popular: false,
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    description: 'Convert PDF pages to PNG or JPG images.',
    categoryId: 'pdf-tools',
    icon: 'ImageDown',
    popular: true,
  },
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Turn one or more images into a single PDF file.',
    categoryId: 'pdf-tools',
    icon: 'FilePlus',
    popular: false,
  },
  {
    id: 'pdf-compressor',
    name: 'PDF Compressor',
    description: 'Reduce PDF file size while preserving readability.',
    categoryId: 'pdf-tools',
    icon: 'FileDown',
    popular: false,
  },
  {
    id: 'document-scanner',
    name: 'Document Scanner',
    description: 'Scan images into enhanced, high-contrast PDF documents.',
    categoryId: 'pdf-tools',
    icon: 'Scan',
    popular: true,
  },
  {
    id: 'pdf-to-powerpoint',
    name: 'PDF to PowerPoint',
    description: 'Convert PDF pages into downloadable PowerPoint slides.',
    categoryId: 'pdf-tools',
    icon: 'Presentation',
    popular: true,
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert PDF pages into an editable Word (.docx) document with extracted text.',
    categoryId: 'pdf-tools',
    icon: 'FileType',
    popular: true,
  },

  // Interesting Tools
  {
    id: 'browser-fingerprint',
    name: 'Browser Fingerprint',
    description: 'See everything a website can learn about you — IP, device, browser, network, hardware and more.',
    categoryId: 'interesting-tools',
    icon: 'Fingerprint',
    popular: true,
  },
  {
    id: 'random-quote-generator',
    name: 'Random Quote Generator',
    description: 'Discover random quotes from famous people, copy, and share them instantly.',
    categoryId: 'interesting-tools',
    icon: 'MessageSquareQuote',
    popular: false,
  },
];

/** Helper: get a single category by id */
export function getCategoryById(categoryId) {
  return categories.find((cat) => cat.id === categoryId);
}

/** Helper: get all tools belonging to a category */
export function getToolsByCategory(categoryId) {
  return tools.filter((tool) => tool.categoryId === categoryId);
}

/** Helper: get a single tool by id */
export function getToolById(toolId) {
  return tools.find((tool) => tool.id === toolId);
}

/** Helper: get popular tools across all categories */
export function getPopularTools(limit = 6) {
  return tools.filter((tool) => tool.popular).slice(0, limit);
}
