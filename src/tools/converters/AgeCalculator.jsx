import { useEffect, useRef, useState } from 'react';
import { CalendarClock, RotateCcw, Timer } from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a local datetime for an <input type="datetime-local"> */
function toLocalInputValue(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
}

/** Parse a datetime-local string → Date (local time) */
function fromInputValue(str) {
    return str ? new Date(str) : null;
}

/**
 * Calculate the exact difference between two Date objects.
 * Returns { years, months, days, hours, minutes, seconds, totalSeconds }.
 */
function calcDiff(fromDate, toDate) {
    if (toDate < fromDate) {
        const tmp = fromDate; 
        fromDate = toDate; 
        toDate = tmp;
    }

    let years = toDate.getFullYear() - fromDate.getFullYear();
    let months = toDate.getMonth() - fromDate.getMonth();
    let days = toDate.getDate() - fromDate.getDate();
    let hours = toDate.getHours() - fromDate.getHours();
    let minutes = toDate.getMinutes() - fromDate.getMinutes();
    let seconds = toDate.getSeconds() - fromDate.getSeconds();

    if (seconds < 0) { seconds += 60; minutes--; }
    if (minutes < 0) { minutes += 60; hours--; }
    if (hours < 0) { hours += 24; days--; }
    if (days < 0) {
        // Borrow days from the previous month
        const prevMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 0);
        days += prevMonth.getDate();
        months--;
    }
    if (months < 0) { months += 12; years--; }

    const totalSeconds = Math.floor((toDate - fromDate) / 1000);

    return { years, months, days, hours, minutes, seconds, totalSeconds };
}

