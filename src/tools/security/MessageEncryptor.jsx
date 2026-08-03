import { useState } from 'react';
import CryptoJS from 'crypto-js';
import { Lock, Unlock, Copy, Check, Eye, EyeOff, ShieldAlert, FileKey2 } from 'lucide-react';

export default function MessageEncryptor() {
    const [mode, setMode] = useState('encrypt'); // 'encrypt' | 'decrypt'
    const [text, setText] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleProcess = () => {
        setError('');
        setResult('');
        if (!text) {
            setError('Please enter some text to process.');
            return;
        }
        if (!password) {
            setError('A password is critically required.');
            return;
        }

        try {
            if (mode === 'encrypt') {
                const ciphertext = CryptoJS.AES.encrypt(text, password).toString();
                setResult(ciphertext);
            } else {
                const bytes = CryptoJS.AES.decrypt(text, password);
                const originalText = bytes.toString(CryptoJS.enc.Utf8);
                if (!originalText) {
                    setError('Decryption failed. Incorrect password or corrupted ciphertext.');
                } else {
                    setResult(originalText);
                }
            }
        } catch (err) {
            setError('An error occurred during cryptographic processing.');
        }
    };

    const handleCopy = async () => {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { }
    };

    const swapMode = (newMode) => {
        setMode(newMode);
        setText('');
        setResult('');
        setError('');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Mode Switcher */}
            <div className="flex items-center justify-center p-1 bg-ocean-900 border border-white/5 rounded-xl max-w-sm mx-auto">
                <button
                    onClick={() => swapMode('encrypt')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${mode === 'encrypt' ? 'bg-neon-cyan/20 text-neon-cyan shadow-glow-cyan' : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <Lock size={16} /> Encrypt
                </button>
                <button
                    onClick={() => swapMode('decrypt')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${mode === 'decrypt' ? 'bg-fuchsia-500/20 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <Unlock size={16} /> Decrypt
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Input Panel */}
                <div className="glass-panel p-6 border border-white/10 flex flex-col gap-4 relative shadow-lg">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider mb-2">
                        {mode === 'encrypt' ? <Lock size={16} className="text-neon-cyan" /> : <Unlock size={16} className="text-fuchsia-400" />}
                        <span className={mode === 'encrypt' ? 'text-neon-cyan' : 'text-fuchsia-400'}>
                            {mode === 'encrypt' ? 'Plaintext Message' : 'Encrypted Ciphertext'}
                        </span>
                    </div>

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={mode === 'encrypt' ? "Type your secret message here..." : "U2FsdGVkX1+..."}
                        className="w-full min-h-[200px] p-4 rounded-xl bg-ocean-950/50 border border-white/5 
                                   text-slate-200 placeholder:text-slate-600 focus:outline-none 
                                   focus:border-white/20 transition-all resize-none text-sm font-mono"
                        spellCheck={false}
                    />

                    <div className="space-y-2 mt-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Encryption Password</label>
                        <div className="relative flex items-center">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Extremely strong password"
                                className="w-full bg-ocean-950 border border-white/10 rounded-lg pl-4 pr-12 py-3 text-white focus:outline-none focus:border-white/30 font-mono text-sm"
                            />
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 p-1.5 text-slate-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleProcess}
                        className={`w-full py-4 mt-2 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${mode === 'encrypt'
                                ? 'bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 shadow-glow-cyan'
                                : 'bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.3)]'
                            }`}
                    >
                        {mode === 'encrypt' ? <Lock size={18} /> : <Unlock size={18} />}
                        {mode === 'encrypt' ? 'ENCRYPT MESSAGE' : 'DECRYPT MESSAGE'}
                    </button>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg mt-2">
                            <ShieldAlert size={16} /> {error}
                        </div>
                    )}
                </div>

                {/* Output Panel */}
                <div className="glass-panel p-6 border border-white/10 flex flex-col gap-4 relative">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
                            <FileKey2 size={16} className="text-slate-400" />
                            Process Output
                        </div>
                        <button
                            onClick={handleCopy}
                            disabled={!result}
                            className="px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all disabled:opacity-50"
                        >
                            {copied ? <Check size={14} className="text-neon-emerald" /> : <Copy size={14} />}
                            Copy
                        </button>
                    </div>

                    <div className="w-full flex-1 min-h-[300px] p-5 rounded-xl bg-ocean-950/70 border border-white/5 text-slate-300 font-mono text-sm leading-relaxed overflow-y-auto break-all custom-scrollbar select-all">
                        {result || <span className="text-slate-600 italic">Waiting for processing...</span>}
                    </div>
                </div>

            </div>
        </div>
    );
}
