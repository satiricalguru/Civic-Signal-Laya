import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, ArrowUpRight, Check, CircleHelp, Copy, Download, Globe2,
  Layers3, LockKeyhole, Menu, Radio, ScanLine, ShieldCheck,
  SlidersHorizontal, Sun, Moon, X,
} from 'lucide-react';
import './styles.css';
import './theme.css';
import './motion.css';

const examples = [
  {
    id: '01', place: 'Mumbai, India', language: 'Hindi', flag: 'हिं',
    title: 'A water line breaks overnight', sector: 'Water',
    text: 'हमारी गली में कल रात से पानी की मुख्य पाइप फट गई है। लगभग 40 घरों में पीने का पानी नहीं है और सड़क पर पानी भर रहा है। कृपया आज ही मदद भेजें।',
    answers: {
      service: { choice: 'Water', confidence: .93, probabilities: { Water: .93, Housing: .02, Health: .01, Sanitation: .03, Other: .01 } },
      urgency: { choice: 'Immediate', confidence: .79, probabilities: { Routine: .02, Soon: .05, Urgent: .14, Immediate: .79 } },
      access: { choice: 'Yes', confidence: .91, probabilities: { Yes: .91, No: .09 } },
    },
    routing: { model: 'multilingual', reason: 'Devanagari script detected' },
    timestamp: '08:42',
  },
  {
    id: '02', place: 'Medellín, Colombia', language: 'Spanish', flag: 'ES',
    title: 'Medicine access interrupted', sector: 'Health',
    text: 'La farmacia del centro de salud lleva tres días sin insulina. Mi padre la necesita diariamente y no tenemos otra forma de conseguirla. ¿Pueden ayudarnos hoy?',
    answers: {
      service: { choice: 'Health', confidence: .89, probabilities: { Water: .01, Housing: .02, Health: .89, Sanitation: .02, Other: .06 } },
      urgency: { choice: 'Urgent', confidence: .73, probabilities: { Routine: .02, Soon: .12, Urgent: .73, Immediate: .13 } },
      access: { choice: 'Yes', confidence: .86, probabilities: { Yes: .86, No: .14 } },
    },
    routing: { model: 'multilingual', reason: 'Spanish language detected' },
    timestamp: '09:17',
  },
  {
    id: '03', place: 'Bristol, United Kingdom', language: 'English', flag: 'EN',
    title: 'Missed waste collection', sector: 'Sanitation',
    text: 'The bins on our street were not collected this week. The bags are beginning to pile up near the bus stop. Could you let us know when the crew can return?',
    answers: {
      service: { choice: 'Sanitation', confidence: .82, probabilities: { Water: .02, Housing: .01, Health: .03, Sanitation: .82, Other: .12 } },
      urgency: { choice: 'Soon', confidence: .68, probabilities: { Routine: .15, Soon: .68, Urgent: .14, Immediate: .03 } },
      access: { choice: 'No', confidence: .76, probabilities: { Yes: .24, No: .76 } },
    },
    routing: { model: 'english', reason: 'English language detected' },
    timestamp: '10:04',
  },
];

const pct = n => `${Math.round((Number(n) || 0) * 100)}%`;
const getProbabilities = answer => {
  if (!answer) return {};
  const raw = answer.probabilities || answer.distribution || answer.probs || {};
  if (Array.isArray(raw)) return Object.fromEntries(raw.map((v, i) => [String(i), v]));
  return raw;
};
const getConfidence = answer => {
  if (!answer) return 0;
  const probs = getProbabilities(answer);
  const candidate = answer.answer_confidence ?? probs[answer.choice] ?? answer.confidence ?? 0;
  return Math.min(1, Math.max(0, Number(candidate) || 0));
};
const humanize = value => String(value || '—').replaceAll('_', ' ');

function Logo() {
  return <div className="brand" aria-label="Civic Signal home">
    <span className="brand-mark"><span></span><span></span><span></span><span></span></span>
    <span className="brand-name">civic<span className="brand-dot">.</span>signal</span>
    <span className="brand-beta">LAB / 01</span>
  </div>;
}

