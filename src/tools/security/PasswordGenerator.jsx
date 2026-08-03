import { useState, useEffect, useCallback } from 'react';
import { KeyRound, Copy, Check, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export default function PasswordGenerator() {
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);

    const [useUpper, setUseUpper] = useState(true);
    const [useLower, setUseLower] = useState(true);
    const [useNumbers, setUseNumbers] = useState(true);
    const [useSymbols, setUseSymbols] = useState(true);

    const [copied, setCopied] = useState(false);

    const generate = useCallback(() => {
        let charset = '';
        if (useUpper) charset += UPPER;
        if (useLower) charset += LOWER;
        if (useNumbers) charset += NUMBERS;
        if (useSymbols) charset += SYMBOLS;

        if (!charset) {
            setPassword('');
            return;
        }

        // Use cryptographically secure randomness
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);

        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset[array[i] % charset.length];
        }

        setPassword(result);
    }, [length, useUpper, useLower, useNumbers, useSymbols]);

    // Auto-generate on load and config change
    useEffect(() => {
        generate();
    }, [generate]);

    const handleCopy = async () => {
        if (!password) return;
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    const getEntropy = () => {
        if (!password) return 0;
        let pool = 0;
        if (useUpper) pool += 26;
        if (useLower) pool += 26;
        if (useNumbers) pool += 10;
        if (useSymbols) pool += SYMBOLS.length;
        return length * Math.log2(pool || 1);
    };

    const entropy = getEntropy();
    let strength = 'Weak';
    let strengthColor = 'text-red-400';
    let pBar = 'bg-red-500 w-1/4';

    if (entropy > 50) { strength = 'Fair'; strengthColor = 'text-amber-400'; pBar = 'bg-amber-400 w-2/4'; }
    if (entropy > 75) { strength = 'Good'; strengthColor = 'text-neon-cyan'; pBar = 'bg-neon-cyan w-3/4'; }
    if (entropy > 100) { strength = 'Excellent'; strengthColor = 'text-neon-emerald'; pBar = 'bg-neon-emerald w-full'; }

    return (
        <div className="max-w-3xl mx-auto space-y-6">

            {/* Password Display Panel */}
            <div className="glass-panel p-6 border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 to-neon-emerald/5 opacity-50 blur-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
                    <input
                        type="text"
                        readOnly
                        value={password}
                        placeholder="Select options below to generate..."
                        className="flex-1 w-full bg-ocean-950/50 border border-white/10 rounded-xl px-5 py-4 text-2xl font-mono text-white tracking-widest outline-none text-center sm:text-left"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleCopy}
                            disabled={!password}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 transition-all font-bold disabled:opacity-50"
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                        <button
                            onClick={generate}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:text-neon-emerald hover:border-neon-emerald/30 transition-all transform hover:rotate-180"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>

                {/* Strength Meter */}
                <div className="mt-6 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="text-slate-400">Password Strength</span>
                        <div className={`flex items-center gap-1 ${strengthColor}`}>
                            {entropy > 100 ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                            {strength} ({Math.round(entropy)} bits)
                        </div>
                    </div>
                    <div className="h-2 w-full bg-ocean-950 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 rounded-full ${pBar}`} />
                    </div>
                </div>
            </div>

            {/* Config Panel */}
            <div className="glass-panel p-6 border border-white/10 flex flex-col gap-8">

                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <KeyRound size={16} className="text-neon-cyan" />
                        Length: <span className="text-white text-lg">{length}</span>
                    </h2>
                    <input
                        type="range"
                        min="4" max="128"
                        value={length}
                        onChange={(e) => setLength(parseInt(e.target.value, 10))}
                        className="flex-1 w-full max-w-sm accent-neon-cyan h-2 bg-ocean-900 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ToggleOption label="Uppercase (A-Z)" checked={useUpper} onChange={setUseUpper} />
                    <ToggleOption label="Lowercase (a-z)" checked={useLower} onChange={setUseLower} />
                    <ToggleOption label="Numbers (0-9)" checked={useNumbers} onChange={setUseNumbers} />
                    <ToggleOption label="Symbols (!@#$)" checked={useSymbols} onChange={setUseSymbols} />
                </div>

                {(!useUpper && !useLower && !useNumbers && !useSymbols) && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-2 text-sm text-red-400">
                        <AlertTriangle size={16} />
                        You must select at least one character set.
                    </div>
                )}
            </div>

        </div>
    );
}

function ToggleOption({ label, checked, onChange }) {
    return (
        <label className="flex items-center justify-between p-4 bg-ocean-900/50 border border-white/5 rounded-xl cursor-pointer hover:bg-ocean-900 transition-colors">
            <span className="text-slate-300 font-semibold">{label}</span>
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-11 h-6 bg-ocean-950 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan peer-checked:after:bg-white" />
            </div>
        </label>
    );
}
