import { useEffect, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    Battery,
    CheckCircle2,
    Code2,
    Cpu,
    Eye,
    Fingerprint,
    Globe,
    Layers,
    Lock,
    MapPin,
    Monitor,
    RefreshCw,
    Shield,
    ShieldAlert,
    Smartphone,
    Wifi,
    MousePointer,
    Users,
    CreditCard,
    Network,
    Map,
    Mic,
    XCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ua() { return navigator.userAgent; }

function parseBrowser() {
    const agent = ua();
    if (/Edg\//.test(agent)) return { name: 'Microsoft Edge', engine: 'Blink' };
    if (/OPR\/|Opera/.test(agent)) return { name: 'Opera', engine: 'Blink' };
    if (/Chrome\//.test(agent)) return { name: 'Google Chrome', engine: 'Blink' };
    if (/Firefox\//.test(agent)) return { name: 'Mozilla Firefox', engine: 'Gecko' };
    if (/Safari\//.test(agent)) return { name: 'Apple Safari', engine: 'WebKit' };
    return { name: 'Unknown', engine: 'Unknown' };
}

function parseOS() {
    const agent = ua();
    if (/Windows NT 10/.test(agent)) return 'Windows 10 / 11';
    if (/Windows NT 6.3/.test(agent)) return 'Windows 8.1';
    if (/Windows NT 6.1/.test(agent)) return 'Windows 7';
    if (/Mac OS X/.test(agent)) return 'macOS ' + (agent.match(/Mac OS X ([\\d_]+)/)?.[1]?.replace(/_/g, '.') ?? '');
    if (/Android/.test(agent)) return 'Android ' + (agent.match(/Android ([\\d.]+)/)?.[1] ?? '');
    if (/iPhone|iPad/.test(agent)) return 'iOS ' + (agent.match(/OS ([\\d_]+)/)?.[1]?.replace(/_/g, '.') ?? '');
    if (/Linux/.test(agent)) return 'Linux';
    return 'Unknown OS';
}

function getBrowserVersion() {
    const agent = ua();
    const match =
        agent.match(/Edg\/([\\d.]+)/) ||
        agent.match(/OPR\/([\\d.]+)/) ||
        agent.match(/Chrome\/([\\d.]+)/) ||
        agent.match(/Firefox\/([\\d.]+)/) ||
        agent.match(/Version\/([\\d.]+)/);
    return match ? match[1] : 'Unknown';
}

function getWebGL() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return { supported: false };
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        return {
            supported: true,
            vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
            renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
            version: gl.getParameter(gl.VERSION),
        };
    } catch {
        return { supported: false };
    }
}

function getCanvasFingerprint() {
    try {
        const c = document.createElement('canvas');
        c.width = 280; c.height = 60;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 280, 60);
        ctx.font = 'italic 16px Georgia, serif';
        ctx.fillStyle = '#22d3ee';
        ctx.fillText('OceanTools 🌊 Canvas FP', 10, 26);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#f472b6';
        ctx.fillText('!@#$%^&*(){}[]<>?', 10, 46);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(250, 30, 18, 0, Math.PI * 2); ctx.stroke();
        const dataUrl = c.toDataURL();
        // Simple numeric hash for display
        let hash = 0;
        for (let i = 0; i < dataUrl.length; i++) {
            hash = ((hash << 5) - hash + dataUrl.charCodeAt(i)) | 0;
        }
        return { dataUrl, hash: Math.abs(hash).toString(16).toUpperCase().padStart(8, '0') };
    } catch {
        return { dataUrl: null, hash: 'N/A' };
    }
}

function detectAdblock() {
    const el = document.createElement('div');
    el.className = 'adsbox pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads';
    el.style.cssText = 'position:absolute;top:-10000px;left:-10000px;width:1px;height:1px';
    document.body.appendChild(el);
    const blocked = el.offsetHeight === 0 || el.offsetParent === null;
    document.body.removeChild(el);
    return blocked;
}

function getConnectionInfo() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return null;
    return {
        type: conn.type || 'Unknown',
        effectiveType: conn.effectiveType || 'Unknown',
        downlink: conn.downlink != null ? `${conn.downlink} Mbps` : 'Unknown',
        rtt: conn.rtt != null ? `${conn.rtt} ms` : 'Unknown',
        saveData: conn.saveData ? 'Yes' : 'No',
    };
}

function checkAPIs() {
    return [
        { name: 'WebGL', ok: !!document.createElement('canvas').getContext('webgl') },
        { name: 'WebAssembly', ok: typeof WebAssembly === 'object' },
        { name: 'Service Worker', ok: 'serviceWorker' in navigator },
        { name: 'Web Bluetooth', ok: 'bluetooth' in navigator },
        { name: 'Web USB', ok: 'usb' in navigator },
        { name: 'WebRTC', ok: typeof RTCPeerConnection !== 'undefined' },
        { name: 'SharedArrayBuffer', ok: typeof SharedArrayBuffer !== 'undefined' },
        { name: 'IndexedDB', ok: 'indexedDB' in window },
        { name: 'Web Crypto', ok: 'crypto' in window && 'subtle' in window.crypto },
        { name: 'Notifications', ok: 'Notification' in window },
        { name: 'Push API', ok: 'PushManager' in window },
        { name: 'Clipboard API', ok: 'clipboard' in navigator },
        { name: 'Battery API', ok: 'getBattery' in navigator },
        { name: 'Geolocation', ok: 'geolocation' in navigator },
        { name: 'WebSockets', ok: 'WebSocket' in window },
        { name: 'Web Workers', ok: 'Worker' in window },
    ];
}

function getStorageQuota() {
    if (navigator.storage && navigator.storage.estimate) {
        return navigator.storage.estimate();
    }
    return Promise.resolve(null);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({ icon: Icon, title, accent = 'cyan', children }) {
    const colors = {
        cyan: 'text-neon-cyan border-neon-cyan/20',
        emerald: 'text-neon-emerald border-neon-emerald/20',
        violet: 'text-violet-400 border-violet-400/20',
        amber: 'text-amber-400 border-amber-400/20',
        pink: 'text-pink-400 border-pink-400/20',
        red: 'text-red-400 border-red-400/20',
    };
    return (
        <div className={`glass-panel p-5 space-y-4 border ${colors[accent]}`}>
            <h2 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${colors[accent].split(' ')[0]}`}>
                <Icon size={14} />
                {title}
            </h2>
            {children}
        </div>
    );
}

function Row({ label, value, mono = false, warn = false }) {
    return (
        <div className="flex items-start justify-between gap-4 py-1.5 border-b border-white/5 last:border-0">
            <span className="text-xs text-slate-500 shrink-0 w-40">{label}</span>
            <span className={`text-xs text-right break-all ${warn ? 'text-amber-400' : 'text-slate-300'} ${mono ? 'font-mono' : ''}`}>
                {value ?? <span className="text-slate-600 italic">N/A</span>}
            </span>
        </div>
    );
}

function ApiChip({ name, ok }) {
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border
      ${ok
                ? 'bg-neon-emerald/10 text-neon-emerald border-neon-emerald/20'
                : 'bg-white/5 text-slate-600 border-white/10'
            }`}>
            {ok
                ? <CheckCircle2 size={10} />
                : <XCircle size={10} />}
            {name}
        </div>
    );
}

function AutofillTrap() {
    const [leaks, setLeaks] = useState({});

    // When a user selects an autofill profile for the name/email, the browser will likely 
    // eagerly fill all matching hidden fields in the form. This grabs what the browser filled.
    const handleChange = (e) => {
        const form = e.target.form;
        if (!form) return;
        setLeaks({
            name: form.fullName.value,
            email: form.email.value,
            phone: form.phone.value,
            address: form.address.value,
            ccName: form.ccname.value,
            ccNum: form.ccnumber.value,
            ccExp: form.ccexp.value,

        });
    };

    return (
        <div className="mt-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-4 relative overflow-hidden">
            <h3 className="text-xs font-semibold text-amber-300">Autofill Phishing Demonstration</h3>
            <p className="text-[10px] text-slate-400">
                Browsers do <strong>not</strong> grant JS access to read saved cards silently.
                However, malicious sites use <em>hidden fields</em>. Click the harmless "Email" field below and select your saved autofill profile. See what the site secretly captures.
            </p>

            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                {/* Visible "innocent" fields */}
                <div>
                    <label className="block text-[10px] uppercase text-slate-500 mb-1">Enter your Email to subscribe</label>
                    <input
                        name="email" type="email" autoComplete="email"
                        placeholder="you@example.com"
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 bg-ocean-900/50 border border-white/10 rounded focus:border-amber-400 focus:outline-none text-xs text-slate-200"
                    />
                </div>

                {/* Visually hidden but programmatically accessible fields (the trap) */}
                <div className="opacity-0 absolute top-[-9999px] left-[-9999px] h-0 w-0 pointer-events-none">
                    <input name="fullName" type="text" autoComplete="name" onChange={handleChange} />
                    <input name="phone" type="tel" autoComplete="tel" onChange={handleChange} />
                    <input name="ccname" type="text" autoComplete="cc-name" onChange={handleChange} tabIndex="-1" />
                    <input name="ccnumber" type="text" autoComplete="cc-number" onChange={handleChange} tabIndex="-1" />
                    <input name="ccexp" type="text" autoComplete="cc-exp" onChange={handleChange} tabIndex="-1" />
                    <input name="address" type="text" autoComplete="address-line1" onChange={handleChange} tabIndex="-1" />
                </div>
            </form>

            {/* Display what the browser gave us */}
            {Object.values(leaks).some(v => v) && (
                <div className="pt-3 border-t border-amber-500/20">
                    <p className="text-[10px] font-bold text-amber-400 mb-2">🚨 The browser leaked this off-screen data:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(leaks).map(([key, val]) => (
                            val ? (
                                <div key={key} className="col-span-2 flex items-start justify-between">
                                    <span className="text-[10px] text-slate-500 capitalize">{key}</span>
                                    <span className="text-[10px] font-mono text-slate-300 bg-white/5 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                                        {val}
                                    </span>
                                </div>
                            ) : null
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function BrowserFingerprint() {
    const [ip, setIp] = useState(null);
    const [ipData, setIpData] = useState(null);
    const [ipLoading, setIpLoading] = useState(true);
    const [battery, setBattery] = useState(null);
    const [quota, setQuota] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Advanced tracking states
    const [mediaDevs, setMediaDevs] = useState({ audioinput: 0, audiooutput: 0, videoinput: 0, labels: false });
    const [tabSwitches, setTabSwitches] = useState(0);
    const [mouseMoves, setMouseMoves] = useState(0);

    const browser = parseBrowser();
    const os = parseOS();
    const version = getBrowserVersion();
    const webgl = getWebGL();
    const canvas = getCanvasFingerprint();
    const conn = getConnectionInfo();
    const apis = checkAPIs();
    const adblock = detectAdblock();

    // IP lookup
    useEffect(() => {
        setIpLoading(true);
        setIpData(null);
        fetch('https://ipapi.co/json/')
            .then((r) => r.json())
            .then((d) => { setIp(d.ip); setIpData(d); })
            .catch(() => setIp('Unable to fetch'))
            .finally(() => setIpLoading(false));
    }, [refreshKey]);

    // Battery
    useEffect(() => {
        navigator.getBattery?.().then((b) => {
            const update = () => setBattery({
                level: Math.round(b.level * 100),
                charging: b.charging,
                chargingTime: b.chargingTime,
                dischargingTime: b.dischargingTime,
            });
            update();
            b.addEventListener('levelchange', update);
            b.addEventListener('chargingchange', update);
            return () => { b.removeEventListener('levelchange', update); b.removeEventListener('chargingchange', update); };
        }).catch(() => { });
    }, []);

    // Storage quota
    useEffect(() => { getStorageQuota().then(setQuota); }, []);

    // Media Devices Enumeration
    useEffect(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                let counts = { audioinput: 0, audiooutput: 0, videoinput: 0, labels: false };
                devices.forEach(d => {
                    if (counts[d.kind] !== undefined) counts[d.kind]++;
                    if (d.label) counts.labels = true;
                });
                setMediaDevs(counts);
            }).catch(() => { });
        }
    }, []);

    // Behavioral Tracking (Tab visibility & Mouse)
    useEffect(() => {
        const handleVis = () => { if (document.hidden) setTabSwitches(prev => prev + 1); };
        const handleMouse = () => setMouseMoves(prev => prev + 1);

        document.addEventListener('visibilitychange', handleVis);
        // Throttle mouse moves slightly for performance, or just listen natively if it's just a raw count
        window.addEventListener('mousemove', handleMouse, { passive: true });

        return () => {
            document.removeEventListener('visibilitychange', handleVis);
            window.removeEventListener('mousemove', handleMouse);
        };
    }, []);

    const fmt = (bytes) => bytes ? (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB' : 'N/A';

    return (
        <div className="space-y-4">
            {/* ------------------------------------------------------------------ */}
            {/* Warning banner                                                      */}
            {/* ------------------------------------------------------------------ */}
            <div className="glass-panel p-4 border border-amber-500/30 bg-amber-500/5
                      flex items-start gap-3">
                <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 space-y-0.5">
                    <p className="font-semibold text-amber-300">Privacy transparency tool</p>
                    <p>
                        This page reveals all information a website can collect when you visit it —
                        no data leaves your browser except for an anonymous IP lookup via{' '}
                        <code className="text-slate-300">ipapi.co</code>.
                        Everything else is gathered entirely client-side.
                    </p>
                </div>
                <button onClick={() => setRefreshKey((k) => k + 1)}
                    className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-neon-cyan
                     hover:bg-neon-cyan/10 transition-glow" title="Refresh">
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* Grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* ---- IP & Location ---- */}
                <Section icon={Globe} title="IP & Location" accent="cyan">
                    {ipLoading ? (
                        <p className="text-xs text-slate-500 animate-pulse">Fetching IP data…</p>
                    ) : (
                        <>
                            <Row label="Public IP" value={ip} mono warn={!!ip && ip !== 'Unable to fetch'} />
                            <Row label="ISP / Org" value={ipData?.org} />
                            <Row label="Country" value={ipData ? `${ipData.country_name} ${ipData.country_flag_emoji ?? ''}` : null} />
                            <Row label="Region" value={ipData?.region} />
                            <Row label="City" value={ipData?.city} />
                            <Row label="Postal code" value={ipData?.postal} mono />
                            <Row label="Lat / Lon" value={ipData ? `${ipData.latitude}, ${ipData.longitude}` : null} mono warn />
                            <Row label="Timezone (IP)" value={ipData?.timezone} />
                            <Row label="ASN" value={ipData?.asn} mono />
                            <Row label="Currency" value={ipData ? `${ipData.currency_name} (${ipData.currency})` : null} />
                        </>
                    )}
                </Section>

                {/* ---- Browser ---- */}
                <Section icon={Eye} title="Browser" accent="violet">
                    <Row label="Browser" value={browser.name} />
                    <Row label="Version" value={version} mono />
                    <Row label="Rendering engine" value={browser.engine} />
                    <Row label="User Agent" value={ua()} mono />
                    <Row label="Language" value={navigator.language} />
                    <Row label="Languages" value={navigator.languages?.join(', ')} />
                    <Row label="Do Not Track" value={navigator.doNotTrack ?? window.doNotTrack ?? 'unset'} warn={navigator.doNotTrack !== '1'} />
                    <Row label="Cookies enabled" value={navigator.cookieEnabled ? 'Yes' : 'No'} warn={!navigator.cookieEnabled} />
                    <Row label="Java enabled" value={navigator.javaEnabled?.() ? 'Yes' : 'No'} />
                    <Row label="PDF viewer" value={navigator.pdfViewerEnabled ? 'Yes' : 'No'} />
                </Section>

                {/* ---- Operating System & Hardware ---- */}
                <Section icon={Cpu} title="System & Hardware" accent="emerald">
                    <Row label="Operating System" value={os} />
                    <Row label="Platform" value={navigator.platform} mono />
                    <Row label="Architecture" value={/WOW64|x86_64|x64/.test(ua()) ? '64-bit' : '32-bit'} />
                    <Row label="CPU cores (logical)" value={navigator.hardwareConcurrency} warn />
                    <Row label="Device memory" value={navigator.deviceMemory ? `≥ ${navigator.deviceMemory} GB` : null} warn />
                    <Row label="Max touch points" value={navigator.maxTouchPoints} />
                    <Row label="Pointer type" value={matchMedia('(pointer:coarse)').matches ? 'Coarse (touch)' : 'Fine (mouse)'} />
                    <Row label="Hover capability" value={matchMedia('(hover:hover)').matches ? 'Yes' : 'No'} />
                    <Row label="Storage used" value={quota ? fmt(quota.usage) : null} />
                    <Row label="Storage available" value={quota ? fmt(quota.quota) : null} />
                </Section>

                {/* ---- Screen & Display ---- */}
                <Section icon={Monitor} title="Screen & Display" accent="pink">
                    <Row label="Screen resolution" value={`${screen.width} × ${screen.height}`} mono warn />
                    <Row label="Available size" value={`${screen.availWidth} × ${screen.availHeight}`} mono />
                    <Row label="Viewport (inner)" value={`${window.innerWidth} × ${window.innerHeight}`} mono />
                    <Row label="Device pixel ratio" value={window.devicePixelRatio} mono warn />
                    <Row label="Color depth" value={`${screen.colorDepth}-bit`} />
                    <Row label="Pixel depth" value={`${screen.pixelDepth}-bit`} />
                    <Row label="Orientation" value={screen.orientation?.type ?? 'N/A'} />
                    <Row label="Prefers dark mode" value={matchMedia('(prefers-color-scheme:dark)').matches ? 'Yes' : 'No'} />
                    <Row label="Reduced motion" value={matchMedia('(prefers-reduced-motion:reduce)').matches ? 'Yes' : 'No'} />
                    <Row label="HDR display" value={matchMedia('(dynamic-range:high)').matches ? 'Yes' : 'No'} />
                </Section>

                {/* ---- Network ---- */}
                <Section icon={Wifi} title="Network" accent="cyan">
                    <Row label="Online" value={navigator.onLine ? 'Yes' : 'No'} warn={!navigator.onLine} />
                    {conn ? (
                        <>
                            <Row label="Connection type" value={conn.type} />
                            <Row label="Effective type" value={conn.effectiveType} warn />
                            <Row label="Downlink" value={conn.downlink} mono />
                            <Row label="RTT" value={conn.rtt} mono />
                            <Row label="Save-Data mode" value={conn.saveData} warn={conn.saveData === 'Yes'} />
                        </>
                    ) : (
                        <Row label="Network Info API" value="Not supported by this browser" />
                    )}
                    <Row label="Referrer" value={document.referrer || 'None (direct)'} mono />
                    <Row label="Protocol" value={location.protocol} mono />
                </Section>

                {/* ---- Privacy signals ---- */}
                <Section icon={Shield} title="Privacy Signals" accent="amber">
                    <Row label="Ad blocker" value={adblock ? 'Detected ⚠️' : 'Not detected'} warn={adblock} />
                    <Row label="Do Not Track" value={navigator.doNotTrack === '1' ? 'Enabled ✓' : 'Not set'} warn={navigator.doNotTrack !== '1'} />
                    <Row label="Private / Incognito" value="Cannot detect reliably" />
                    <Row label="localStorage" value={(() => { try { localStorage.setItem('_t', '1'); localStorage.removeItem('_t'); return 'Available'; } catch { return 'Blocked'; } })()} />
                    <Row label="sessionStorage" value={(() => { try { sessionStorage.setItem('_t', '1'); sessionStorage.removeItem('_t'); return 'Available'; } catch { return 'Blocked'; } })()} />
                    <Row label="IndexedDB" value={'indexedDB' in window ? 'Available' : 'Blocked'} />
                    <Row label="Cookie enabled" value={navigator.cookieEnabled ? 'Yes' : 'No'} warn={!navigator.cookieEnabled} />
                    <Row label="HTTPS" value={location.protocol === 'https:' ? 'Yes ✓' : 'No ⚠️'} warn={location.protocol !== 'https:'} />
                </Section>

                {/* ---- Battery ---- */}
                {battery && (
                    <Section icon={Battery} title="Battery" accent="emerald">
                        <div className="space-y-3">
                            {/* Level bar */}
                            <div>
                                <div className="flex justified-between text-xs text-slate-400 mb-1.5">
                                    <span>Battery level</span>
                                    <span className="ml-auto font-mono text-neon-emerald">{battery.level}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-neon-emerald to-neon-cyan transition-all duration-500"
                                        style={{ width: `${battery.level}%` }} />
                                </div>
                            </div>
                            <Row label="Charging" value={battery.charging ? 'Yes ⚡' : 'No'} />
                            <Row label="Time to full" value={battery.chargingTime === Infinity ? 'N/A' : `${Math.round(battery.chargingTime / 60)} min`} />
                            <Row label="Time remaining" value={battery.dischargingTime === Infinity ? 'N/A' : `${Math.round(battery.dischargingTime / 60)} min`} warn />
                        </div>
                    </Section>
                )}

                {/* ---- WebGL ---- */}
                <Section icon={Layers} title="WebGL / GPU" accent="violet">
                    <Row label="WebGL support" value={webgl.supported ? 'Yes' : 'No'} warn={!webgl.supported} />
                    {webgl.supported && (
                        <>
                            <Row label="GPU Vendor" value={webgl.vendor} warn />
                            <Row label="GPU Renderer" value={webgl.renderer} warn />
                            <Row label="GL Version" value={webgl.version} mono />
                        </>
                    )}
                </Section>

                {/* ---- Canvas fingerprint ---- */}
                <Section icon={Fingerprint} title="Canvas Fingerprint" accent="pink">
                    <p className="text-xs text-slate-500">
                        Sites draw invisible text and shapes on a hidden canvas.
                        Rendering differences produce a unique fingerprint per device/GPU/font stack.
                    </p>
                    {canvas.dataUrl && (
                        <div className="rounded-xl overflow-hidden border border-white/10">
                            <img src={canvas.dataUrl} alt="Canvas fingerprint render" className="w-full" />
                        </div>
                    )}
                    <Row label="Canvas hash" value={canvas.hash} mono warn />
                </Section>

                {/* ---- Time & locale ---- */}
                <Section icon={Activity} title="Time & Locale" accent="cyan">
                    <Row label="Timezone (browser)" value={Intl.DateTimeFormat().resolvedOptions().timeZone} warn />
                    <Row label="UTC offset" value={`UTC${new Date().getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(new Date().getTimezoneOffset() / 60)}`} mono />
                    <Row label="Locale" value={Intl.DateTimeFormat().resolvedOptions().locale} />
                    <Row label="Calendar" value={Intl.DateTimeFormat().resolvedOptions().calendar} />
                    <Row label="Number format" value={new Intl.NumberFormat().format(1234567.89)} mono warn />
                    <Row label="Current time" value={new Date().toLocaleString()} />
                </Section>

                {/* ---- Mobile / device ---- */}
                <Section icon={Smartphone} title="Device Type" accent="emerald">
                    <Row label="Mobile device" value={/Mobi|Android/i.test(ua()) ? 'Yes' : 'No'} />
                    <Row label="Tablet" value={/iPad|Tablet/i.test(ua()) ? 'Yes' : 'Likely No'} />
                    <Row label="Touch screen" value={navigator.maxTouchPoints > 0 ? `Yes (${navigator.maxTouchPoints} points)` : 'No'} />
                    <Row label="Standalone/PWA" value={window.matchMedia('(display-mode:standalone)').matches ? 'Yes (PWA)' : 'No'} />
                    <Row label="Screen reader hint" value={navigator.userAgent.includes('ChromeVox') ? 'Likely' : 'Not detected'} />
                </Section>

                {/* ---- Web API support ---- */}
                <Section icon={Code2} title="Browser API Support" accent="amber">
                    <p className="text-xs text-slate-500 mb-2">
                        Every available API can be probed to build a high-confidence device fingerprint.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {apis.map((a) => <ApiChip key={a.name} {...a} />)}
                    </div>
                </Section>

                {/* ---- Plugins ---- */}
                {navigator.plugins?.length > 0 && (
                    <Section icon={Lock} title="Browser Plugins" accent="violet">
                        <p className="text-xs text-slate-500">Plugin list is another fingerprinting vector.</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                            {Array.from(navigator.plugins).map((p, i) => (
                                <div key={i} className="text-xs text-slate-400 font-mono truncate py-0.5
                                        border-b border-white/5 last:border-0">
                                    {p.name}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* ---- Media Devices ---- */}
                <Section icon={Mic} title="Sensors & Media Devices" accent="emerald">
                    <p className="text-xs text-slate-500 mb-2">
                        Sites can often count your hardware peripherals even without mic/camera permissions.
                    </p>
                    <Row label="Audio inputs (mics)" value={mediaDevs.audioinput} mono warn={mediaDevs.audioinput > 0} />
                    <Row label="Audio outputs (speakers)" value={mediaDevs.audiooutput} mono />
                    <Row label="Video inputs (cameras)" value={mediaDevs.videoinput} mono warn={mediaDevs.videoinput > 0} />
                    <Row label="Device names exposed" value={mediaDevs.labels ? 'Yes ⚠️' : 'No (Requires permission)'} warn={mediaDevs.labels} />
                </Section>

                {/* ---- Behavioral Tracking ---- */}
                <Section icon={MousePointer} title="Behavioral Tracking" accent="amber">
                    <p className="text-xs text-slate-500 mb-2">
                        Analytics scripts and bot-protections track how you physically interact with the page.
                    </p>
                    <Row label="Mouse movements logged" value={mouseMoves} mono warn />
                    <Row label="Tab away/focus lost" value={`${tabSwitches} times`} mono warn={tabSwitches > 0} />
                    <Row label="Keystroke dynamics" value="Measures typing rhythm/cadence" />
                    <Row label="Scroll velocity" value="Heatmap generation via pause points" />
                    <Row label="Session replay" value="Hotjar/FullStory record full DOM + cursor" />
                </Section>

                {/* ---- Network Intelligence ---- */}
                <Section icon={Network} title="Network-Level Invisible Signals" accent="violet">
                    <p className="text-xs text-slate-500 mb-2">
                        These happen underneath the browser, at the packet level. JS cannot read them, but servers do.
                    </p>
                    <Row label="DNS Requests" value="ISP sees domains (unless using DoH)" />
                    <Row label="TCP/IP stacks (p0f)" value="OS fingerprint via packet structures" warn />
                    <Row label="TLS Handshake (JA3)" value="Browser version revealed via encryption negotiation" warn />
                </Section>

                {/* ---- Identity & Cross Site Linking ---- */}
                <Section icon={Users} title="Cross-Site Identity Linking" accent="pink">
                    <Row label="Email hashing" value="Logins shared with ad networks as hashes" warn />
                    <Row label="Social Pixels" value="Meta/TikTok/LinkedIn match you globally" warn />
                    <Row label="Entropy fingerprinting" value="Combining all the above metrics for 99% accuracy" />
                    <Row label="Third-party cookies" value="Declining rapidly, replaced by the above" />
                </Section>

                {/* ---- Explicit Location APIs ---- */}
                <Section icon={Map} title="Location (Beyond IP)" accent="cyan">
                    <Row label="Wi-Fi SSID" value="Accessible to native/mobile apps, not Web" />
                    <Row label="Bluetooth Scanning" value="Requires explicit Web Bluetooth prompt" />
                    <Row label="Precise GPS (NavAPI)" value="Requires user permission prompt" />
                </Section>

                {/* ---- Payment & E-commerce ---- */}
                <Section icon={CreditCard} title="Payment & Autofill Exploits" accent="amber">
                    <p className="text-xs text-slate-500 mb-2">
                        Hidden inputs on sites can exploit browser autofill logic.
                    </p>
                    <Row label="Form Autofill Leaks" value="Invisible fields capture name/address" warn />
                    <Row label="Credit Card BIN" value="First 6 digits identify your exact issuing bank" warn />

                    <AutofillTrap />
                </Section>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* Footer summary                                                      */}
            {/* ------------------------------------------------------------------ */}
            <div className="glass-panel p-5 border border-red-500/20 bg-red-500/5 space-y-2">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-400" />
                    <p className="text-sm font-semibold text-red-300">What this means for your privacy</p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                    Even without cookies, websites can combine IP address, screen resolution, GPU info,
                    canvas rendering, fonts, timezone, language, installed plugins, and hardware specs
                    to create a <strong className="text-slate-300">unique fingerprint</strong> that
                    identifies you across sessions and sites. Use a VPN, privacy-respecting browser,
                    and tools like uBlock Origin to reduce your exposure.
                </p>
            </div>
        </div>
    );
}
