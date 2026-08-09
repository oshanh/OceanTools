import { useState } from 'react';
import { Calculator, Copy, Check } from 'lucide-react';

export default function NumberBaseConverter() {
    const [bases, setBases] = useState({
        dec: '',
        hex: '',
        bin: '',
        oct: ''
    });
    const [copiedBase, setCopiedBase] = useState(null);

    const handleCopy = async (val, base) => {
        if (!val) return;
        try {
            await navigator.clipboard.writeText(val);
            setCopiedBase(base);
            setTimeout(() => setCopiedBase(null), 2000);
        } catch { }
    };

    const updateFromDec = (decimalStr) => {
        if (!decimalStr || isNaN(decimalStr)) {
            setBases({ dec: decimalStr, hex: '', bin: '', oct: '' });
            return;
        }

        try {
            // Using BigInt to support extremely large standard blocks
            const big = BigInt(decimalStr);
            setBases({
                dec: decimalStr,
                hex: big.toString(16).toUpperCase(),
                bin: big.toString(2),
                oct: big.toString(8)
            });
        } catch {
            setBases({ dec: decimalStr, hex: 'ERR', bin: 'ERR', oct: 'ERR' });
        }
    };

    const handleInput = (val, baseSource) => {
        // Strip out any non-conforming characters gently
        let cleaned = val;

        try {
            if (val === '') {
                setBases({ dec: '', hex: '', bin: '', oct: '' });
                return;
            }

            let decimalVal;
            if (baseSource === 'dec') {
                cleaned = val.replace(/[^0-9-]/g, '');
                updateFromDec(cleaned);
                return;
            } else if (baseSource === 'hex') {
                cleaned = val.replace(/[^0-9a-fA-F-]/g, '');
                if (!cleaned) return setBases(prev => ({ ...prev, hex: '' }));
                decimalVal = BigInt('0x' + (cleaned.startsWith('-') ? cleaned.substring(1) : cleaned)) * (cleaned.startsWith('-') ? -1n : 1n);
            } else if (baseSource === 'bin') {
                cleaned = val.replace(/[^01-]/g, '');
                if (!cleaned) return setBases(prev => ({ ...prev, bin: '' }));
                // JS doesn't natively parse binary BigInt from string easily unless using 0b prefix
                decimalVal = BigInt('0b' + (cleaned.startsWith('-') ? cleaned.substring(1) : cleaned)) * (cleaned.startsWith('-') ? -1n : 1n);
            } else if (baseSource === 'oct') {
                cleaned = val.replace(/[^0-7-]/g, '');
                if (!cleaned) return setBases(prev => ({ ...prev, oct: '' }));
                decimalVal = BigInt('0o' + (cleaned.startsWith('-') ? cleaned.substring(1) : cleaned)) * (cleaned.startsWith('-') ? -1n : 1n);
            }

            updateFromDec(decimalVal.toString());

        } catch {
            // Unparseable (e.g. just a minus sign)
            setBases(prev => ({ ...prev, [baseSource]: cleaned, dec: 'ERR' }));
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-4">

            <div className="glass-panel p-5 border border-white/5 flex items-center justify-between mb-4 bg-ocean-900/40">
                <div className="flex items-center gap-3">
                    <Calculator size={24} className="text-neon-emerald" />
                    <div>
                        <h2 className="font-bold text-slate-100">Number Base Converter</h2>
                        <p className="text-slate-400 text-xs">Bi-directional realtime updates. Supports BigInt architecture.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <BaseBlock
                    label="Decimal (Base 10)"
                    value={bases.dec}
                    sym="DEC"
                    onChange={(e) => handleInput(e.target.value, 'dec')}
                    onCopy={() => handleCopy(bases.dec, 'dec')}
                    copied={copiedBase === 'dec'}
                    borderColor="border-neon-emerald/30 group-focus-within:border-neon-emerald"
                    textColor="text-neon-emerald"
                />

                <BaseBlock
                    label="Hexadecimal (Base 16)"
                    value={bases.hex}
                    sym="HEX"
                    onChange={(e) => handleInput(e.target.value, 'hex')}
                    onCopy={() => handleCopy(bases.hex, 'hex')}
                    copied={copiedBase === 'hex'}
                    borderColor="border-purple-500/30 group-focus-within:border-purple-500"
                    textColor="text-purple-400"
                />

                <BaseBlock
                    label="Binary (Base 2)"
                    value={bases.bin}
                    sym="BIN"
                    onChange={(e) => handleInput(e.target.value, 'bin')}
                    onCopy={() => handleCopy(bases.bin, 'bin')}
                    copied={copiedBase === 'bin'}
                    borderColor="border-neon-cyan/30 group-focus-within:border-neon-cyan"
                    textColor="text-neon-cyan"
                />

                <BaseBlock
                    label="Octal (Base 8)"
                    value={bases.oct}
                    sym="OCT"
                    onChange={(e) => handleInput(e.target.value, 'oct')}
                    onCopy={() => handleCopy(bases.oct, 'oct')}
                    copied={copiedBase === 'oct'}
                    borderColor="border-amber-500/30 group-focus-within:border-amber-500"
                    textColor="text-amber-400"
                />

            </div>
        </div>
    );
}

function BaseBlock({ label, value, sym, onChange, onCopy, copied, borderColor, textColor }) {
    return (
        <div className={`glass-panel p-1 rounded-2xl border transition-colors group relative ${borderColor}`}>
            <div className="absolute -top-3 left-6 px-2 bg-ocean-950 font-bold uppercase tracking-widest text-[10px] text-slate-400">
                {label}
            </div>

            <div className="flex bg-ocean-950 rounded-xl overflow-hidden min-h-[140px]">
                <textarea
                    value={value}
                    onChange={onChange}
                    className="flex-1 w-full bg-transparent p-5 text-lg font-mono text-slate-200 focus:outline-none resize-none break-all custom-scrollbar leading-relaxed"
                    placeholder="Enter value..."
                    spellCheck={false}
                />

                <div className="w-14 shrink-0 bg-ocean-900/50 border-l border-white/5 flex flex-col items-center justify-between py-4">
                    <span className={`font-bold font-mono text-[10px] uppercase tracking-widest -rotate-90 mt-4 opacity-50 ${textColor}`}>
                        {sym}
                    </span>
                    <button
                        onClick={onCopy}
                        className="p-2 bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors"
                    >
                        {copied ? <Check size={16} className="text-neon-emerald" /> : <Copy size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
