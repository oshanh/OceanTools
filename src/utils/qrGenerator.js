import QRCode from 'qrcode';

// ---------------------------------------------------------------------------
// Content-type data formatters
// ---------------------------------------------------------------------------

/** Plain URL or text — pass through as-is */
export function buildTextContent(value) {
    return value.trim();
}

/**
 * Wi-Fi QR payload
 * Format: WIFI:S:<SSID>;T:<WPA|WEP|nopass>;P:<password>;H:<true|false>;;
 */
export function buildWifiContent({ ssid = '', password = '', encryption = 'WPA', hidden = false } = {}) {
    const enc = encryption === 'none' ? 'nopass' : encryption;
    const pass = enc === 'nopass' ? '' : `P:${escapeWifi(password)};`;
    return `WIFI:T:${enc};S:${escapeWifi(ssid)};${pass}H:${hidden};;`;
}

/**
 * vCard 3.0 contact payload
 */
export function buildVCardContent({
    firstName = '',
    lastName = '',
    org = '',
    phone = '',
    email = '',
    url = '',
    address = '',
} = {}) {
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${lastName};${firstName};;;`,
        `FN:${[firstName, lastName].filter(Boolean).join(' ')}`,
    ];
    if (org) lines.push(`ORG:${org}`);
    if (phone) lines.push(`TEL:${phone}`);
    if (email) lines.push(`EMAIL:${email}`);
    if (url) lines.push(`URL:${url}`);
    if (address) lines.push(`ADR:;;${address};;;;`);
    lines.push('END:VCARD');
    return lines.join('\n');
}

/** mailto: URI */
export function buildEmailContent({ to = '', subject = '', body = '' } = {}) {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    const qs = params.toString();
    return `mailto:${to}${qs ? `?${qs}` : ''}`;
}

/** tel: URI */
export function buildPhoneContent(phone = '') {
    return `tel:${phone.trim()}`;
}

/** sms: URI */
export function buildSmsContent({ phone = '', message = '' } = {}) {
    return `sms:${phone.trim()}${message ? `?body=${encodeURIComponent(message)}` : ''}`;
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

const EC_LEVELS = { L: 'L', M: 'M', Q: 'Q', H: 'H' };

/**
 * Render QR code content onto an existing <canvas> element.
 * @param {HTMLCanvasElement} canvas
 * @param {string} content
 * @param {{ fgColor, bgColor, size, ecLevel, margin }} options
 */
export async function renderToCanvas(canvas, content, options = {}) {
    const {
        fgColor = '#ffffff',
        bgColor = '#0f172a',
        size = 300,
        ecLevel = 'M',
        margin = 2,
    } = options;

    if (!content) {
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
        return;
    }

    await QRCode.toCanvas(canvas, content, {
        width: size,
        margin,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: EC_LEVELS[ecLevel] ?? 'M',
    });
}

/**
 * Generate a PNG data URL from QR content.
 * @returns {Promise<string>}
 */
export async function toPngDataUrl(content, options = {}) {
    const {
        fgColor = '#ffffff',
        bgColor = '#0f172a',
        size = 1024,
        ecLevel = 'M',
        margin = 2,
    } = options;

    return QRCode.toDataURL(content, {
        type: 'image/png',
        width: size,
        margin,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: EC_LEVELS[ecLevel] ?? 'M',
    });
}

/**
 * Generate an SVG string from QR content.
 * @returns {Promise<string>}
 */
export async function toSvgString(content, options = {}) {
    const {
        fgColor = '#ffffff',
        bgColor = '#0f172a',
        size = 512,
        ecLevel = 'M',
        margin = 2,
    } = options;

    return QRCode.toString(content, {
        type: 'svg',
        width: size,
        margin,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: EC_LEVELS[ecLevel] ?? 'M',
    });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeWifi(str) {
    return str.replace(/[\\;",:]/g, (c) => `\\${c}`);
}

export const ERROR_CORRECTION_LEVELS = [
    { value: 'L', label: 'L — Low (7%)', desc: 'Smallest, least robust' },
    { value: 'M', label: 'M — Medium (15%)', desc: 'Good balance (default)' },
    { value: 'Q', label: 'Q — Quartile (25%)', desc: 'Higher redundancy' },
    { value: 'H', label: 'H — High (30%)', desc: 'Best for damaged codes' },
];
