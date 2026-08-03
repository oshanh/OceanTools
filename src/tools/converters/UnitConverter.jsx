import { useState, useCallback, useEffect } from 'react';
import { ArrowLeftRight, Ruler, Copy, Check } from 'lucide-react';

// ---------------------------------------------------------------------------
// Conversion Database
// ---------------------------------------------------------------------------
const UNITS = {
    Length: {
        items: {
            'Kilometer': { factor: 1000, alias: 'km' },
            'Meter': { factor: 1, alias: 'm' },
            'Centimeter': { factor: 0.01, alias: 'cm' },
            'Millimeter': { factor: 0.001, alias: 'mm' },
            'Micrometer': { factor: 0.000001, alias: 'µm' },
            'Nanometer': { factor: 0.000000001, alias: 'nm' },
            'Mile': { factor: 1609.344, alias: 'mi' },
            'Yard': { factor: 0.9144, alias: 'yd' },
            'Foot': { factor: 0.3048, alias: 'ft' },
            'Inch': { factor: 0.0254, alias: 'in' },
            'Nautical Mile': { factor: 1852, alias: 'nmi' },
        }
    },
    Weight: {
        items: {
            'Metric Ton': { factor: 1000000, alias: 't' },
            'Kilogram': { factor: 1000, alias: 'kg' },
            'Gram': { factor: 1, alias: 'g' },
            'Milligram': { factor: 0.001, alias: 'mg' },
            'Microgram': { factor: 0.000001, alias: 'µg' },
            'Imperial Ton': { factor: 1016046.9088, alias: 'tn' },
            'US Ton': { factor: 907184.74, alias: 'ton' },
            'Pound': { factor: 453.59237, alias: 'lb' },
            'Ounce': { factor: 28.349523, alias: 'oz' },
        }
    },
    Volume: {
        items: {
            'Cubic Meter': { factor: 1000, alias: 'm³' },
            'Liter': { factor: 1, alias: 'L' },
            'Milliliter': { factor: 0.001, alias: 'mL' },
            'US Gallon': { factor: 3.785411784, alias: 'gal' },
            'US Quart': { factor: 0.946352946, alias: 'qt' },
            'US Pint': { factor: 0.473176473, alias: 'pt' },
            'US Cup': { factor: 0.24, alias: 'cup' },
            'US Fluid Ounce': { factor: 0.0295735296, alias: 'fl oz' },
        }
    },
    Temperature: {
        items: {
            'Celsius': { toBase: (v) => v, fromBase: (v) => v, alias: '°C' },
            'Fahrenheit': { toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => (v * 9 / 5) + 32, alias: '°F' },
            'Kelvin': { toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15, alias: 'K' },
        }
    },
    Data: {
        items: {
            'Petabyte': { factor: 1125899906842624, alias: 'PB' },
            'Terabyte': { factor: 1099511627776, alias: 'TB' },
            'Gigabyte': { factor: 1073741824, alias: 'GB' },
            'Megabyte': { factor: 1048576, alias: 'MB' },
            'Kilobyte': { factor: 1024, alias: 'KB' },
            'Byte': { factor: 1, alias: 'B' },
            'Bit': { factor: 0.125, alias: 'b' },
        }
    }
};

