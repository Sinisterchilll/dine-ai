import Link from 'next/link';

// ─── Restaurant floor network SVG ─────────────────────────────────────────────
function NetworkSVG() {
  const cx = 490, cy = 200; // AI node center
  const tables = [
    { id: 1, x: 108, y: 82,  label: 'T1', d: '0s',   chat: null },
    { id: 2, x: 295, y: 52,  label: 'T2', d: '1.1s',  chat: "What's popular?" },
    { id: 3, x: 510, y: 44,  label: 'T3', d: '0.4s',  chat: null },
    { id: 4, x: 730, y: 68,  label: 'T4', d: '1.7s',  chat: 'Add 2 butter chickens' },
    { id: 5, x: 876, y: 162, label: 'T5', d: '0.8s',  chat: null },
    { id: 6, x: 856, y: 308, label: 'T6', d: '2.1s',  chat: 'Veg options?' },
    { id: 7, x: 620, y: 352, label: 'T7', d: '0.2s',  chat: null },
    { id: 8, x: 310, y: 348, label: 'T8', d: '1.4s',  chat: null },
    { id: 9, x: 100, y: 262, label: 'T9', d: '0.6s',  chat: 'Spice level?' },
  ];

  return (
    <svg viewBox="0 0 980 400" style={{ width: '100%', height: 'auto', display: 'block' }} aria-hidden>
      <defs>
        <radialGradient id="aiGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── Subtle grid lines ── */}
      {[100,200,300,400,500,600,700,800,900].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="400" stroke="#1C1917" strokeWidth="1" />
      ))}
      {[80,160,240,320].map(y => (
        <line key={y} x1="0" y1={y} x2="980" y2={y} stroke="#1C1917" strokeWidth="1" />
      ))}

      {/* ── Connection paths with flowing dashes ── */}
      {tables.map(t => {
        const pathD = `M${t.x} ${t.y} Q${(t.x + cx) / 2 + (t.y < cy ? 0 : 0)} ${(t.y + cy) / 2} ${cx} ${cy}`;
        return (
          <g key={t.id}>
            {/* Static dim path */}
            <path d={pathD} fill="none" stroke="#3F3B37" strokeWidth="1" />
            {/* Animated flowing path */}
            <path
              d={pathD}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeDasharray="6 10"
              style={{ animation: `flowDash 2s ${t.d} linear infinite`, opacity: 0.5 }}
            />
            {/* Pulse dot traveling along path */}
            <circle r="3" fill="#F59E0B" filter="url(#glow)"
              style={{ opacity: 0 }}>
              <animateMotion dur="2s" begin={t.d} repeatCount="indefinite"
                path={pathD} calcMode="linear" />
              <animate attributeName="opacity"
                values="0;0.9;0.9;0" keyTimes="0;0.1;0.85;1"
                dur="2s" begin={t.d} repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}

      {/* ── Table nodes ── */}
      {tables.map(t => (
        <g key={t.id}>
          {/* Pulse ring */}
          <circle cx={t.x} cy={t.y} r="18" fill="none" stroke="#F59E0B" strokeWidth="1"
            style={{
              transformBox: 'fill-box', transformOrigin: 'center',
              animation: `tableRing 3s ${t.d} ease-out infinite`,
            }} />
          {/* Table rect */}
          <rect x={t.x - 22} y={t.y - 14} width="44" height="28" rx="6"
            fill="#1C1917" stroke="#3F3B37" strokeWidth="1.5" />
          {/* Chair dots */}
          {[[-28, 0], [28, 0], [0, -18], [0, 18]].map(([ox, oy], i) => (
            <circle key={i} cx={t.x + ox} cy={t.y + oy} r="4"
              fill="#0C0A09" stroke="#292524" strokeWidth="1" />
          ))}
          {/* QR mark on table */}
          <rect x={t.x - 7} y={t.y - 7} width="6" height="6" rx="1" fill="#F59E0B" opacity="0.25" />
          <rect x={t.x + 1} y={t.y - 7} width="6" height="6" rx="1" fill="#F59E0B" opacity="0.25" />
          <rect x={t.x - 7} y={t.y + 1} width="6" height="6" rx="1" fill="#F59E0B" opacity="0.25" />
          {/* Table label */}
          <text x={t.x} y={t.y + 24} textAnchor="middle" fontSize="8"
            fill="#78716C" fontFamily="monospace" fontWeight="600">{t.label}</text>
        </g>
      ))}

      {/* ── Floating chat bubbles ── */}
      {tables.filter(t => t.chat).map((t, i) => {
        const bw = t.chat!.length * 5.8 + 16;
        const bx = t.x + 26;
        const by = t.y - 38;
        return (
          <g key={t.id} style={{ animation: `bubbleFloat 4s ${parseFloat(t.d) + 0.3}s ease-in-out infinite` }}>
            <rect x={bx} y={by} width={bw} height="22" rx="5"
              fill="#1C1917" stroke="#3F3B37" strokeWidth="1" />
            {/* Tail */}
            <polygon points={`${bx + 6},${by + 22} ${bx},${by + 28} ${bx + 14},${by + 22}`}
              fill="#1C1917" stroke="#3F3B37" strokeWidth="1" />
            <text x={bx + bw / 2} y={by + 14} textAnchor="middle"
              fontSize="7.5" fill="#A8A29E" fontFamily="'DM Sans', sans-serif">{t.chat}</text>
          </g>
        );
      })}

      {/* ── Central AI node ── */}
      <circle cx={cx} cy={cy} r="68" fill="url(#aiGlow)" />
      <circle cx={cx} cy={cy} r="48" fill="rgba(245,158,11,0.04)" stroke="#F59E0B"
        strokeWidth="0.5" style={{ animation: 'aiOrbit 4s linear infinite' }} />
      <circle cx={cx} cy={cy} r="34" fill="#1C1917" stroke="#F59E0B" strokeWidth="1.5" filter="url(#glow)" />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="10" fill="#F59E0B"
        fontWeight="700" fontFamily="'DM Sans', sans-serif" letterSpacing="1">DINE</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="10" fill="#F59E0B"
        fontWeight="700" fontFamily="'DM Sans', sans-serif" letterSpacing="1">AI</text>

      {/* ── Ambient dots ── */}
      {[[60,180],[200,340],[760,34],[900,380],[140,380],[820,220]].map(([dx, dy], i) => (
        <circle key={i} cx={dx} cy={dy} r="2" fill="#3F3B37"
          style={{ animation: `dotPop 3s ${i * 0.6}s ease-in-out infinite` }} />
      ))}
    </svg>
  );
}

// ─── QR code with scan animation ──────────────────────────────────────────────
function QRBlock() {
  // 7×7 QR position marker pattern
  const marker = (ox: number, oy: number, s: number) => {
    const cells = [];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      const outer = r === 0 || r === 6 || c === 0 || c === 6;
      const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      if (outer || inner) {
        cells.push(<rect key={`${r}-${c}`} x={ox + c * s} y={oy + r * s} width={s - 0.5} height={s - 0.5} fill="#F59E0B" opacity={outer ? 0.9 : 0.7} rx="0.5" />);
      }
    }
    return cells;
  };
  const s = 5;
  const data = [[1,5],[1,7],[1,9],[2,4],[2,6],[2,8],[3,5],[3,9],[4,4],[4,7],[5,5],[5,8],[6,6],[6,9]];
  return (
    <svg viewBox="0 0 90 90" width="90" height="90" style={{ flexShrink: 0 }} aria-hidden>
      <rect width="90" height="90" rx="8" fill="#1C1917" stroke="#3F3B37" strokeWidth="1.5" />
      {marker(6, 6, s)}
      {marker(6, 55, s)}
      {marker(55, 6, s)}
      {data.map(([r, c], i) => (
        <rect key={i} x={6 + c * s} y={6 + r * s} width={s - 1} height={s - 1} fill="#F59E0B" opacity="0.35" rx="0.5" />
      ))}
      {/* Scan line */}
      <rect x="6" width="78" height="2" rx="1" fill="#F59E0B" opacity="0.8">
        <animate attributeName="y" values="14;74;14" dur="2.4s" repeatCount="indefinite" calcMode="ease-in-out" />
      </rect>
      <rect x="6" width="78" height="8" rx="2" fill="#F59E0B" opacity="0.08">
        <animate attributeName="y" values="11;71;11" dur="2.4s" repeatCount="indefinite" calcMode="ease-in-out" />
      </rect>
    </svg>
  );
}

