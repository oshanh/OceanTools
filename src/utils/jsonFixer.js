/**
 * Best-effort JSON auto-fixer.
 *
 * Applies a sequence of lightweight transformations to turn common
 * "almost-valid" JSON into valid JSON.  Each fix is described so the UI can
 * display exactly what changed.
 */

/**
 * @typedef {{ id: string; label: string; description: string }} FixRule
 * @typedef {{ rule: FixRule; count: number }} AppliedFix
 * @typedef {{ fixed: string; fixes: AppliedFix[]; success: boolean; error?: string }} FixResult
 */

// ---------------------------------------------------------------------------
// Fix rule definitions (order matters — some rules depend on earlier ones)
// ---------------------------------------------------------------------------
const RULES = [
    {
        id: 'single_quotes',
        label: 'Single → double quotes',
        description: 'Replaced single-quoted strings with double-quoted strings.',
        apply(src) {
            // Replace 'value' → "value", skipping escaped single quotes inside them.
            // Strategy: tokenise strings delimited by ' and swap outer delimiter.
            let out = '';
            let i = 0;
            let count = 0;
            while (i < src.length) {
                if (src[i] === '"') {
                    // Already double-quoted: copy verbatim until closing "
                    out += src[i++];
                    while (i < src.length && src[i] !== '"') {
                        if (src[i] === '\\') out += src[i++]; // skip escape
                        out += src[i++];
                    }
                    out += src[i++]; // closing "
                } else if (src[i] === "'") {
                    // Single-quoted string → convert to double-quoted
                    count++;
                    out += '"';
                    i++;
                    while (i < src.length && src[i] !== "'") {
                        if (src[i] === '\\' && src[i + 1] === "'") {
                            // Escaped single quote → remove backslash (not needed in double-quoted)
                            out += "'";
                            i += 2;
                        } else if (src[i] === '"') {
                            // Bare double quote inside → escape it
                            out += '\\"';
                            i++;
                        } else {
                            if (src[i] === '\\') out += src[i++];
                            out += src[i++];
                        }
                    }
                    out += '"';
                    i++; // skip closing '
                } else {
                    out += src[i++];
                }
            }
            return { result: out, count };
        },
    },
    {
        id: 'unquoted_keys',
        label: 'Unquoted keys',
        description: 'Added double quotes around unquoted object keys.',
        apply(src) {
            // Match key patterns like:  {  key:  or  ,  key:
            // Only outside of string literals.
            let count = 0;
            const result = applyOutsideStrings(src, /([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*:)/g, (m, pre, key, colon) => {
                // Don't double-quote already-quoted keys (the regex won't match them anyway)
                count++;
                return `${pre}"${key}"${colon}`;
            });
            return { result, count };
        },
    },
    {
        id: 'trailing_commas',
        label: 'Trailing commas',
        description: 'Removed trailing commas before closing } or ].',
        apply(src) {
            let count = 0;
            const result = src.replace(/,(\s*[}\]])/g, (_, close) => {
                count++;
                return close;
            });
            return { result, count };
        },
    },
    {
        id: 'python_booleans',
        label: 'Python booleans / None',
        description: 'Converted True → true, False → false, None → null.',
        apply(src) {
            let count = 0;
            const result = applyOutsideStrings(src, /\b(True|False|None)\b/g, (m) => {
                count++;
                return m === 'True' ? 'true' : m === 'False' ? 'false' : 'null';
            });
            return { result, count };
        },
    },
    {
        id: 'comments',
        label: 'Comments',
        description: 'Stripped // line comments and /* block comments */.',
        apply(src) {
            let count = 0;
            // Remove block comments
            let result = src.replace(/\/\*[\s\S]*?\*\//g, () => { count++; return ''; });
            // Remove line comments (but not inside strings)
            result = applyOutsideStrings(result, /\/\/[^\n]*/g, () => { count++; return ''; });
            return { result, count };
        },
    },
    {
        id: 'missing_quotes_values',
        label: 'Unquoted string values',
        description: 'Quoted bare word values that are not JSON keywords.',
        apply(src) {
            // Match:  : word   where word is not true/false/null and not a number
            let count = 0;
            const result = applyOutsideStrings(
                src,
                /:\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*([,}\]\n])/g,
                (m, word, after) => {
                    if (['true', 'false', 'null'].includes(word)) return m;
                    count++;
                    return `: "${word}"${after}`;
                },
            );
            return { result, count };
        },
    },
];

// ---------------------------------------------------------------------------
// Helper: apply a regex replacement only outside string literals
// ---------------------------------------------------------------------------
function applyOutsideStrings(src, regex, replacer) {
    // Build an array of string ranges to skip
    const stringRanges = [];
    let i = 0;
    while (i < src.length) {
        if (src[i] === '"') {
            const start = i++;
            while (i < src.length && src[i] !== '"') {
                if (src[i] === '\\') i++; // skip escape
                i++;
            }
            stringRanges.push([start, i]);
            i++;
        } else {
            i++;
        }
    }

    const isInsideString = (index) =>
        stringRanges.some(([s, e]) => index > s && index <= e);

    return src.replace(regex, (match, ...args) => {
        const offset = args[args.length - 2]; // second-to-last arg is always index
        if (isInsideString(offset)) return match;
        return replacer(match, ...args.slice(0, -2));
    });
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Try to auto-fix common JSON errors.
 * @param {string} input  Raw user input
 * @returns {FixResult}
 */
export function fixJson(input) {
    /** @type {AppliedFix[]} */
    const fixes = [];
    let current = input;

    for (const rule of RULES) {
        const { result, count } = rule.apply(current);
        if (count > 0) fixes.push({ rule, count });
        current = result;
    }

    // Verify the result actually parses
    try {
        JSON.parse(current.trim());
        return { fixed: current, fixes, success: true };
    } catch (err) {
        // Still failed — return the partially-fixed text with the error
        return {
            fixed: current,
            fixes,
            success: false,
            error: err.message || 'Could not fully repair the JSON.',
        };
    }
}
