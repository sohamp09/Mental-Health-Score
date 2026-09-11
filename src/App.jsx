import { useEffect, useState } from 'react';
import {
  ArrowRight, BarChart3, ChevronDown, Clock3, HeartPulse, History,
  AlertTriangle, BookOpen, Bot, ChevronRight, CircleHelp, Download, ExternalLink, FileText, LockKeyhole, LogIn, MapPin, Menu, MessageCircle, Moon, Phone, Scale, Send, ShieldCheck, Sparkles, Target, Trash2, TrendingUp, Users, X,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:2200';
const initialForm = {
  age: '', gender: '', country: '', academic_level: '', most_used_platform: '',
  purpose_of_use: '', avg_daily_usage_hours: '', daily_unlocks: '', study_hours: '',
  physical_activity_hours: '', sleep_hours_per_night: '', stress_level: '',
};
const fields = [
  ['age', 'Age', 'number', 'e.g. 21'], ['gender', 'Gender', 'select', ['Male', 'Female']],
  ['country', 'Country', 'text', 'e.g. India'], ['academic_level', 'Academic level', 'select', ['High School', 'Undergraduate', 'Graduate']],
  ['most_used_platform', 'Most-used platform', 'select', ['Facebook', 'Instagram', 'Snapchat', 'Twitter', 'YouTube', 'TikTok', 'LinkedIn', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp', 'WeChat']],
  ['purpose_of_use', 'Primary purpose', 'select', ['Networking', 'Education', 'Entertainment', 'News']],
  ['avg_daily_usage_hours', 'Daily screen time', 'number', '0.0'], ['daily_unlocks', 'Phone unlocks', 'number', 'e.g. 60'],
  ['study_hours', 'Study hours / day', 'number', '0.0'], ['physical_activity_hours', 'Movement / day', 'number', '0.0'],
  ['sleep_hours_per_night', 'Sleep / night', 'number', '0.0'],
];

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function getHistoryKey(user) {
  return `mhs-history-${encodeURIComponent(user.email.toLowerCase())}`;
}

function App() {
  const [page, setPage] = useState(window.location.hash.replace('#/', '') || 'home');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('mhs-user') || 'null'));
  const [theme, setTheme] = useState(() => localStorage.getItem('mhs-theme') || 'dark');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: 'bot', text: 'Hi, I’m Signal Guide. Ask me about your check-in, score, habits, or how to get support.' }]);
  useEffect(() => { const onHash = () => setPage(window.location.hash.replace('#/', '') || 'home'); window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash); }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('mhs-theme', theme); }, [theme]);
  const go = (next) => { window.location.hash = `/${next}`; setMobileOpen(false); };
  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');
  const sendChat = async (question) => {
    if (!question.trim()) return;
    const message = question.trim();
    const safetyWords = ['suicide', 'kill myself', 'hurt myself', 'self harm', 'unsafe', 'end my life'];
    if (safetyWords.some((word) => message.toLowerCase().includes(word))) {
      setChatMessages((messages) => [...messages, { role: 'user', text: message }, { role: 'bot', text: 'I’m sorry you’re carrying this. If you may hurt yourself or are in immediate danger, contact local emergency services or a crisis line now. Please tell someone you trust and contact a qualified mental health professional. I can stay with general support, but I cannot provide crisis care.' }]);
      return;
    }
    setChatMessages((messages) => [...messages, { role: 'user', text: message }, { role: 'bot', text: 'Thinking with the wellness knowledge base…', loading: true }]);
    try {
      const response = await fetch(`${API_BASE}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      if (!response.ok) throw new Error('Chat service unavailable');
      const data = await response.json();
      setChatMessages((messages) => [...messages.slice(0, -1), { role: 'bot', text: data.answer }]);
    } catch {
      setChatMessages((messages) => [...messages.slice(0, -1), { role: 'bot', text: 'I could not reach Signal Guide right now. Please try again in a moment.' }]);
    }
  };
  const authenticate = (mode, credentials) => {
    const accounts = JSON.parse(localStorage.getItem('mhs-accounts') || '[]');
    const email = credentials.email.trim().toLowerCase();
    if (!email || !credentials.password || (mode === 'signup' && !credentials.name.trim())) {
      return { error: 'Enter your name, email, and password to continue.' };
    }
    if (mode === 'signup') {
      if (accounts.some((account) => account.email === email)) return { error: 'An account with this email already exists. Sign in instead.' };
      const account = { name: credentials.name.trim(), email, password: credentials.password };
      localStorage.setItem('mhs-accounts', JSON.stringify([...accounts, account]));
      const profile = { name: account.name, email: account.email };
      localStorage.setItem('mhs-user', JSON.stringify(profile)); setUser(profile); go('home');
      return { ok: true };
    }
    const account = accounts.find((item) => item.email === email && item.password === credentials.password);
    if (!account) return { error: 'Email or password does not match an existing account.' };
    const profile = { name: account.name, email: account.email };
    localStorage.setItem('mhs-user', JSON.stringify(profile)); setUser(profile); go('home');
    return { ok: true };
  };
  const logout = () => { localStorage.removeItem('mhs-user'); setUser(null); go('home'); };
  const protectedPage = page === 'dashboard';
  return <div className="app-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="grain" />
    <Header user={user} page={page} go={go} logout={logout} theme={theme} toggleTheme={toggleTheme} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
    {page === 'home' && <Home go={go} user={user} />}
    {page === 'how-it-works' && <HowItWorks go={go} />}
    {page === 'insights' && <Insights go={go} />}
    {page === 'library' && <WellnessLibrary go={go} />}
    {page === 'support' && <Support go={go} />}
    {page === 'about' && <About go={go} />}
    {page === 'auth' && <Auth onLogin={authenticate} />}
    {protectedPage && user && <Dashboard user={user} />}
    {protectedPage && !user && <Auth onLogin={authenticate} />}
    <ChatAssistant open={chatOpen} setOpen={setChatOpen} messages={chatMessages} onSend={sendChat} />
    <footer className="footer"><span>MENTAL HEALTH SIGNAL</span><span className="footer-links"><button onClick={() => go('support')}>Support</button><button onClick={() => go('about')}>About & privacy</button><span>Informational wellness tool · Not a clinical assessment</span></span></footer>
  </div>;
}

function Header({ user, page, go, logout, theme, toggleTheme, mobileOpen, setMobileOpen }) {
  return <header className="topbar"><button className="brand" onClick={() => go('home')}><span className="brand-mark"><HeartPulse size={17} /></span><span>signal<span className="brand-dot">.</span></span></button>
    <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen ? <X /> : <Menu />}</button>
    <nav className={mobileOpen ? 'nav-links open' : 'nav-links'}><button className={page === 'home' ? 'nav-active' : ''} onClick={() => go('home')}>Home</button><button className={page === 'how-it-works' ? 'nav-active' : ''} onClick={() => go('how-it-works')}>How it works</button><button className={page === 'insights' ? 'nav-active' : ''} onClick={() => go('insights')}>Insights</button><button className={page === 'library' ? 'nav-active' : ''} onClick={() => go('library')}>Library</button>{user && <button className={page === 'dashboard' ? 'nav-active' : ''} onClick={() => go('dashboard')}>My signal</button>}<button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? '☼' : '◐'}</button>{user ? <button className="profile-chip" onClick={logout}><span>{user.name[0]}</span> Sign out</button> : <button className="nav-login" onClick={() => go('auth')}><LogIn size={15} /> Sign in</button>}</nav>
  </header>;
}

function Home({ go, user }) {
  const startCheckIn = () => go(user ? 'dashboard' : 'auth');
  return <main><section className="hero page-width"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> PRIVATE · REFLECTIVE · YOURS</div><h1>Make space for<br /><em>what you feel.</em></h1><p className="hero-text">A quiet, data-informed check-in for the rhythms behind your wellbeing. Understand your habits, notice your patterns, and take the next small step.</p><div className="hero-actions"><button className="button button-primary" onClick={startCheckIn}>Start your check-in <ArrowRight size={17} /></button><button className="text-button" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>See how it works <ChevronDown size={16} /></button></div><div className="trust-row"><ShieldCheck size={16} /><span>Check-ins stay in this browser; predictions use the configured API.</span></div></div><div className="hero-art"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="hero-orb"><HeartPulse size={54} strokeWidth={1.2} /><span>your signal</span></div><div className="float-card card-top"><span className="mini-label">TODAY'S RHYTHM</span><strong>Balanced</strong><span className="trend">↗ 12% steadier</span></div><div className="float-card card-bottom"><Moon size={17} /><span><b>7.8h</b><small>sleep last night</small></span></div></div></section>
    <section className="stats-strip page-width"><div><strong>01</strong><span>thoughtful check-in</span></div><div><strong>12</strong><span>signals we look at</span></div><div><strong>10</strong><span>point wellbeing scale</span></div><div><strong>∞</strong><span>room to reset</span></div></section>
    <section className="how-section page-width" id="how-it-works"><div className="section-kicker">A softer way to reflect</div><h2>Small inputs.<br /><em>A clearer picture.</em></h2><div className="feature-grid"><Feature icon={<Target />} number="01" title="Check in honestly" copy="Share a few details about your day-to-day rhythm, with no right answers." /><Feature icon={<BarChart3 />} number="02" title="See your signal" copy="Our model turns your habits into a simple, readable wellbeing score." /><Feature icon={<Sparkles />} number="03" title="Choose one next step" copy="Use the reflection as a starting point for a more supported week." /></div></section>
    <section className="cta-band page-width"><div><span className="section-kicker">Ready when you are</span><h2>Your wellbeing deserves<br /><em>your attention.</em></h2></div><button className="button button-light" onClick={() => go('auth')}>Begin privately <ArrowRight size={17} /></button></section>
  </main>;
}
function Feature({ icon, number, title, copy }) { return <article className="feature"><div className="feature-icon">{icon}</div><span className="feature-number">{number}</span><h3>{title}</h3><p>{copy}</p></article>; }

function PublicHero({ kicker, title, emphasis, copy, icon }) {
  return <section className="public-hero page-width"><div><div className="eyebrow"><span className="eyebrow-dot" /> {kicker}</div><h1>{title}<br /><em>{emphasis}</em></h1><p>{copy}</p></div><div className="public-hero-mark">{icon}</div></section>;
}

function PublicPage({ children, className = '' }) { return <main className={`public-page page-width ${className}`}>{children}</main>; }

function HowItWorks({ go }) {
  const steps = [
    ['01', 'Set aside a minute', 'Choose a quiet moment and answer questions about your current routine. There are no right answers and no performance to optimize.'],
    ['02', 'Read your signal', 'The model turns your inputs into a score from 0 to 10, with the habits that most shaped the reflection shown beside it.'],
    ['03', 'Pick one small action', 'Your action plan keeps the next step practical: protect sleep, create an offline pocket, move gently, or share the load.'],
  ];
  return <><PublicHero kicker="A clear path in three minutes" title="Notice more." emphasis="Carry less." copy="Signal turns a handful of everyday inputs into a private moment of reflection you can actually use." icon={<Target size={70} strokeWidth={1} />} /><PublicPage className="how-page"><div className="numbered-steps">{steps.map(([number, title, copy]) => <article className="numbered-step" key={number}><span>{number}</span><div><h2>{title}</h2><p>{copy}</p></div><ChevronRight /></article>)}</div><section className="split-section"><div><span className="section-kicker">What the score is</span><h2>A prompt for attention,<br /><em>not a label.</em></h2></div><div><p>The signal is a snapshot of the habits you entered. It can help you notice a pattern, start a conversation, or decide what support might help next.</p><p className="muted-note">It is not a clinical assessment, diagnosis, or substitute for professional care.</p></div></section><CallToAction go={go} /></PublicPage></>;
}

function Insights({ go }) {
  const [modelInfo, setModelInfo] = useState(null);
  const [modelInfoError, setModelInfoError] = useState(false);
  useEffect(() => { fetch(`${API_BASE}/model-info`).then((response) => response.ok ? response.json() : Promise.reject(new Error('unavailable'))).then(setModelInfo).catch(() => setModelInfoError(true)); }, []);
  const bars = [['Sleep', 82, '7+ hours supports steadier days'], ['Movement', 56, 'Small bursts still count'], ['Screen time', 68, 'Notice what happens after long sessions'], ['Stress', 44, 'Naming it is useful data']];
  return <><PublicHero kicker="Patterns worth noticing" title="The day leaves" emphasis="clues behind." copy="Explore the signals behind the check-in and see how small routines can shape the way a week feels." icon={<BarChart3 size={70} strokeWidth={1} />} /><PublicPage className="insights-page"><section className="insight-intro"><div><span className="section-kicker">A simple model</span><h2>Four everyday<br /><em>signals.</em></h2></div><p>Wellbeing is not one number. The check-in brings together sleep, movement, social media exposure, study rhythm, and perceived stress so you can see the whole day more clearly.</p></section>{modelInfo && <section className="insight-board glass-panel model-performance"><div className="panel-heading compact"><div><span className="section-kicker">SERVED MODEL · HELD-OUT TEST</span><h2>How reliable is the reflection?</h2></div><BarChart3 size={18} /></div><div className="model-metrics"><div><strong>{(modelInfo.metrics.r2 * 100).toFixed(1)}%</strong><span>R² explained variance</span></div><div><strong>{modelInfo.metrics.mae.toFixed(2)}</strong><span>average error / 10</span></div><div><strong>{modelInfo.metrics.test_rows.toLocaleString()}</strong><span>unseen test rows</span></div></div><p className="muted-note">Evaluated {modelInfo.evaluated_at}. These results describe this dataset split, not clinical accuracy. R² is the appropriate regression measure; lower MAE is better.</p></section>}{modelInfoError && <p className="model-status">Live model metrics are unavailable while the API is offline.</p>}<section className="insight-board glass-panel"><div className="panel-heading compact"><div><span className="section-kicker">EXAMPLE PATTERN</span><h2>What a balanced week can look like</h2></div><Scale size={18} /></div><div className="insight-bars">{bars.map(([label, value, note]) => <div className="insight-bar" key={label}><div><span>{label}</span><strong>{value}%</strong></div><i><b style={{ width: `${value}%` }} /></i><small>{note}</small></div>)}</div></section><div className="insight-cards"><InsightCard icon={<Moon />} title="Sleep is a rhythm" copy="Consistency matters as much as the number of hours. A repeatable wind-down can be a useful experiment." /><InsightCard icon={<Users />} title="Connection is context" copy="Social platforms can support community and also consume attention. The useful question is how they leave you feeling." /><InsightCard icon={<Sparkles />} title="Progress stays small" copy="One repeatable change is easier to learn from than a perfect plan that lasts two days." /></div><CallToAction go={go} /></PublicPage></>;
}

function InsightCard({ icon, title, copy }) { return <article className="insight-card"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{copy}</p></article>; }

function WellnessLibrary({ go }) {
  const articles = [
    ['SLEEP', 'Build a softer landing', 'Try a 20-minute screen-free buffer before bed. Make the first step easy enough to repeat.', <Moon />],
    ['SCREEN TIME', 'Make room for offline time', 'Choose one daily pocket without social apps. Put the phone somewhere visible but out of reach.', <Clock3 />],
    ['STRESS', 'Name the load', 'Write down what feels heavy, then separate what needs action from what needs support.', <HeartPulse />],
    ['MOVEMENT', 'Start with five minutes', 'A walk, stretch, or change of room can be a legitimate reset. The goal is to interrupt stillness.', <TrendingUp />],
    ['STUDY', 'Protect your attention', 'Work in a short focused block, then take a real break instead of switching to another feed.', <BookOpen />],
    ['CONNECTION', 'Reach out earlier', 'A simple message to someone safe can make support more available before a hard day becomes overwhelming.', <MessageCircle />],
  ];
  return <><PublicHero kicker="Practical, gentle guidance" title="A library for" emphasis="the in-between." copy="Short reflections and experiments for the days when you want support that feels possible, not perfect." icon={<BookOpen size={70} strokeWidth={1} />} /><PublicPage className="library-page"><div className="library-toolbar"><span className="section-kicker">SIX STARTING POINTS</span><span className="library-count">Read one. Try one. Notice what changes.</span></div><div className="library-grid">{articles.map(([label, title, copy, icon]) => <article className="library-card" key={title}><div className="library-card-top"><span className="mini-label">{label}</span><span className="library-icon">{icon}</span></div><h2>{title}</h2><p>{copy}</p><button className="text-button" onClick={() => go('support')}>Find support <ArrowRight size={15} /></button></article>)}</div><CallToAction go={go} /></PublicPage></>;
}

function Support({ go }) {
  return <><PublicHero kicker="You do not have to hold it alone" title="Support is a" emphasis="next step." copy="Use the options below when you need a person, a professional, or immediate help. Signal Guide can offer general information, but it cannot provide crisis care." icon={<ShieldCheck size={70} strokeWidth={1} />} /><PublicPage className="support-page"><div className="support-alert"><Phone size={20} /><div><strong>Immediate danger?</strong><p>Contact your local emergency service now, or go to the nearest emergency department. Tell someone you trust and stay with them if you can.</p></div></div><div className="support-grid"><ResourceCard icon={<Users />} title="Talk to someone you trust" copy="A friend, family member, teacher, or resident advisor can help you feel less alone and connect you with more support." action="Start a conversation" /><ResourceCard icon={<CircleHelp />} title="Find professional care" copy="A qualified mental health professional can help with persistent stress, anxiety, low mood, or changes that are affecting daily life." action="Find a professional" href="https://www.psychologytoday.com/intl/counsellors" /><ResourceCard icon={<MapPin />} title="Find local resources" copy="Crisis lines and healthcare options vary by country. Find verified local phone and text services through a global directory." action="Check local resources" href="https://findahelpline.com/" /></div><section className="support-note"><LockKeyhole size={18} /><div><h2>Private by design</h2><p>This demo stores accounts and reads in this browser. Check-in data is sent to the configured prediction API; chat questions may be sent to Mistral when enabled.</p></div></section><CallToAction go={go} /></PublicPage></>;
}

function ResourceCard({ icon, title, copy, action, href }) { return <article className="resource-card"><div className="feature-icon">{icon}</div><h2>{title}</h2><p>{copy}</p>{href ? <a className="text-button" href={href} target="_blank" rel="noreferrer">{action} <ExternalLink size={14} /></a> : <span className="resource-action">{action}</span>}</article>; }

function About({ go }) {
  return <><PublicHero kicker="Understand the tool" title="Useful context" emphasis="builds trust." copy="Signal is a student wellbeing project designed to make reflection easier, clearer, and more actionable." icon={<LockKeyhole size={70} strokeWidth={1} />} /><PublicPage className="about-page"><div className="about-grid"><section><span className="section-kicker">THE PROMISE</span><h2>More noticing.<br /><em>Less guessing.</em></h2><p>Signal combines a lightweight machine-learning model with grounded wellness guidance. It is designed to help you ask better questions about your routine, not to decide how you are doing for you.</p></section><section className="about-facts"><Fact icon={<ShieldCheck />} title="Private in this demo" copy="Accounts and reads are stored locally in your browser." /><Fact icon={<Scale />} title="Informational only" copy="A score is not a diagnosis or clinical assessment." /><Fact icon={<FileText />} title="Transparent model" copy="The included ML report explains the project data and approach." /></section></div><section className="privacy-band"><div><span className="section-kicker">PRIVACY CENTER</span><h2>Your data, your control.</h2><p>Export your reads from the dashboard, delete them when you are finished, and do not enter information you would not want stored on this device.</p></div><a className="privacy-report" href="/Mental_Health_Signal_ML_Report.pdf" download><FileText size={14} /> Read the ML report</a></section><CallToAction go={go} /></PublicPage></>;
}

function Fact({ icon, title, copy }) { return <div className="fact"><span>{icon}</span><div><h3>{title}</h3><p>{copy}</p></div></div>; }
function CallToAction({ go }) { return <section className="page-cta"><div><span className="section-kicker">A moment for yourself</span><h2>Start with what<br /><em>you know today.</em></h2></div><button className="button button-primary" onClick={() => go('auth')}>Start your check-in <ArrowRight size={17} /></button></section>; }

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login'); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
  const submit = (event) => { event.preventDefault(); setError(''); const result = onLogin(mode, { name, email, password }); if (result?.error) setError(result.error); };
  return <main className="auth-page page-width"><div className="auth-aside"><div className="eyebrow"><span className="eyebrow-dot" /> YOUR PRIVATE SPACE</div><h1>A better check-in<br /><em>starts here.</em></h1><p>Build a clearer relationship with the patterns that shape your days.</p><div className="auth-quote"><span>“</span><p>Clarity begins when we give ourselves a moment to notice.</p></div></div><form className="auth-card" onSubmit={submit}><div className="auth-tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); }}>Create account</button></div><h2>{mode === 'login' ? 'Welcome back.' : 'Make it yours.'}</h2><p className="auth-sub">{mode === 'login' ? 'Use the same email and password you registered with.' : 'Demo only: credentials are stored locally on this device.'}</p>{mode === 'signup' && <label>What should we call you?<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" autoComplete="name" /></label>}<label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>{error && <div className="auth-error" role="alert">{error}</div>}<button type="submit" className="button button-primary full">{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button><div className="auth-note"><ShieldCheck size={15} /> Never use a real password in this demo</div></form></main>;
}

function ChatAssistant({ open, setOpen, messages, onSend }) {
  const [draft, setDraft] = useState('');
  const submit = (event) => { event.preventDefault(); onSend(draft); setDraft(''); };
  const suggestions = ['What does my score mean?', 'How can I start a check-in?', 'Is my data private?'];
  return <>
    {open && <section className="chat-panel" aria-label="Signal Guide chat">
      <div className="chat-head"><div className="chat-title"><span className="chat-avatar"><Bot size={18} /></span><span><strong>Signal Guide</strong><small>Wellness assistant · online</small></span></div><button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat"><X size={17} /></button></div>
      <div className="chat-messages">{messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.text}</span></div>)}</div>
      {messages.length === 1 && <div className="chat-suggestions">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => onSend(suggestion)}>{suggestion}</button>)}</div>}
      <form className="chat-input" onSubmit={submit}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask Signal Guide..." aria-label="Ask Signal Guide" /><button type="submit" aria-label="Send question"><Send size={16} /></button></form>
      <p className="chat-disclaimer">Reflective guidance only. Not medical advice.</p>
    </section>}
    {!open && <button className="chat-launcher" onClick={() => setOpen(true)} aria-label="Open Signal Guide chat"><MessageCircle size={21} /><span>Ask Signal Guide</span></button>}
  </>;
}

function Dashboard({ user }) {
  const storageKey = getHistoryKey(user); const [form, setForm] = useState(initialForm); const [status, setStatus] = useState('idle'); const [score, setScore] = useState(null); const [error, setError] = useState(''); const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem(storageKey) || '[]'));
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => { event.preventDefault(); setError(''); const missing = [...fields.map(([key]) => key), 'stress_level'].filter((key) => !form[key]); if (missing.length) { setError('Complete each field to create your signal.'); return; } const numericKeys = ['age', 'avg_daily_usage_hours', 'daily_unlocks', 'study_hours', 'physical_activity_hours', 'sleep_hours_per_night']; const numericValues = numericKeys.map((key) => Number(form[key])); const hourValues = ['avg_daily_usage_hours', 'study_hours', 'physical_activity_hours', 'sleep_hours_per_night'].map((key) => Number(form[key])); if (numericValues.some((value) => !Number.isFinite(value) || value < 0) || Number(form.age) < 10 || Number(form.age) > 100 || hourValues.some((value) => value > 24)) { setError('Check your values: age must be 10–100 and hours must be between 0 and 24.'); return; } setStatus('loading'); try { const payload = { ...form, age: Number(form.age), avg_daily_usage_hours: Number(form.avg_daily_usage_hours), daily_unlocks: Number(form.daily_unlocks), study_hours: Number(form.study_hours), physical_activity_hours: Number(form.physical_activity_hours), sleep_hours_per_night: Number(form.sleep_hours_per_night) }; const response = await fetch(`${API_BASE}/predict`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!response.ok) throw new Error('The prediction service is unavailable right now.'); const data = await response.json(); const entry = { score: data.predicted_mental_health_score, form: payload, date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), id: Date.now() }; setScore(entry.score); setHistory((current) => { const next = [entry, ...current].slice(0, 8); localStorage.setItem(storageKey, JSON.stringify(next)); return next; }); setStatus('result'); } catch (caught) { setError(caught.message); setStatus('error'); } };
  const clearData = () => { localStorage.removeItem(storageKey); setHistory([]); setScore(null); setStatus('idle'); };
  return <main className="dashboard page-width"><div className="dashboard-head"><div><div className="eyebrow"><span className="eyebrow-dot" /> PERSONAL DASHBOARD</div><h1>{getTimeGreeting()}, <em>{user.name.split(' ')[0]}.</em></h1><p>A few honest answers can reveal a useful pattern.</p></div><div className="date-pill"><Clock3 size={15} /> {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div></div><div className="dashboard-grid"><form className="checkin-panel glass-panel" onSubmit={submit}><div className="panel-heading"><div><span className="section-kicker">01 — 03</span><h2>Your daily rhythm</h2></div><span className="step-count">{Object.values(form).filter(Boolean).length}/12 complete</span></div><div className="form-grid">{fields.map(([key, label, type, options]) => <Field key={key} name={key} label={label} type={type} options={options} value={form[key]} onChange={update} />)}</div><div className="stress-field"><label>Perceived stress level</label><div className="stress-options">{['Low', 'Medium', 'High', 'Very High'].map((value) => <button type="button" className={form.stress_level === value ? `stress active ${value.replace(' ', '-').toLowerCase()}` : 'stress'} key={value} onClick={() => update('stress_level', value)}>{value}</button>)}</div></div>{error && <div className="form-error">{error}</div>}<button className="button button-primary submit" disabled={status === 'loading'}>{status === 'loading' ? 'Reading your signal…' : <>Read my signal <ArrowRight size={17} /></>}</button></form><aside className="signal-column"><SignalCard status={status} score={score} form={form} reset={() => { setStatus('idle'); setScore(null); }} /><HistoryCard history={history} /><PrivacyCard history={history} clearData={clearData} /></aside></div><ActionPlan score={score} form={form} /><TimelineCard history={history} /><div className="dashboard-note"><AlertTriangle size={15} /> Your signal supports reflection. It does not replace professional mental health care.</div></main>;
  return <main className="dashboard page-width"><div className="dashboard-head"><div><div className="eyebrow"><span className="eyebrow-dot" /> PERSONAL DASHBOARD</div><h1>{getTimeGreeting()}, <em>{user.name.split(' ')[0]}.</em></h1><p>A few honest answers can reveal a useful pattern.</p></div><div className="date-pill"><Clock3 size={15} /> {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div></div><div className="dashboard-grid"><form className="checkin-panel glass-panel" onSubmit={submit}><div className="panel-heading"><div><span className="section-kicker">01 — 03</span><h2>Your daily rhythm</h2></div><span className="step-count">{Object.values(form).filter(Boolean).length}/12 complete</span></div><div className="form-grid">{fields.map(([key, label, type, options]) => <Field key={key} name={key} label={label} type={type} options={options} value={form[key]} onChange={update} />)}</div><div className="stress-field"><label>Perceived stress level</label><div className="stress-options">{['Low', 'Medium', 'High', 'Very High'].map((value) => <button type="button" className={form.stress_level === value ? `stress active ${value.replace(' ', '-').toLowerCase()}` : 'stress'} key={value} onClick={() => update('stress_level', value)}>{value}</button>)}</div></div>{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-primary submit" disabled={status === 'loading'}>{status === 'loading' ? 'Reading your signal…' : <>Read my signal <ArrowRight size={17} /></>}</button></form><aside className="signal-column"><SignalCard status={status} score={score} form={form} reset={() => { setStatus('idle'); setScore(null); }} /><HistoryCard history={history} /><PrivacyCard history={history} clearData={clearData} /></aside></div><ActionPlan score={score} form={form} /><TimelineCard history={history} /><div className="dashboard-note"><AlertTriangle size={15} /> Your signal supports reflection. It does not replace professional care or emergency support.</div></main>;
}
function Field({ name, label, type, options, value, onChange }) { return <label className="field">{label}{type === 'select' ? <select value={value} onChange={(e) => onChange(name, e.target.value)}><option value="">Select</option>{options.map((option) => <option key={option}>{option}</option>)}</select> : <input type={type} value={value} placeholder={options} min={type === 'number' ? 0 : undefined} onChange={(e) => onChange(name, e.target.value)} />}</label>; }
function SignalCard({ status, score, form, reset }) { const [showAdvice, setShowAdvice] = useState(false); const value = score ?? 0; const label = score == null ? 'Your score is waiting' : score < 4 ? 'A little strained' : score < 7 ? 'Looking balanced' : 'Strong foundation'; const reasons = score == null ? [] : [{ label: 'Sleep rhythm', value: `${form.sleep_hours_per_night || 0}h`, note: Number(form.sleep_hours_per_night) >= 7 ? 'supportive' : 'room to improve' }, { label: 'Daily screen time', value: `${form.avg_daily_usage_hours || 0}h`, note: Number(form.avg_daily_usage_hours) <= 5 ? 'balanced' : 'high exposure' }, { label: 'Stress reported', value: form.stress_level || '—', note: 'self-reported' }]; const advice = []; if (Number(form.sleep_hours_per_night) < 7) advice.push('Aim for a regular sleep window and protect a screen-free pause before bed.'); if (Number(form.avg_daily_usage_hours) > 5) advice.push('Try one 30-minute offline period and reduce notifications during study or rest.'); if (Number(form.physical_activity_hours) < 1) advice.push('Add a short walk, stretch, or movement break today.'); if (form.stress_level === 'High' || form.stress_level === 'Very High') advice.push('Share the pressure with someone you trust or a qualified professional.'); if (!advice.length) advice.push('Keep your current rhythm steady and change only one habit at a time.'); return <section className="signal-card glass-panel"><div className="signal-card-top"><span className="section-kicker">YOUR SIGNAL</span><span className="live-dot">● LIVE</span></div>{status === 'loading' ? <div className="signal-loading"><div className="loader-ring" /><h3>Reading your rhythm…</h3><p>Connecting the dots in your check-in.</p></div> : status === 'error' ? <div className="signal-error"><X size={26} /><h3>Couldn’t read that yet.</h3><p>Check your connection and try again.</p></div> : <><div className="score-ring" style={{ '--score': `${value * 10}%` }}><div><strong>{score == null ? '—' : value.toFixed(1)}</strong><span>/10</span></div></div><h3 className={score == null ? '' : 'mint'}>{label}</h3><p>{score == null ? 'Complete the check-in to see a reflection of your current habits.' : 'A reflection of today’s inputs, not a diagnosis.'}</p>{reasons.map((reason) => <div className="reason-row" key={reason.label}><span>{reason.label}</span><strong>{reason.value}</strong><small>{reason.note}</small></div>)}{score != null && <><button className="advice-toggle" onClick={() => setShowAdvice((visible) => !visible)} aria-expanded={showAdvice}>{showAdvice ? 'Hide ways to improve' : 'How can I increase my score?'} <ChevronDown size={14} className={showAdvice ? 'advice-open' : ''} /></button>{showAdvice && <div className="signal-advice"><strong>Small steps for your next check-in</strong>{advice.map((item) => <p key={item}><ChevronRight size={13} />{item}</p>)}<small>The score is a reflection, not a diagnosis. Focus on sustainable habits rather than chasing a number.</small></div>}<button className="text-button" onClick={reset}>Run another check-in <ArrowRight size={15} /></button></>}</>}</section>; }
function HistoryCard({ history }) { return <section className="history-card glass-panel"><div className="panel-heading compact"><div><span className="section-kicker">RECENT READS</span><h2>Your rhythm over time</h2></div><History size={18} /></div>{history.length ? history.map((item) => <div className="history-row" key={item.id}><span className="history-date">{item.date}</span><span className="history-line"><i style={{ width: `${item.score * 10}%` }} /></span><strong>{item.score.toFixed(1)}</strong></div>) : <div className="empty-history"><BarChart3 size={19} /><span>Your first read will appear here.</span></div>}</section>; }
function TimelineCard({ history }) { return <section className="timeline-card glass-panel"><div className="panel-heading compact"><div><span className="section-kicker">WELLNESS TIMELINE</span><h2>Your signal over time</h2></div><TrendingUp size={18} /></div>{history.length > 1 ? <div className="timeline-chart">{history.slice().reverse().map((item) => <div className="timeline-point" key={item.id}><span style={{ height: `${Math.max(18, item.score * 10)}%` }}><b>{item.score.toFixed(1)}</b></span><small>{item.date}</small></div>)}</div> : <div className="empty-history"><TrendingUp size={19} /><span>Complete another check-in to reveal your trend.</span></div>}</section>; }
function ActionPlan({ score, form }) { if (score == null) return null; const actions = []; if (Number(form.sleep_hours_per_night) < 7) actions.push(['Protect your sleep window', 'Try a consistent bedtime and a screen-free pause before sleep.']); if (Number(form.avg_daily_usage_hours) > 5) actions.push(['Create one offline pocket', 'Choose a 30-minute period today without social apps or notifications.']); if (Number(form.physical_activity_hours) < 1) actions.push(['Add gentle movement', 'A short walk or stretch break can be a realistic first step.']); if (form.stress_level === 'High' || form.stress_level === 'Very High') actions.push(['Share the load', 'Talk with someone you trust or a qualified professional about what feels heavy.']); if (!actions.length) actions.push(['Keep your steady rhythm', 'Choose one supportive habit to repeat this week and notice how it feels.']); return <section className="action-plan glass-panel"><div className="panel-heading compact"><div><span className="section-kicker">YOUR NEXT STEPS</span><h2>A small plan for this week</h2></div><Sparkles size={18} /></div><div className="action-grid">{actions.slice(0, 3).map(([title, copy], index) => <article className="action-card" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>; }
function PrivacyCard({ history, clearData }) { const exportData = () => { const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), reads: history }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'mental-health-signal-data.json'; link.click(); URL.revokeObjectURL(url); }; return <section className="privacy-card glass-panel"><div><span className="section-kicker">PRIVACY CENTER</span><h2>Your data, your control</h2><p>Reads stay in this browser for this demo.</p></div><div className="privacy-actions"><button onClick={exportData}><Download size={14} /> Export</button><a className="privacy-report" href="/Mental_Health_Signal_ML_Report.pdf" download><FileText size={14} /> ML report</a><button onClick={clearData}><Trash2 size={14} /> Delete reads</button></div></section>; }

export default App;