// ─── Animated chat conversation ────────────────────────────────────────────────
function ChatDemo() {
  const msgs = [
    { role: 'u', text: "What's good tonight?", delay: '0.3s' },
    { role: 'a', text: 'The Butter Chicken is our most ordered dish — rich tomato curry, perfectly spiced. ₹320.', delay: '1.4s' },
    { role: 'u', text: 'Add 2 of those and a Mango Lassi', delay: '3.2s' },
    { role: 'a', text: 'Done! Anything else?', delay: '4.4s', chip: '2× Butter Chicken + 1× Mango Lassi — ₹760 added' },
    { role: 'u', text: 'No that\'s all, place the order', delay: '6.2s' },
    { role: 'a', text: 'Order placed! The kitchen has it. Estimated time: 20–25 min.', delay: '7.4s' },
  ];
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', gap: 12 }}>
      {msgs.map((m, i) => (
        <div key={i}
          style={{
            display: 'flex',
            justifyContent: m.role === 'u' ? 'flex-end' : 'flex-start',
            animation: `msgAppear 0.4s ${m.delay} both`,
            opacity: 0,
          }}>
          <div style={{ maxWidth: '72%' }}>
            <div style={{
              padding: '9px 13px',
              borderRadius: m.role === 'u' ? '14px 14px 3px 14px' : '3px 14px 14px 14px',
              background: m.role === 'u' ? '#F59E0B' : '#1C1917',
              color: m.role === 'u' ? '#000' : '#FAFAF9',
              fontSize: 13,
              fontWeight: m.role === 'u' ? 500 : 400,
              border: m.role === 'a' ? '1px solid #292524' : 'none',
              lineHeight: 1.5,
            }}>{m.text}</div>
            {m.chip && (
              <div style={{
                marginTop: 5,
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 8, padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: 6,
                animation: `msgAppear 0.4s ${m.delay} both`, opacity: 0,
              }}>
                <span style={{ fontSize: 13 }}>🛒</span>
                <span style={{ fontSize: 11, color: '#22C55E' }}>{m.chip}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const marqueeItems = ['SCAN TO ORDER', 'AI WAITER', 'LIVE ORDER BOARD', 'QR PER TABLE', 'MULTILINGUAL', 'REAL-TIME MENU', 'CUSTOM PERSONALITY'];
  const marqueeStr = marqueeItems.map(s => `${s}  ·  `).join('').repeat(4);

  const features = [
    { n: '01', h: 'AI waiter, 24/7', b: 'Never "just a sec" again. Your AI knows every item, every allergen, every special. It handles questions, upsells, and order placement — instantly, every time.' },
    { n: '02', h: 'Live order board', b: 'Every order lands in your dashboard the moment it\'s placed. Update status — preparing, ready, delivered — with one tap. No printer, no shouting across the kitchen.' },
    { n: '03', h: 'One QR per table', b: 'Generate a unique code for every table in seconds. Each one opens directly to that table\'s session. Print it, frame it, done. No app to download, no login for customers.' },
    { n: '04', h: 'Speaks any language', b: 'The AI detects whatever language the customer writes in and responds naturally. Hindi, English, Tamil — no config, no extra setup. It just works.' },
    { n: '05', h: 'Your personality, not ours', b: 'Formal, warm, or wry — you decide. Write the greeting, set the tone, add house knowledge. The AI behaves exactly how you tell it to.' },
    { n: '06', h: 'Analytics that mean something', b: 'See what people order, what they ask about, what they add to cart and then remove. Real signal, not vanity metrics.' },
  ];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; background: #0C0A09; }
        a { text-decoration: none; color: inherit; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0C0A09; }
        ::-webkit-scrollbar-thumb { background: #292524; border-radius: 3px; }

        @keyframes flowDash {
          to { stroke-dashoffset: -32; }
        }
        @keyframes tableRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes bubbleFloat {
          0%, 15% { opacity: 0; transform: translateY(5px); }
          25%, 65% { opacity: 1; transform: translateY(0); }
          75%, 100% { opacity: 0; transform: translateY(-4px); }
        }
        @keyframes aiOrbit {
          from { transform: rotate(0deg); transform-origin: 490px 200px; }
          to { transform: rotate(360deg); transform-origin: 490px 200px; }
        }
        @keyframes dotPop {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.6); }
        }
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-25%); }
        }
        @keyframes msgAppear {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        .hero-txt { animation: heroFade 0.9s 0.1s both; }
        .hero-sub { animation: heroFade 0.9s 0.3s both; }
        .hero-cta { animation: heroFade 0.9s 0.5s both; }
        .net-svg { animation: heroFade 1s 0.7s both; }

        .feat-row { border-top: 1px solid #1C1917; display: flex; gap: 0; align-items: flex-start; padding: 36px 0; transition: background 0.2s; }
        .feat-row:hover { background: #0d0b0a; }
        .feat-row:hover .feat-num { color: #F59E0B; }
        .feat-num { font-size: 11px; font-family: monospace; color: #3F3B37; min-width: 48px; padding-top: 3px; letter-spacing: 0.05em; transition: color 0.2s; }

        .nav-link { font-size: 13px; color: #78716C; padding: 6px 12px; border-radius: 8px; transition: color 0.15s; }
        .nav-link:hover { color: #FAFAF9; }

        @media (max-width: 800px) {
          .two-col { flex-direction: column !important; }
          .hide-mobile { display: none !important; }
          .net-label { display: none; }
        }
      `}</style>

      <div style={{ background: '#0C0A09', color: '#FAFAF9', fontFamily: "'DM Sans', -apple-system, sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>

        {/* ── NAV ── */}
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(12,10,9,0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(63,59,55,0.4)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="10" cy="10" r="9" stroke="#F59E0B" strokeWidth="1.5"/>
                <circle cx="10" cy="10" r="4" fill="#F59E0B" opacity="0.7"/>
              </svg>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>DineAI</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <a href="#features" className="nav-link hide-mobile">Features</a>
              <a href="#demo" className="nav-link hide-mobile">Demo</a>
              <Link href="/login" className="nav-link">Login</Link>
              <Link href="/signup" style={{ fontSize: 13, fontWeight: 700, background: '#F59E0B', color: '#000', padding: '7px 16px', borderRadius: 8, marginLeft: 4 }}>
                Start free
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ paddingTop: 100, paddingBottom: 0, position: 'relative', overflow: 'hidden' }}>
          {/* Radial glow */}
          <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', pointerEvents: 'none', animation: 'glowPulse 4s ease-in-out infinite' }} />

          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px 0', textAlign: 'center', position: 'relative' }}>
            {/* Badge */}
            <div className="hero-txt" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)', borderRadius: 100, padding: '5px 14px', marginBottom: 36 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', animation: 'glowPulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, letterSpacing: '0.05em' }}>AI-POWERED RESTAURANT PLATFORM</span>
            </div>

            {/* Headline */}
            <h1 className="hero-txt" style={{
              fontSize: 'clamp(52px, 8.5vw, 112px)',
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: '-4px',
              marginBottom: 28,
            }}>
              The waiter that<br />
              <span style={{ color: '#F59E0B', WebkitTextStroke: '0px' }}>never calls in sick.</span>
            </h1>

            {/* Sub */}
            <p className="hero-sub" style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: '#A8A29E', lineHeight: 1.65, maxWidth: 560, margin: '0 auto 36px' }}>
              DineAI turns your menu into an AI dining companion. Customers scan, chat, and order — no app, no staff, no wait.
            </p>

            {/* CTAs */}
            <div className="hero-cta" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 72 }}>
              <Link href="/signup" style={{ background: '#F59E0B', color: '#000', fontWeight: 700, fontSize: 15, padding: '13px 28px', borderRadius: 10, display: 'inline-block' }}>
                Start free — no credit card →
              </Link>
              <Link href="/r/spice-garden/t/1" style={{ background: '#1C1917', color: '#FAFAF9', fontWeight: 600, fontSize: 15, padding: '13px 28px', borderRadius: 10, border: '1px solid #292524', display: 'inline-block' }}>
                See live demo
              </Link>
            </div>
          </div>

          {/* Network SVG — full bleed */}
          <div className="net-svg" style={{ width: '100%', borderTop: '1px solid #1C1917', position: 'relative' }}>
            {/* Side labels */}
            <div className="net-label" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontSize: 10, color: '#3F3B37', fontFamily: 'monospace', letterSpacing: '0.1em' }}>RESTAURANT FLOOR</div>
            <div className="net-label" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontSize: 10, color: '#3F3B37', fontFamily: 'monospace', letterSpacing: '0.1em' }}>LIVE SESSIONS</div>
            <NetworkSVG />
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div style={{ borderTop: '1px solid #1C1917', borderBottom: '1px solid #1C1917', background: '#0C0A09', overflow: 'hidden', padding: '14px 0' }}>
          <div style={{ display: 'inline-block', whiteSpace: 'nowrap', animation: 'marqueeScroll 24s linear infinite' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3F3B37', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
              {marqueeStr}
            </span>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 28px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 60, flexWrap: 'wrap', gap: 16 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05 }}>
              Everything you need.<br />
              <span style={{ color: '#3F3B37' }}>Nothing you don&apos;t.</span>
            </h2>
            <p style={{ fontSize: 14, color: '#78716C', maxWidth: 260, lineHeight: 1.6 }}>
              Built for working restaurants — not for pitch decks.
            </p>
          </div>

          {features.map(f => (
            <div key={f.n} className="feat-row" style={{ padding: '36px 0' }}>
              <span className="feat-num">{f.n}</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 40, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: 800, letterSpacing: '-0.5px', minWidth: 220, lineHeight: 1.2 }}>{f.h}</h3>
                <p style={{ fontSize: 15, color: '#A8A29E', lineHeight: 1.7, flex: 1, minWidth: 200 }}>{f.b}</p>
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #1C1917' }} />
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how" style={{ borderTop: '1px solid #1C1917', background: '#080706' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 28px' }}>

            <h2 style={{ fontSize: 'clamp(28px, 4vw, 56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 80, lineHeight: 1.05 }}>
              Scan.<br />Chat.<br />
              <span style={{ color: '#F59E0B' }}>Eat.</span>
            </h2>

            {/* Steps with QR visual */}
            <div className="two-col" style={{ display: 'flex', gap: 80, alignItems: 'flex-start' }}>
              {/* Left — steps */}
              <div style={{ flex: 1 }}>
                {[
                  { n: '01', h: 'Build your menu', b: 'Add items with prices, descriptions, allergens, and flags like chef\'s special or today\'s deal. Full menu in ~10 minutes.' },
                  { n: '02', h: 'Generate QR codes', b: 'One click per table. Download, print, place. Each code is unique to that table — the AI knows exactly where the customer is sitting.' },
                  { n: '03', h: 'Let the AI run', b: 'Customers scan, chat in their language, and order. Tickets land in your board. You focus on the food.' },
                ].map((s, i) => (
                  <div key={s.n} style={{ display: 'flex', gap: 24, marginBottom: i < 2 ? 48 : 0 }}>
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'monospace', color: '#F59E0B', fontWeight: 700, background: 'rgba(245,158,11,0.05)' }}>{s.n}</div>
                      {i < 2 && <div style={{ width: 1, flexGrow: 1, background: 'linear-gradient(to bottom, #3F3B37, transparent)', marginTop: 6 }} />}
                    </div>
                    <div style={{ paddingBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, letterSpacing: '-0.3px' }}>{s.h}</div>
                      <div style={{ fontSize: 14, color: '#A8A29E', lineHeight: 1.7 }}>{s.b}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right — QR visual */}
              <div className="hide-mobile" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <QRBlock />
                <div style={{ fontSize: 11, color: '#78716C', fontFamily: 'monospace', letterSpacing: '0.08em', textAlign: 'center' }}>
                  /r/spice-garden/t/4<br />
                  <span style={{ color: '#3F3B37' }}>Table 4 — Window Seat</span>
                </div>
                {/* Arrow */}
                <svg width="2" height="40" viewBox="0 0 2 40" aria-hidden>
                  <line x1="1" y1="0" x2="1" y2="40" stroke="#3F3B37" strokeWidth="1" strokeDasharray="3 3" />
                </svg>
                {/* Mini chat preview */}
                <div style={{ width: 180, background: '#1C1917', border: '1px solid #292524', borderRadius: 10, padding: 12, fontSize: 11, color: '#A8A29E', lineHeight: 1.5 }}>
                  <div style={{ marginBottom: 6, color: '#F59E0B', fontWeight: 600, fontSize: 10 }}>🍛 Spice Garden · T4</div>
                  <div style={{ background: '#0C0A09', borderRadius: 6, padding: '5px 8px', marginBottom: 6 }}>Welcome! What can I get you?</div>
                  <div style={{ background: '#F59E0B', color: '#000', fontWeight: 500, borderRadius: 6, padding: '5px 8px', textAlign: 'right', marginBottom: 6 }}>Butter Chicken ×2</div>
                  <div style={{ background: '#0C0A09', borderRadius: 6, padding: '5px 8px' }}>Done! Added to cart ✓</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── LIVE DEMO / CHAT ANIMATION ── */}
        <section id="demo" style={{ borderTop: '1px solid #1C1917' }}>
          <div className="two-col" style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 28px', display: 'flex', gap: 80, alignItems: 'flex-start' }}>
            {/* Left — text */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#F59E0B', fontFamily: 'monospace', letterSpacing: '0.1em', marginBottom: 20 }}>LIVE DEMO</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 20, lineHeight: 1.05 }}>
                Try Spice Garden,<br />
                <span style={{ color: '#3F3B37' }}>our demo restaurant.</span>
              </h2>
              <p style={{ fontSize: 15, color: '#78716C', lineHeight: 1.7, marginBottom: 32, maxWidth: 380 }}>
                25 menu items, custom AI personality, 5 tables with QR codes. Chat as a customer, then check the admin board.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link href="/r/spice-garden/t/1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F59E0B', color: '#000', fontWeight: 700, fontSize: 14, padding: '12px 22px', borderRadius: 10, width: 'fit-content' }}>
                  <span>Open customer chat — Table 1</span>
                  <span>→</span>
                </Link>
                <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1C1917', color: '#78716C', fontWeight: 600, fontSize: 14, padding: '12px 22px', borderRadius: 10, border: '1px solid #292524', width: 'fit-content' }}>
                  <span>Admin dashboard</span>
                </Link>
              </div>
              <div style={{ marginTop: 28, padding: 16, background: '#0D0B0A', border: '1px solid #1C1917', borderRadius: 10, fontFamily: 'monospace', fontSize: 12, color: '#78716C', lineHeight: 1.8 }}>
                <span style={{ color: '#3F3B37', fontFamily: 'sans-serif', fontSize: 11 }}>DEMO CREDENTIALS</span><br />
                admin@spicegarden.com · password123<br />
                <span style={{ color: '#3F3B37' }}>super: super@dineai.com · password123</span>
              </div>
              <Link href="/signup" style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>
                Want your own restaurant? Sign up free →
              </Link>
            </div>

            {/* Right — animated chat */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ background: '#0D0B0A', border: '1px solid #1C1917', borderRadius: 16, overflow: 'hidden' }}>
                {/* Chat header */}
                <div style={{ background: '#1C1917', borderBottom: '1px solid #292524', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', animation: 'glowPulse 2s ease-in-out infinite' }} />
                  <span style={{ fontWeight: 700, fontSize: 13 }}>🍛 Spice Garden — Table 4</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#78716C', fontFamily: 'monospace' }}>AI online</span>
                </div>
                <div style={{ padding: '20px 16px', minHeight: 380 }}>
                  <ChatDemo />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ borderTop: '1px solid #1C1917', background: '#080706' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '120px 28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40 }}>
            <h2 style={{ fontSize: 'clamp(36px, 6vw, 88px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1.0, flex: 1 }}>
              Your restaurant.<br />Your AI waiter.<br />
              <span style={{ color: '#F59E0B' }}>Free to start.</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
              <p style={{ fontSize: 15, color: '#78716C', lineHeight: 1.7, maxWidth: 300 }}>
                Set up in under 10 minutes. No credit card. No contracts. Cancel any time.
              </p>
              <Link href="/signup" style={{ display: 'inline-block', background: '#F59E0B', color: '#000', fontWeight: 800, fontSize: 17, padding: '15px 36px', borderRadius: 12 }}>
                Create your restaurant →
              </Link>
              <Link href="/login" style={{ fontSize: 13, color: '#3F3B37' }}>Already have an account? Log in</Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid #1C1917' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="10" cy="10" r="9" stroke="#F59E0B" strokeWidth="1.5"/>
                <circle cx="10" cy="10" r="4" fill="#F59E0B" opacity="0.7"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: 14 }}>DineAI</span>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[['Sign up', '/signup'], ['Login', '/login'], ['Live demo', '/r/spice-garden/t/1']].map(([l, h]) => (
                <Link key={l} href={h} style={{ fontSize: 13, color: '#3F3B37' }}>{l}</Link>
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#292524', fontFamily: 'monospace' }}>BUILT WITH CLAUDE</span>
          </div>
        </footer>

      </div>
    </>
  );
}