const CATEGORIES = Object.keys(UNITS);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function UnitConverter() {
    const [category, setCategory] = useState(CATEGORIES[0]);

    // Need to safely fetch keys based on category
    const activeItems = Object.keys(UNITS[category].items);

    const [unitA, setUnitA] = useState(activeItems[1]); // e.g. Meter
    const [unitB, setUnitB] = useState(activeItems[8] || activeItems[1]); // e.g. Foot

    const [valA, setValA] = useState('1');
    const [valB, setValB] = useState('');

    const [copied, setCopied] = useState(false);

    // ---------------------------------------------------------------------------
    // Conversion Core
    // ---------------------------------------------------------------------------
    const doConversion = useCallback((valStr, fromName, toName, currentCategory) => {
        if (valStr === '' || valStr === '-' || isNaN(valStr)) return '';

        const v = parseFloat(valStr);
        const cat = UNITS[currentCategory];
        const itemFrom = cat.items[fromName];
        const itemTo = cat.items[toName];

        if (!itemFrom || !itemTo) return '';

        let baseVal = 0;
        let finalVal = 0;

        // Linear conversion (length, weight, etc)
        if (itemFrom.factor) {
            baseVal = v * itemFrom.factor;
            finalVal = baseVal / itemTo.factor;
        }
        // Formula conversion (Temperature)
        else if (itemFrom.toBase) {
            baseVal = itemFrom.toBase(v);
            finalVal = itemTo.fromBase(baseVal);
        }

        // Format final value closely (prevent JS floating point junk like 0.3000000000004)
        if (Number.isInteger(finalVal)) return finalVal.toString();

        // Convert to long precision string, then strip trailing zeros via regex
        let out = finalVal.toPrecision(10);
        // Basic JS `Number(finalVal).toString()` is often perfect for stripping
        return Number(out).toString();
    }, []);

    const handleCategoryChange = (cat) => {
        setCategory(cat);
        const items = Object.keys(UNITS[cat].items);
        let ua = items[1] || items[0];
        let ub = items[8] || items[Math.min(2, items.length - 1)];

        setUnitA(ua);
        setUnitB(ub);

        setValB(doConversion(valA, ua, ub, cat));
    };

    // Handlers for Input changes
    const handleAChange = (e) => {
        const raw = e.target.value;
        setValA(raw);
        setValB(doConversion(raw, unitA, unitB, category));
    };

    const handleBChange = (e) => {
        const raw = e.target.value;
        setValB(raw);
        setValA(doConversion(raw, unitB, unitA, category));
    };

    // Handlers for Unit swaps/changes
    const handleSwap = () => {
        const oldA = unitA;
        setUnitA(unitB);
        setUnitB(oldA);
        // By convention, we keep the Left value fixed and recalculate the right
        setValB(doConversion(valA, unitB, oldA, category));
    };

    const handleUnitAChange = (e) => {
        const newA = e.target.value;
        setUnitA(newA);
        setValB(doConversion(valA, newA, unitB, category));
    };

    const handleUnitBChange = (e) => {
        const newB = e.target.value;
        setUnitB(newB);
        setValB(doConversion(valA, unitA, newB, category));
    };

    const copyResult = async () => {
        const text = `${valA} ${UNITS[category].items[unitA].alias} = ${valB} ${UNITS[category].items[unitB].alias}`;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    const getHelperImperial = (valStr, unitName) => {
        if (valStr === '' || isNaN(valStr) || valStr === '-') return null;
        const v = parseFloat(valStr);
        if (v < 0) return null;

        if (unitName === 'Foot') {
            let major = Math.floor(v);
            let minor = Math.round((v - major) * 12);
            if (minor === 12) { major += 1; minor = 0; }
            if (major === 0 && minor === 0) return null;
            return `≈ ${major} ft ${minor} in`;
        }
        if (unitName === 'Pound') {
            let major = Math.floor(v);
            let minor = Math.round((v - major) * 16);
            if (minor === 16) { major += 1; minor = 0; }
            if (major === 0 && minor === 0) return null;
            return `≈ ${major} lb ${minor} oz`;
        }
        return null;
    };

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------
    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Category Pills */}
            <div className="glass-panel p-2 flex flex-wrap gap-2 justify-center border border-white/10">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === cat
                            ? 'bg-neon-cyan/20 text-neon-cyan shadow-glow-cyan border border-neon-cyan/50'
                            : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Main Converter Board */}
            <div className="glass-panel p-6 border border-white/10 relative overflow-hidden">

                <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan/5 to-neon-emerald/5 blur-3xl opacity-50 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 py-4">

                    {/* Box A */}
                    <div className="flex-1 w-full space-y-3">
                        <select
                            value={unitA}
                            onChange={handleUnitAChange}
                            className="w-full bg-ocean-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-neon-cyan/50 themed-select font-semibold"
                        >
                            {activeItems.map(item => (
                                <option value={item} key={item}>{item} ({UNITS[category].items[item].alias})</option>
                            ))}
                        </select>
                        <div className="relative">
                            <input
                                type="number"
                                value={valA}
                                onChange={handleAChange}
                                className="w-full bg-ocean-950/50 border border-white/5 rounded-lg px-4 py-4 text-2xl font-mono text-neon-cyan focus:outline-none focus:bg-ocean-900/60 transition-colors"
                            />
                            {getHelperImperial(valA, unitA) && (
                                <div className="absolute top-full mt-1 right-2 text-[11px] font-mono text-neon-cyan/70">
                                    {getHelperImperial(valA, unitA)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex items-center justify-center shrink-0">
                        <button
                            onClick={handleSwap}
                            className="p-3 md:p-4 rounded-full bg-ocean-900 border border-white/10 text-slate-400 hover:text-neon-emerald hover:border-neon-emerald/40 hover:shadow-glow-emerald transition-all transform hover:rotate-180"
                            title="Swap units"
                        >
                            <ArrowLeftRight size={20} />
                        </button>
                    </div>

                    {/* Box B */}
                    <div className="flex-1 w-full space-y-3">
                        <select
                            value={unitB}
                            onChange={handleUnitBChange}
                            className="w-full bg-ocean-900 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-neon-emerald/50 themed-select font-semibold"
                        >
                            {activeItems.map(item => (
                                <option value={item} key={item}>{item} ({UNITS[category].items[item].alias})</option>
                            ))}
                        </select>
                        <div className="relative">
                            <input
                                type="number"
                                value={valB}
                                onChange={handleBChange}
                                className="w-full bg-ocean-950/50 border border-white/5 rounded-lg px-4 py-4 text-2xl font-mono text-neon-emerald focus:outline-none focus:bg-ocean-900/60 transition-colors"
                            />
                            {getHelperImperial(valB, unitB) && (
                                <div className="absolute top-full mt-1 right-2 text-[11px] font-mono text-neon-emerald/70">
                                    {getHelperImperial(valB, unitB)}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Readout Footer */}
                <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-slate-400 font-mono tracking-wide">
                        <span className="text-white font-semibold">{valA || 0}</span> {UNITS[category].items[unitA].alias} = <span className="text-white font-semibold">{valB || 0}</span> {UNITS[category].items[unitB].alias}
                    </div>
                    <button
                        onClick={copyResult}
                        className="flex items-center gap-2 px-4 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all"
                    >
                        {copied ? <Check size={14} className="text-neon-emerald" /> : <Copy size={14} />}
                        {copied ? 'Copied formula' : 'Copy'}
                    </button>
                </div>

            </div>

        </div>
    );
}