function SectionLabel({ children, number }) {
  return <div className="section-label"><span>{number}</span><span>{children}</span></div>;
}

function ProbabilityBar({ label, value, selected, index }) {
  return <div className={`probability-row ${selected ? 'selected' : ''}`} style={{ '--row-delay': `${index * 75}ms` }}>
    <div className="probability-name"><span className="probability-dot" />{humanize(label)}</div>
    <div className="bar-track"><span style={{ width: pct(value) }} /></div>
    <strong>{pct(value)}</strong>
  </div>;
}

function exportCard(caseData, result) {
  const canvas = document.createElement('canvas');
  canvas.width = 1600; canvas.height = 900;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0b1724'; ctx.fillRect(0, 0, 1600, 900);
  ctx.fillStyle = '#102a42'; ctx.fillRect(930, -170, 780, 780);
  ctx.strokeStyle = '#416481'; ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(1320, 230, 95 + i * 49, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = '#ef7d61'; ctx.beginPath(); ctx.arc(1315, 231, 55, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#9bd8ff'; ctx.font = '600 27px Arial'; ctx.fillText('CIVIC / SIGNAL', 90, 100);
  ctx.fillStyle = '#9ab0c4'; ctx.font = '22px Arial'; ctx.fillText('A HUMAN-CENTRED DECISION WORKBENCH  ·  BUILT WITH LAYA', 90, 144);
  ctx.fillStyle = '#f2f5f5'; ctx.font = 'italic 94px Georgia'; ctx.fillText('Every request', 86, 326); ctx.fillText('deserves to be heard.', 86, 435);
  ctx.fillStyle = '#bdd0db'; ctx.font = '27px Arial'; ctx.fillText('Multilingual intake. Typed decisions. Human review.', 90, 500);
  ctx.fillStyle = '#22394b'; ctx.fillRect(88, 592, 1424, 222);
  ctx.fillStyle = '#9bd8ff'; ctx.font = '600 18px Arial'; ctx.fillText('CURRENT CASE', 122, 640);
  ctx.fillStyle = '#f2f5f5'; ctx.font = '38px Arial'; ctx.fillText((caseData.title || 'Custom request').slice(0, 54), 122, 704);
  ctx.fillStyle = '#bdd0db'; ctx.font = '24px Arial'; ctx.fillText(`${caseData.language || 'Auto-detected'}  ·  ${caseData.place || 'Local intake'}`, 122, 755);
  ctx.fillStyle = '#a8bfd0'; ctx.font = '600 15px Arial'; ctx.fillText('SERVICE SIGNAL', 1160, 632); ctx.fillText('URGENCY SIGNAL', 1160, 700);
  ctx.fillStyle = '#9bd8ff'; ctx.font = '600 23px Arial'; ctx.fillText((result.answers?.service?.choice || '—').toUpperCase(), 1160, 664);
  ctx.fillText((result.answers?.urgency?.choice || '—').toUpperCase(), 1160, 732);
  ctx.fillStyle = '#a8bdca'; ctx.font = '18px Arial'; ctx.fillText(result.source === 'live' ? 'Live Laya output · validate on your domain before deployment' : 'Illustrative example · validate on your domain before deployment', 90, 858);
  const anchor = document.createElement('a');
  anchor.download = 'civic-signal-story-card.png';
  anchor.href = canvas.toDataURL('image/png');
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function App() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('civic-signal-theme') || 'dark'; } catch { return 'dark'; }
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [text, setText] = useState(examples[0].text);
  const [result, setResult] = useState({ source: 'illustrative', answers: examples[0].answers, routing: examples[0].routing });
  const [threshold, setThreshold] = useState(.80);
  const [tab, setTab] = useState('Workbench');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [apiReady, setApiReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const current = custom ? { title: 'Custom request', place: 'Local intake', language: 'Auto-detected', timestamp: 'Now' } : examples[activeIndex];

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(data => setApiReady(Boolean(data.sdkAvailable))).catch(() => setApiReady(false));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b1724' : '#f5f3ee');
    try { localStorage.setItem('civic-signal-theme', theme); } catch { /* Private browsing can disable storage. */ }
  }, [theme]);

  const service = result?.answers?.service || {};
  const urgency = result?.answers?.urgency || {};
  const access = result?.answers?.access || {};
  const confidence = getConfidence(service);
  const gated = confidence < threshold || getConfidence(urgency) < threshold || getConfidence(access) < threshold;
  const accessFloor = access.choice === 'Yes' && getConfidence(access) >= .80 && !['Immediate', 'Urgent'].includes(urgency.choice);
  const priority = urgency.choice === 'Immediate' ? 'P1 · IMMEDIATE' : urgency.choice === 'Urgent' || accessFloor ? 'P2 · URGENT' : urgency.choice === 'Soon' ? 'P3 · SOON' : 'P4 · ROUTINE';
  const routedModel = humanize(result?.routing?.model || '—');
  const subheading = result?.source === 'live' ? 'Live local inference' : 'Illustrative sample output';
  const wordCount = text.trim() ? text.trim().split(/\s+/u).length : 0;

  function chooseExample(index) {
    setActiveIndex(index); setText(examples[index].text); setResult({ source: 'illustrative', answers: examples[index].answers, routing: examples[index].routing });
    setCustom(false); setError(''); setTab('Workbench');
  }

  function scrollToWorkspace() {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    requestAnimationFrame(() => document.querySelector('.workspace')?.scrollIntoView({ behavior, block: 'start' }));
  }

  function navigateTab(destination) {
    setTab(destination); setMobileOpen(false); scrollToWorkspace();
  }

  function openExample(index) {
    chooseExample(index);
    scrollToWorkspace();
  }

  async function analyze() {
    setError(''); setWorking(true);
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Live inference failed.');
      setResult(payload); setApiReady(true);
    } catch (e) { setError(e.message || 'Live inference is unavailable. Start the local Laya server.'); }
    finally { setWorking(false); }
  }

  async function copySummary() {
    const summary = `Civic Signal / Laya\n${subheading}\nRequest: ${text}\nService: ${service.choice || '—'} (${pct(getConfidence(service))})\nUrgency: ${urgency.choice || '—'} (${pct(getConfidence(urgency))})\nModel route: ${routedModel}\nHuman review: required`;
    try { await navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setError('Clipboard access is unavailable in this browser.'); }
  }

  const nav = ['Workbench', 'Request queue', 'The approach'];
  const tickerItems = ['100+ LANGUAGES', 'TYPED DECISIONS', 'HUMAN IN THE LOOP', 'LOCAL MODEL'];
  const snapshot = useMemo(() => examples.map((item, i) => ({ ...item, highlighted: i === activeIndex && !custom })), [activeIndex, custom]);

  return <div className="site-shell" data-theme={theme}>
    <div className="announcement"><span className="pulse-dot" /> AN EXPERIMENT IN BETTER PUBLIC SERVICE <span className="announcement-arrow">↗</span></div>
    <header className="site-header">
      <Logo />
      <nav className={mobileOpen ? 'nav open' : 'nav'} aria-label="Main navigation">
        {nav.map(item => <button key={item} className={tab === item ? 'nav-item active' : 'nav-item'} onClick={() => navigateTab(item)}>{item}</button>)}
      </nav>
      <div className="header-right"><button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}<span>{theme === 'dark' ? 'LIGHT' : 'DARK'} MODE</span></button><span className="header-status"><span /> {apiReady ? 'LAYA CONNECTED' : 'PREVIEW MODE'}</span><button className="menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button></div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> LAYA-POWERED DECISION INTELLIGENCE <span className="eyebrow-square" /></div>
          <h1>Every request<br />deserves to be <em>heard.</em></h1>
          <p>When someone asks for help, language should never be the barrier. Civic Signal turns multilingual public-service requests into clear, reviewable decisions.</p>
          <div className="hero-actions"><button className="primary-button" onClick={() => navigateTab('Workbench')}>Explore the workbench <ArrowUpRight size={18} /></button><button className="text-button" onClick={() => navigateTab('The approach')}>How it works <ArrowRight size={17} /></button></div>
        </div>
        <div className="hero-visual" aria-label="Stylized civic signal illustration" onPointerMove={e => { const rect = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`); e.currentTarget.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`); }} onPointerLeave={e => { e.currentTarget.style.setProperty('--mx', '50%'); e.currentTarget.style.setProperty('--my', '45%'); }}>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
          <div className="orbit-beacon beacon-one" /><div className="orbit-beacon beacon-two" />
          <div className="orbit-label orbit-label-top"><span className="small-cross">✳</span> CHOOSE A VOICE TO EXPLORE</div>
          <div className="orbit-label orbit-label-bottom">ONE CLEAR PATH <ArrowUpRight size={15} /></div>
          <div className="visual-core"><div className="core-grid"><span /><span /><span /><span /></div><span className="core-caption">A SIGNAL<br />FOR EVERY VOICE</span></div>
          <button type="button" className="float-card float-left" onClick={() => openExample(0)} aria-label="Explore Hindi water request"><span>हिं</span><div><strong>पानी की समस्या</strong><small>Water supply</small></div><ArrowUpRight size={16} /></button>
          <button type="button" className="float-card float-right" onClick={() => openExample(1)} aria-label="Explore Spanish health request"><span>ES</span><div><strong>Acceso a medicina</strong><small>Health services</small></div><ArrowUpRight size={16} /></button>
          <div className="hero-visual-footer"><span>INPUT</span><span className="line-arrow">──────→</span><span>UNDERSTAND</span><span className="line-arrow">──────→</span><span>HUMAN ACTION</span></div>
        </div>
      </section>

      <div className="ticker" aria-hidden="true"><div className="ticker-track">{[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => <React.Fragment key={`${item}-${i}`}><span>{item}</span><i>✳</i></React.Fragment>)}</div></div>

      {tab === 'Workbench' && <section className="workspace" id="workbench">
        <div className="workspace-heading"><div><SectionLabel number="01">THE WORKBENCH</SectionLabel><h2>From a message<br />to a <em>meaningful next step.</em></h2></div><p>See how a single resident request becomes a structured recommendation, with uncertainty visible at every step.</p></div>
        <div className="workspace-grid">
          <div className="input-panel panel">
            <div className="panel-top"><span className="panel-kicker"><span className="panel-number">01</span> RESIDENT INTAKE</span><span className="panel-tag"><Globe2 size={13} /> MULTILINGUAL</span></div>
            <div className="panel-title-row"><div><h3>Start with a voice.</h3><p>Select a real-world scenario or write your own.</p></div><span className="decorative-asterisk">✳</span></div>
            <div className="scenario-list">{examples.map((item, i) => <button key={item.id} className={`scenario ${i === activeIndex && !custom ? 'selected' : ''}`} onClick={() => chooseExample(i)}><span className="scenario-flag">{item.flag}</span><span className="scenario-copy"><strong>{item.title}</strong><small>{item.place} <span>·</span> {item.language}</small></span><ArrowUpRight size={16} /></button>)}</div>
            <div className="input-label-row"><label htmlFor="request-text">THE ORIGINAL REQUEST</label><span>{current.language}</span></div>
            <textarea id="request-text" value={text} onChange={e => { setText(e.target.value); setCustom(true); setResult(null); setError(''); }} placeholder="Paste a resident's request in any language..." spellCheck="false" />
            <div className="input-footer"><span><LockKeyhole size={13} /> Processed locally when Laya is connected</span><span>{wordCount} words</span></div>
            <button className="analyze-button" onClick={analyze} disabled={working || text.trim().length < 12}><span>{working ? 'Analyzing with Laya…' : 'Analyze with Laya'}</span>{working ? <span className="spinner" /> : <ArrowUpRight size={20} />}</button>
            {error && <div className="error-message" role="alert"><CircleHelp size={16} />{error}</div>}
            {!apiReady && <p className="connection-note">Examples are an interactive preview. Start the local API to analyze new text with the model.</p>}
          </div>

          <div className="decision-panel panel" aria-busy={working}>
            <div className="panel-top"><span className="panel-kicker"><span className="panel-number dark">02</span> DECISION CANVAS</span><span className={`result-status ${result?.source === 'live' || working ? 'live' : ''}`}><span />{working ? 'ANALYZING REQUEST' : result ? subheading.toUpperCase() : 'AWAITING ANALYSIS'}</span></div>
            {result ? <div className="decision-content" key={`${result.source}-${activeIndex}-${service.choice}`}>
              <div className="decision-head"><div><span className="micro-label">RECOMMENDED ROUTE</span><h3 aria-live="polite">{humanize(service.choice)}<span className="route-arrow"><ArrowUpRight size={27} /></span></h3><p>A recommendation for a human coordinator to confirm.</p></div><span className="decision-icon"><Layers3 size={29} strokeWidth={1.4} /></span></div>
              <div className="decision-metrics"><div><span>REVIEW PRIORITY</span><strong className="priority-text">{priority}</strong></div><div><span>ROUTE PROBABILITY</span><strong>{pct(confidence)}</strong></div><div><span>MODEL PATH</span><strong>{routedModel}</strong></div></div>
              <div className="distribution"><div className="distribution-header"><div><ScanLine size={17} /><span>SERVICE DISTRIBUTION</span></div><span>FULL MODEL OUTPUT</span></div>{Object.entries(getProbabilities(service)).sort((a,b) => b[1] - a[1]).map(([key,value], index) => <ProbabilityBar key={key} label={key} value={value} selected={key === service.choice} index={index} />)}</div>
              <div className="signal-grid"><div className="signal-box"><span className="signal-icon warm"><Radio size={17} /></span><div><small>URGENCY</small><strong>{humanize(urgency.choice)}</strong><span>{pct(getConfidence(urgency))} answer probability</span></div></div><div className="signal-box"><span className="signal-icon cool"><ShieldCheck size={17} /></span><div><small>ESSENTIAL ACCESS</small><strong>{humanize(access.choice)}</strong><span>{pct(getConfidence(access))} answer probability</span></div></div></div>
              <div className={`review-gate ${gated ? 'attention' : ''}`}><div className="gate-icon">{gated ? <SlidersHorizontal size={19} /> : <Check size={19} />}</div><div><strong>{gated ? 'Additional review flagged' : 'Ready for coordinator review'}</strong><p>{gated ? 'At least one answer falls below the confidence gate. Check the original request before routing.' : 'All answers clear the confidence gate. A coordinator still confirms the final route.'}{accessFloor ? ' Essential-service access raises the review priority to urgent.' : ''}</p></div></div>
              <div className="panel-actions"><button onClick={copySummary}><Copy size={16} />{copied ? 'Copied' : 'Copy decision'}</button><button onClick={() => exportCard(current, result)}><Download size={16} />Export story card</button></div>
            </div> : <div className="empty-state"><div className="empty-symbol">✳</div><h3>Waiting for a signal.</h3><p>Run a request through the local Laya model to see its decision distribution.</p></div>}
            {working && <div className="analysis-overlay" role="status" aria-live="polite"><div className="analysis-radar"><span /><span /><span /><span className="radar-center">✳</span></div><span className="analysis-eyebrow">LOCAL LAYA INFERENCE</span><strong>Finding the clearest path<span className="loading-dots">...</span></strong><p>Evaluating service, urgency, and essential access in one pass.</p><div className="analysis-path"><span>REQUEST</span><span className="path-line" /><span>DECISION</span><span className="path-line" /><span>REVIEW</span></div></div>}
          </div>
        </div>
        <div className="threshold-strip"><div><span className="threshold-icon"><SlidersHorizontal size={18} /></span><div><strong>Set the review gate</strong><p>Flag any answer whose reported probability is below this level.</p></div></div><div className="threshold-control"><input type="range" min="50" max="95" value={Math.round(threshold * 100)} onChange={e => setThreshold(Number(e.target.value) / 100)} aria-label="Review gate threshold" /><strong>{pct(threshold)}</strong></div></div>
        <p className="method-note"><CircleHelp size={15} /> {result?.source === 'live' ? 'Live model output. Probabilities describe model uncertainty; domain accuracy requires separate evaluation.' : 'Example probabilities are illustrative, not measurements from the Laya model. Run the local server for live inference.'}</p>
      </section>}

      {tab === 'Request queue' && <section className="workspace alternate"><div className="workspace-heading"><div><SectionLabel number="02">THE REQUEST QUEUE</SectionLabel><h2>A clearer view<br />of what <em>needs attention.</em></h2></div><p>Illustrative requests show how a coordinator could review incoming needs across languages from one place.</p></div><div className="queue-shell"><div className="queue-top"><div><span className="micro-label">TODAY’S INTAKE</span><h3>Three voices. One shared view.</h3></div><span className="queue-badge">ILLUSTRATIVE DATA</span></div><div className="queue-header"><span>REQUEST</span><span>SERVICE</span><span>PRIORITY</span><span>REVIEW</span><span></span></div>{snapshot.map((item,i) => <button className="queue-row" key={item.id} style={{ '--row-index': i }} onClick={() => openExample(i)}><span className="queue-request"><span className="queue-id">#{item.id}</span><span><strong>{item.title}</strong><small>{item.place} · {item.language} · {item.timestamp}</small></span></span><span>{item.answers.service.choice}</span><span className={item.answers.urgency.choice === 'Immediate' ? 'urgent-label' : ''}>{item.answers.urgency.choice}</span><span className="queue-review">Human review</span><ArrowUpRight size={17} /></button>)}</div><div className="queue-footer-note"><ShieldCheck size={18} /> No automatic dispatch or eligibility decisions. Every route is confirmed by a person.</div></section>}

      {tab === 'The approach' && <section className="workspace alternate"><div className="workspace-heading"><div><SectionLabel number="03">THE APPROACH</SectionLabel><h2>Designed for clarity.<br /><em>Built for trust.</em></h2></div><p>Laya turns natural language into typed decisions in one forward pass. Civic Signal makes those decisions inspectable and reviewable.</p></div><div className="approach-grid"><article><span className="approach-number">01 / UNDERSTAND</span><Globe2 size={31} /><h3>Hear every language.</h3><p>The Laya Router chooses an English or multilingual checkpoint based on the request. The original words remain visible to the reviewer.</p></article><article><span className="approach-number">02 / STRUCTURE</span><Layers3 size={31} /><h3>Make uncertainty visible.</h3><p>Three typed questions produce service, urgency, and essential-access signals, with full option distributions instead of generated prose.</p></article><article><span className="approach-number">03 / ACT</span><ShieldCheck size={31} /><h3>Keep people accountable.</h3><p>Confidence gates highlight uncertain answers. Every case stays in human review, and the model never dispatches services on its own.</p></article></div><div className="approach-callout"><span>THE CORE IDEA</span><p>Technology should make public systems <em>more responsive</em> without making the people inside them invisible.</p><button onClick={() => navigateTab('Workbench')}>Try the workbench <ArrowUpRight size={17} /></button></div></section>}
    </main>

    <footer><div><Logo /><p>A concept for more accessible public service, powered by <a href="https://huggingface.co/convaiinnovations/laya" target="_blank" rel="noreferrer">Laya ↗</a></p></div><div className="footer-right"><span>CONCEPT DEMO · HUMAN REVIEW REQUIRED</span><a href="https://github.com/NandhaKishorM/laya" target="_blank" rel="noreferrer">EXPLORE THE MODEL <ArrowUpRight size={14} /></a></div></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
