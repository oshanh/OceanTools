import { useState, useEffect } from 'react';
import { Clock, Copy, Check, ArrowDownUp } from 'lucide-react';

export default function TimestampConverter() {
    const [timestamp, setTimestamp] = useState(() => Math.floor(Date.now() / 1000).toString());
    const [dateString, setDateString] = useState('');
    const [localDateStr, setLocalDateStr] = useState('');
    const [utcDateStr, setUtcDateStr] = useState('');
    const [copiedSec, setCopiedSec] = useState(false);
    const [copiedMs, setCopiedMs] = useState(false);

    const [currentUnix, setCurrentUnix] = useState(Math.floor(Date.now() / 1000));

    useEffect(() => {
        const interval = setInterval(() => setCurrentUnix(Math.floor(Date.now() / 1000)), 1000);
        return () => clearInterval(interval);
    }, []);

    // 2-way binding: Timestamp -> Date
    useEffect(() => {
        if (!timestamp) {
            setLocalDateStr('');
            setUtcDateStr('');
            return;
        }

        let num = parseInt(timestamp, 10);
        if (isNaN(num)) return;

        // Auto-detect seconds vs ms (if it's very large, usually ms)
        // Timestamp 10000000000 is year 2286 in seconds, but 1970 in ms.
        // Rule of thumb: if it's > 100000000000, it's ms.
        if (timestamp.length > 11) {
            // it's MS
        } else {
            num *= 1000;
        }

        try {
            const date = new Date(num);
            if (date.toString() !== 'Invalid Date') {
                setLocalDateStr(date.toLocaleString());
                setUtcDateStr(date.toUTCString());

                // Set the HTML date-time input format: YYYY-MM-DDThh:mm... (Local time)
                const offset = date.getTimezoneOffset();
                const local = new Date(date.getTime() - (offset * 60 * 1000));
                setDateString(local.toISOString().slice(0, 16));
            } else {
                setLocalDateStr('Invalid Timestamp Element');
                setUtcDateStr('Invalid Timestamp Element');
            }
        } catch { }

    }, [timestamp]);

    // HTML Date String -> Timestamp
    const handleDateChange = (e) => {
        const val = e.target.value;
        setDateString(val);
        if (val) {
            const d = new Date(val);
            setTimestamp(Math.floor(d.getTime() / 1000).toString());
        }
    };

    const handleCopy = async (val, type) => {
        try {
            await navigator.clipboard.writeText(val);
            if (type === 'sec') {
                setCopiedSec(true);
                setTimeout(() => setCopiedSec(false), 2000);
            } else {
                setCopiedMs(true);
                setTimeout(() => setCopiedMs(false), 2000);
            }
        } catch { }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">

            <div className="glass-panel p-6 border border-neon-cyan/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-glow-cyan bg-neon-cyan/5">
                <div className="flex items-center gap-4 text-slate-300">
                    <Clock size={32} className="text-neon-cyan opacity-80" />
                    <div>
                        <div className="text-xs uppercase tracking-widest font-bold text-slate-400">Live Epoch Timestamp</div>
                        <div className="text-2xl font-mono text-white tracking-widest">{currentUnix}</div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => handleCopy(currentUnix.toString(), 'sec')} className="px-4 py-2 bg-ocean-950 hover:bg-ocean-900 border border-white/10 rounded-lg text-sm font-bold text-slate-300 transition-colors flex items-center gap-2">
                        {copiedSec ? <Check size={16} className="text-neon-emerald" /> : <Copy size={16} />}
                        Secs
                    </button>
                    <button onClick={() => handleCopy((currentUnix * 1000).toString(), 'ms')} className="px-4 py-2 bg-ocean-950 hover:bg-ocean-900 border border-white/10 rounded-lg text-sm font-bold text-slate-300 transition-colors flex items-center gap-2">
                        {copiedMs ? <Check size={16} className="text-neon-emerald" /> : <Copy size={16} />}
                        Millis
                    </button>
                </div>
            </div>

            <div className="glass-panel p-6 shadow-lg border border-white/5 relative flex flex-col items-center">

                {/* Number Input */}
                <div className="w-full max-w-xl flex flex-col space-y-2 relative z-10">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unix Timestamp</label>
                    <input
                        type="text"
                        value={timestamp}
                        onChange={(e) => setTimestamp(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-ocean-950 border border-white/10 rounded-xl px-5 py-4 text-2xl font-mono text-white tracking-widest text-center focus:outline-none focus:border-neon-cyan/50 shadow-inner"
                        placeholder="1670000000"
                    />
                </div>

                <div className="py-6 text-slate-600 relative z-10">
                    <ArrowDownUp size={24} />
                </div>

                {/* Date Input */}
                <div className="w-full max-w-xl flex flex-col space-y-2 relative z-10">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Human Readable Date (Local)</label>
                    <input
                        type="datetime-local"
                        value={dateString}
                        onChange={handleDateChange}
                        className="w-full bg-ocean-950 border border-white/10 rounded-xl px-5 py-4 text-xl font-mono text-neon-cyan text-center focus:outline-none focus:border-neon-cyan/50 shadow-inner [color-scheme:dark]"
                    />
                </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-6 border border-white/5 text-center flex flex-col items-center gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Relative Local Time Zone</div>
                    <div className="text-sm font-mono text-slate-200">
                        {localDateStr || '---'}
                    </div>
                </div>
                <div className="glass-panel p-6 border border-white/5 text-center flex flex-col items-center gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400">Strict UTC Data Format</div>
                    <div className="text-sm font-mono text-slate-200">
                        {utcDateStr || '---'}
                    </div>
                </div>
            </div>

        </div>
    );
}