// Ordinal suffix
function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UnitBox({ value, label, accent = false }) {
    return (
        <div className={`flex flex-col items-center justify-center rounded-2xl p-4
                     border transition-all duration-300
                     ${accent
                ? 'bg-neon-cyan/10 border-neon-cyan/30 shadow-glow-cyan'
                : 'bg-white/5 border-white/10'
            }`}
        >
            <span className={`text-3xl sm:text-4xl font-bold font-mono tabular-nums leading-none
                        ${accent ? 'text-neon-cyan' : 'text-slate-100'}`}>
                {String(value).padStart(2, '0')}
            </span>
            <span className="text-xs text-slate-500 mt-1.5 uppercase tracking-widest">{label}</span>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AgeCalculator() {
    // "From" date — user's birth date or any past date
    const [fromStr, setFromStr] = useState(localStorage.getItem('fromDate') ?localStorage.getItem('fromDate'): '2000-01-01T00:00:00');

    // "To" date — pre-filled with right now, but user can change it
    const nowRef = useRef(new Date());
    const [toStr, setToStr] = useState(() => toLocalInputValue(nowRef.current));

    // Whether "to" is locked to live current time
    const [liveTo, setLiveTo] = useState(true);

    // Computed diff (recalculated on every tick when liveTo is active)
    const [diff, setDiff] = useState(null);

    // Current wall-clock time for the live badge
    const [nowDisplay, setNowDisplay] = useState(new Date());

    // -------------------------------------------------------------------------
    // Tick every second when liveTo is active
    // -------------------------------------------------------------------------
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setNowDisplay(now);

            const from = fromInputValue(fromStr);
            if (!from || isNaN(from)) { setDiff(null); return; }

            if (liveTo) {
                setToStr(toLocalInputValue(now));
                setDiff(calcDiff(from, now));
            } else {
                const to = fromInputValue(toStr);
                if (!to || isNaN(to)) { setDiff(null); return; }
                setDiff(calcDiff(from, to));
            }
        };

        tick(); // run immediately
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromStr, toStr, liveTo]);

    // -------------------------------------------------------------------------
    const handleReset = () => {
        localStorage.setItem('fromDate','')
        setFromStr('2000-01-01T00:00:00');
        setToStr(toLocalInputValue(new Date()));
        setLiveTo(true);
    };

    // -------------------------------------------------------------------------
    const isFuture = diff && fromInputValue(fromStr) > fromInputValue(toStr);

    // Next birthday calc
    const nextBirthday = (() => {
        const from = fromInputValue(fromStr);
        if (!from || isNaN(from)) return null;
        const now = new Date();
        const next = new Date(now.getFullYear(), from.getMonth(), from.getDate());
        if (next < now) next.setFullYear(now.getFullYear() + 1);
        const diffDays = Math.ceil((next - now) / 86400000);
        return { date: next, daysAway: diffDays };
    })();

    //store birthday in local storage
    const storefd=(fromDate)=>{
        setFromStr(fromDate);
        localStorage.setItem('fromDate',fromDate);

    }

    // -------------------------------------------------------------------------
    return (
        <div className="space-y-6 max-w-3xl mx-auto">

            {/* ------------------------------------------------------------------ */}
            {/* Header badge — live clock                                           */}
            {/* ------------------------------------------------------------------ */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500
                        bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                    <Timer size={12} className="text-neon-cyan animate-pulse" />
                    <span className="text-neon-cyan">LIVE</span>
                    <span>{nowDisplay.toLocaleTimeString()}</span>
                </div>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500
                     hover:text-slate-300 transition-glow"
                >
                    <RotateCcw size={12} />
                    Reset
                </button>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Inputs                                                              */}
            {/* ------------------------------------------------------------------ */}
            <div className="glass-panel p-6 space-y-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <CalendarClock size={14} />
                    Date Range
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* From */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            From (birth date / start)
                        </label>
                        <input
                            type="datetime-local"
                            value={fromStr}
                            step="1"
                            onChange={(e) => storefd(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg
                         text-slate-200 text-sm focus:outline-none focus:border-neon-cyan/50
                         transition-glow [color-scheme:dark]"
                        />
                    </div>

                    {/* To */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-medium text-slate-400">
                                To (end date / now)
                            </label>
                            {/* Live / Back-to-now toggle */}
                            {liveTo ? (
                                <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border
                                                bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30">
                                    <Timer size={10} className="animate-pulse" />
                                    Live
                                </span>
                            ) : (
                                <button
                                    onClick={() => { setLiveTo(true); setToStr(toLocalInputValue(new Date())); }}
                                    className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border
                                               bg-white/5 text-slate-400 border-white/10
                                               hover:bg-neon-cyan/10 hover:text-neon-cyan hover:border-neon-cyan/30
                                               transition-glow"
                                >
                                    <RotateCcw size={10} />
                                    Back to now
                                </button>
                            )}
                        </div>
                        <input
                            type="datetime-local"
                            value={toStr}
                            step="1"
                            onChange={(e) => {
                                setLiveTo(false);
                                setToStr(e.target.value);
                            }}
                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg
                         text-slate-200 text-sm focus:outline-none focus:border-neon-cyan/50
                         transition-glow [color-scheme:dark]"
                        />
                        <p className="text-xs text-slate-600 mt-1.5">
                            {liveTo
                                ? 'Auto-updating every second — edit the field to fix a custom date.'
                                : 'Fixed date set. Click "Back to now" to resume live tracking.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Result                                                              */}
            {/* ------------------------------------------------------------------ */}
            {diff ? (
                <>
                    {/* Direction label */}
                    {isFuture && (
                        <div className="text-xs text-amber-400/80 bg-amber-400/10 border border-amber-400/20
                            rounded-lg px-3 py-2 flex items-center gap-2">
                            ⚠️ The "from" date is in the future — showing time remaining.
                        </div>
                    )}

                    {/* ---- Big unit boxes ---- */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        <UnitBox value={diff.years} label="Years" accent={diff.years > 0} />
                        <UnitBox value={diff.months} label="Months" />
                        <UnitBox value={diff.days} label="Days" />
                        <UnitBox value={diff.hours} label="Hours" />
                        <UnitBox value={diff.minutes} label="Min" />
                        <UnitBox value={diff.seconds} label="Sec" accent />
                    </div>

                    {/* ---- Total seconds ticker ---- */}
                    <div className="glass-panel p-5 flex items-center justify-between gap-4 flex-wrap
                          border border-neon-cyan/20">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total seconds elapsed</p>
                            <p className="text-2xl sm:text-3xl font-mono font-bold text-neon-cyan tabular-nums">
                                {diff.totalSeconds.toLocaleString()}
                            </p>
                        </div>
                        <Timer size={32} className="text-neon-cyan/20 shrink-0" />
                    </div>

                    {/* ---- Breakdown stats ---- */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                            {
                                label: 'Total minutes',
                                value: Math.floor(diff.totalSeconds / 60).toLocaleString(),
                            },
                            {
                                label: 'Total hours',
                                value: Math.floor(diff.totalSeconds / 3600).toLocaleString(),
                            },
                            {
                                label: 'Total days',
                                value: Math.floor(diff.totalSeconds / 86400).toLocaleString(),
                            },
                            {
                                label: 'Total weeks',
                                value: Math.floor(diff.totalSeconds / 604800).toLocaleString(),
                            },
                            {
                                label: 'Total months (approx.)',
                                value: (diff.years * 12 + diff.months).toLocaleString(),
                            },
                            {
                                label: 'Total years (decimal)',
                                value: (diff.totalSeconds / 31_557_600).toFixed(4),
                            },
                        ].map(({ label, value }) => (
                            <div key={label}
                                className="glass-panel p-4 space-y-1 border border-white/10 hover:border-neon-cyan/20 transition-glow">
                                <p className="text-xs text-slate-500">{label}</p>
                                <p className="text-lg font-mono font-semibold text-slate-200 tabular-nums">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* ---- Next birthday (only if "from" looks like a birthday) ---- */}
                    {!isFuture && nextBirthday && diff.years >= 0 && (
                        <div className="glass-panel p-5 border border-neon-emerald/20 bg-neon-emerald/5
                            flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                                    {nextBirthday.daysAway === 0 ? '🎂 Birthday today!' : 'Next birthday'}
                                </p>
                                <p className="text-slate-200 font-medium">
                                    {nextBirthday.date.toLocaleDateString(undefined, {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                    })}
                                </p>
                                {nextBirthday.daysAway > 0 && (
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {nextBirthday.daysAway === 1
                                            ? 'Tomorrow!'
                                            : `${nextBirthday.daysAway} days away · turning ${ordinal(diff.years + 1)}`}
                                    </p>
                                )}
                            </div>
                            <div className="text-4xl">🎂</div>
                        </div>
                    )}
                </>
            ) : (
                <div className="glass-panel p-10 text-center space-y-2">
                    <CalendarClock size={32} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400">Enter a valid date above to calculate.</p>
                </div>
            )}
        </div>
    );
}
