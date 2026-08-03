import JsBarcode from 'jsbarcode';

// ---------------------------------------------------------------------------
// Format registry — metadata + per-format validation
// ---------------------------------------------------------------------------
export const BARCODE_FORMATS = [
    {
        id: 'CODE128',
        label: 'CODE 128',
        description: 'General-purpose, auto-encoding. Accepts any ASCII text.',
        placeholder: 'Hello, World!',
        validate: (v) => v.length > 0 || 'Value cannot be empty.',
        category: 'General',
    },
    {
        id: 'CODE39',
        label: 'CODE 39',
        description: 'Uppercase letters, digits, and a few special chars.',
        placeholder: 'HELLO123',
        validate: (v) => {
            if (!v) return 'Value cannot be empty.';
            if (!/^[A-Z0-9 \-.$/+%*]+$/.test(v))
                return 'CODE 39 only allows uppercase A–Z, 0–9, and: - . $ / + % * (space)';
            return true;
        },
        category: 'General',
    },
    {
        id: 'EAN13',
        label: 'EAN-13',
        description: '12 or 13 digits — check digit is auto-computed.',
        placeholder: '590123412345',
        validate: (v) => {
            if (!/^\d{12,13}$/.test(v)) return 'EAN-13 requires exactly 12 or 13 digits.';
            return true;
        },
        category: 'Retail',
    },
    {
        id: 'EAN8',
        label: 'EAN-8',
        description: '7 or 8 digits — compact variant for small packages.',
        placeholder: '9638507',
        validate: (v) => {
            if (!/^\d{7,8}$/.test(v)) return 'EAN-8 requires exactly 7 or 8 digits.';
            return true;
        },
        category: 'Retail',
    },
    {
        id: 'UPC',
        label: 'UPC-A',
        description: '11 or 12 digits — standard US product barcode.',
        placeholder: '01234565',
        validate: (v) => {
            if (!/^\d{11,12}$/.test(v)) return 'UPC-A requires exactly 11 or 12 digits.';
            return true;
        },
        category: 'Retail',
    },
    {
        id: 'ITF14',
        label: 'ITF-14',
        description: '13 or 14 digits — used for shipping containers.',
        placeholder: '1234567890123',
        validate: (v) => {
            if (!/^\d{13,14}$/.test(v)) return 'ITF-14 requires exactly 13 or 14 digits.';
            return true;
        },
        category: 'Logistics',
    },
    {
        id: 'MSI',
        label: 'MSI / Plessey',
        description: 'Digits only — used in retail shelf labels.',
        placeholder: '1234567',
        validate: (v) => {
            if (!/^\d+$/.test(v)) return 'MSI only accepts digits.';
            return true;
        },
        category: 'Retail',
    },
    {
        id: 'pharmacode',
        label: 'Pharmacode',
        description: 'Number between 3 and 131070 — used in pharmaceutical packaging.',
        placeholder: '1234',
        validate: (v) => {
            const n = parseInt(v, 10);
            if (!/^\d+$/.test(v) || n < 3 || n > 131070)
                return 'Pharmacode must be a number between 3 and 131070.';
            return true;
        },
        category: 'Pharma',
    },
    {
        id: 'codabar',
        label: 'Codabar',
        description: 'Digits + special chars. Must start/end with A, B, C, or D.',
        placeholder: 'A12345B',
        validate: (v) => {
            if (!/^[ABCDabcd][0-9\-$:/.+]+[ABCDabcd]$/i.test(v))
                return 'Codabar must start and end with A/B/C/D and contain only digits and - $ : / . +';
            return true;
        },
        category: 'Logistics',
    },
];

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/**
 * Render a barcode onto an SVG element using JsBarcode.
 * @param {SVGElement} svgEl
 * @param {string} format  JsBarcode format string
 * @param {string} value
 * @param {object} options
 * @returns {boolean} true on success, false on error (invalid value)
 */
export function renderToSvg(svgEl, format, value, options = {}) {
    const {
        lineColor = '#ffffff',
        background = '#0f172a',
        width = 2,
        height = 100,
        displayValue = true,
        fontSize = 14,
        textMargin = 8,
        margin = 12,
        fontOptions = '',
    } = options;

    try {
        JsBarcode(svgEl, value, {
            format,
            lineColor,
            background,
            width,
            height,
            displayValue,
            fontSize,
            textMargin,
            margin,
            fontOptions,
            font: 'Inter, monospace',
            valid: () => { },
        });
        return true;
    } catch {
        return false;
    }
}

/**
 * Export the current SVG element as a PNG Blob at 3× resolution.
 * @param {SVGElement} svgEl
 * @returns {Promise<Blob>}
 */
export async function svgToPngBlob(svgEl) {
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const scale = 3;
            const canvas = document.createElement('canvas');
            canvas.width = svgEl.width.baseVal.value * scale;
            canvas.height = svgEl.height.baseVal.value * scale;
            const ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            canvas.toBlob((blob) => resolve(blob), 'image/png');
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to export PNG.')); };
        img.src = url;
    });
}

/**
 * Export the current SVG element as an SVG Blob.
 * @param {SVGElement} svgEl
 * @returns {Blob}
 */
export function svgToSvgBlob(svgEl) {
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    return new Blob([svgStr], { type: 'image/svg+xml' });
}

/** Group formats by their category */
export const FORMAT_CATEGORIES = BARCODE_FORMATS.reduce((acc, f) => {
    (acc[f.category] = acc[f.category] || []).push(f);
    return acc;
}, {});
