// small inline scripts moved from HTML to support strict CSP
window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
(function(){
    const host = location.hostname;
    if (host.endsWith('.vercel.app') || host === 'nightclub-indol.vercel.app' || host === 'your-production-domain.com') {
        const s = document.createElement('script');
        s.src = '/_vercel/speed-insights/script.js';
        s.defer = true;
        s.crossOrigin = 'anonymous';
        document.head.appendChild(s);
    }
})();

const INVITE = "https://discord.gg/aPKREfAP3J";
const GUILD_ID = "1383549875010146505";

// === i18n: Basic internationalization strings (extend as needed) ===
const i18n = {
  en: {
    joinServer: 'Join Server',
    loadingMembers: 'Loading…',
    online: 'online',
    noMemberList: 'online (no member list available)',
    loadingFailed: 'Unable to load live members (running in static preview or API blocked)',
    copiedUsername: 'Copied {username} - ready to add as friend!',
    copiedInvite: 'Copied invite!',
    refreshTheme: 'Dark / Light',
    adminPreview: 'Admin Preview Mode',
    previewMode: 'Preview: member list for demo (admin token may be required)',
  },
  ar: {
    joinServer: 'انضم للسيرفر',
    loadingMembers: 'جاري التحميل…',
    online: 'أونلاين',
    noMemberList: 'أونلاين (لا توجد قائمة أعضاء)',
    loadingFailed: 'لم يتم تحميل الأعضاء',
    copiedUsername: 'تم نسخ {username} - جاهز للإضافة كصديق!',
    copiedInvite: 'تم نسخ الرابط!',
    refreshTheme: 'الوضع الليلي / النهاري',
    adminPreview: 'وضع المعاين (إدارة)',
    previewMode: 'معاينة: قائمة الأعضاء للتجربة',
  }
};
const currentLang = localStorage.getItem('lang') || 'en';
function t(key, vars = {}) {
  const text = (i18n[currentLang] || i18n.en)[key] || key;
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, v), text);
}

// === Theme Toggle: Dark/Light Mode ===
const themeToggle = document.getElementById('themeToggle');
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if(themeToggle) themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}
if(themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
  });
}
initTheme();

// === Progressive Enhancement: Deep-linking, OAuth, Admin Preview ===
window.progressiveEnhancement = {
  parseQueryParams() {
    const params = new URLSearchParams(location.search);
    return {
      invite: params.get('invite') || INVITE,
      previewMode: params.has('preview') || params.has('admin'),
      adminToken: params.get('token'),
      lang: params.get('lang') || currentLang,
    };
  },
  handleDeepLink() {
    const { invite, previewMode } = this.parseQueryParams();
    if(invite && isAllowedUrl(invite)) {
      const inviteInput = document.getElementById('inviteInput');
      if(inviteInput) inviteInput.value = invite;
      window.INVITE_OVERRIDE = invite;
    }
    if(previewMode) {
      console.log('🔍 Admin preview mode enabled');
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:rgba(138,43,226,0.9);color:#fff;padding:8px;text-align:center;z-index:99998;font-size:12px;';
      banner.textContent = t('previewMode');
      document.body.appendChild(banner);
    }
  },
  generateOAuthLink() {
    // OAuth Setup: Client ID configured; redirect URI matches Vercel deployment
    const CLIENT_ID = '1470233920095125656'; // Discord app ID for night club
    // Use the production Vercel URL for redirect
    const REDIRECT_URI = encodeURIComponent('https://nightclub-indol.vercel.app/oauth-callback');
    return `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify%20guilds.join`;
  },
};
window.progressiveEnhancement.handleDeepLink();

// === Client-side Rate Limiting: Throttle API calls ===
const apiThrottle = new Map();
function isApiThrottled(endpoint) {
  const last = apiThrottle.get(endpoint) || 0;
  const now = Date.now();
  if(now - last < 3000) return true;
  apiThrottle.set(endpoint, now);
  return false;
}

const joinBtn = document.getElementById('joinBtn');
const openInvite = document.getElementById('openInvite');
const copyInvite = document.getElementById('copyInvite');
const inviteInput = document.getElementById('inviteInput');

if(inviteInput) inviteInput.value = window.INVITE_OVERRIDE || INVITE;

function isAllowedUrl(u){
    try{
        const url = new URL(u);
        const allowedHosts = ['discord.gg','discord.com','www.discord.com'];
        return (url.protocol === 'https:' && (allowedHosts.includes(url.hostname) || allowedHosts.some(h => url.hostname.endsWith(h))));
    }catch(e){
        return false;
    }
}

function sanitizeInput(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('out');
        setTimeout(() => {
            notification.remove();
        }, 400);
    }, 2500);
}

function openLink(){
    // Redirect to Discord OAuth instead of opening invite in new window
    try {
        const oauthUrl = window.progressiveEnhancement.generateOAuthLink();
        window.location.href = oauthUrl;
    } catch(e) {
        console.error('Failed to generate OAuth link:', e);
        // Fallback: open invite link
        if(!isAllowedUrl(INVITE)){
            console.warn('Blocked opening an untrusted invite URL', INVITE);
            alert('Invalid Discord invite URL');
            return;
        }
        try {
            const newWin = window.open(INVITE, '_blank');
            if(newWin) newWin.opener = null;
        } catch(e) {
            console.error('Failed to open link:', e);
            alert('Unable to open Discord invite');
        }
    }
}

async function copyToClipboard(text){
    try {
        await navigator.clipboard.writeText(text);
        if(copyInvite) {
            copyInvite.textContent = "Copied!";
            copyInvite.setAttribute('aria-label', 'Invite copied to clipboard');
            setTimeout(()=> {
                copyInvite.textContent = "Copy";
                copyInvite.setAttribute('aria-label', 'Copy invite to clipboard');
            }, 1600);
        }
    } catch (e) {
        try {
            if(inviteInput){
                inviteInput.select();
                document.execCommand('copy');
            }
            if(copyInvite){
                copyInvite.textContent = "Copied!";
                copyInvite.setAttribute('aria-label', 'Invite copied to clipboard');
                setTimeout(()=> {
                    copyInvite.textContent = "Copy";
                    copyInvite.setAttribute('aria-label', 'Copy invite to clipboard');
                }, 1600);
            }
        } catch (fallbackErr) {
            console.error('Copy failed:', fallbackErr);
            alert('Unable to copy invite to clipboard');
        }
    }
}

if(copyInvite) copyInvite.addEventListener('click', ()=> copyToClipboard(INVITE));

if(inviteInput) inviteInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') openLink();
});

// small visual pulse when user clicks join/open
function animateJoinEffect(btn){
    if(!btn) return;
    try{
        const pulse = document.createElement('span');
        pulse.className = 'join-pulse';
        pulse.style.background = 'radial-gradient(circle at 30% 30%, rgba(138,43,226,0.24), transparent 40%)';
        btn.style.position = btn.style.position || 'relative';
        btn.appendChild(pulse);
        pulse.animate([
            { opacity: 1, transform: 'scale(0.7)' },
            { opacity: 0, transform: 'scale(1.6)' }
        ], { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)' });
        setTimeout(()=> pulse.remove(), 600);
    }catch(e){ /* noop */ }
}

// wrap link open to also animate
function handleOpenClick(e){
    const btn = e.currentTarget;
    animateJoinEffect(btn);
    setTimeout(()=> openLink(), 80);
}

if(joinBtn) joinBtn.removeEventListener && joinBtn.addEventListener('click', handleOpenClick);
if(openInvite) openInvite.removeEventListener && openInvite.addEventListener('click', handleOpenClick);

document.addEventListener('DOMContentLoaded', ()=>{
    const els = Array.from(document.querySelectorAll('.revealable'));
    els.forEach((el, i)=> setTimeout(()=> el.classList.add('reveal'), i * 90));
    const obs = new IntersectionObserver((entries, observer)=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){
                entry.target.classList.add('reveal');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    els.forEach(el=> obs.observe(el));

    const jb = document.getElementById('joinBtn');
    if(jb){
        jb.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.04)' },
            { transform: 'scale(1)' }
        ], { duration: 700, easing: 'ease-in-out' });
    }
});

(function(){
    const loader = document.getElementById('site-loader');
    if(!loader) return;
    const progressDots = Array.from(document.querySelectorAll('.loader-progress .dot'));
    const spinner = loader.querySelector('.spinner');
    const loaderLogo = loader.querySelector('.loader-logo');

    const minVisible = 600;
    const startAt = performance.now();
    let progressed = 0;
    let progressTimer = null;
    let hideRequested = false;

    function setActiveDot(idx){
        progressDots.forEach((d,i)=> d.classList.toggle('active', i === idx));
    }

    function startProgressSimulation(){
        let i = 0;
        setActiveDot(i);
        progressTimer = setInterval(()=>{
            i = (i + 1) % progressDots.length;
            setActiveDot(i);
            progressed = Math.min(95, progressed + 5);
        }, 420);
    }

    function stopProgressSimulation(){
        if(progressTimer) clearInterval(progressTimer);
        progressTimer = null;
        progressDots.forEach(d=> d.classList.remove('active'));
    }

    function finalizeAndHide(){
        progressDots.forEach(d=> d.classList.add('active'));
        if(spinner) spinner.style.opacity = '0';
        const wait = Math.max(0, minVisible - (performance.now() - startAt));
        setTimeout(()=>{
            loader.classList.add('hidden');
            setTimeout(()=> loader.remove(), 700);
            const main = document.querySelector('.container');
            if(main) main.setAttribute('tabindex', '-1'), main.focus();
        }, wait + 180);
    }

    startProgressSimulation();

    function onLoaded(){
        if(hideRequested) return;
        hideRequested = true;
        stopProgressSimulation();
        finalizeAndHide();
    }

    window.addEventListener('load', onLoaded, { once:true });

    setTimeout(()=>{
        if(!hideRequested) onLoaded();
    }, 7000);
})();

// Register a small service worker for offline / PWA support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('ServiceWorker registered:', reg.scope))
    .catch(err => console.warn('ServiceWorker registration failed:', err));
}

async function loadDiscordOnline() {
    if (loadDiscordOnline._running) return; // prevent overlapping runs
    if (isApiThrottled('/api/widget')) return; // client-side throttle: max 1 call per 3s
    loadDiscordOnline._running = true;
    const statusEl = document.getElementById('online-status');
    const listEl = document.getElementById('online-list');
    if(!statusEl || !listEl) return;

    // show immediate sample avatars so the sidebar feels alive
    listEl.innerHTML = '';
    const sampleNames = ['alex', 'sam', 'mika', 'nova'];
    sampleNames.forEach((n, i) => {
        const a = document.createElement('a');
        a.href = '#';
        a.title = n;
        a.setAttribute('aria-label', `${n} - sample user`);
        a.style.display = 'inline-block';
        a.style.cursor = 'pointer';

        const img = document.createElement('img');
        img.alt = n;
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 40;
        img.height = 40;
        img.src = `https://cdn.discordapp.com/embed/avatars/${i % 5}.png`;

        a.appendChild(img);
        a.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard && navigator.clipboard.writeText(n).then(()=>{
                showNotification(`Copied ${n}`);
            }).catch(()=>{
                showNotification(`Copied ${n}`);
            });
        });
        listEl.appendChild(a);
    });

    statusEl.textContent = 'Loading…';
    statusEl.setAttribute('aria-live', 'polite');

    const refreshBtn = document.getElementById('refreshOnline');
    if(refreshBtn){
        // enable while attempting live fetch
        refreshBtn.disabled = false;
        refreshBtn.removeAttribute('aria-disabled');
        refreshBtn.title = '';
    }

    // helper: render widget members
    function renderWidgetMembers(widget){
        listEl.innerHTML = '';
        const count = widget.presence_count || (widget.members && widget.members.length) || 0;
        statusEl.textContent = `${count} online`;

        if(Array.isArray(widget.members) && widget.members.length > 0){
            widget.members.forEach(m => {
                const a = document.createElement('a');
                a.href = `https://discord.com/users/${m.id}`;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.title = m.username || 'user';
                a.setAttribute('aria-label', `${m.username || 'user'} - Click to copy username`);

                const img = document.createElement('img');
                img.alt = m.username || 'user';
                img.style.width = '40px';
                img.style.height = '40px';
                img.style.borderRadius = '50%';
                img.style.objectFit = 'cover';
                img.loading = 'lazy';
                img.decoding = 'async';
                // Add width/height attributes to prevent layout shift
                img.width = 40;
                img.height = 40;

                if(m.avatar){
                    // Use WebP format if available, with PNG fallback
                    img.src = `https://cdn.discordapp.com/avatars/${m.id}/${m.avatar}.png?size=64`;
                    img.srcset = `https://cdn.discordapp.com/avatars/${m.id}/${m.avatar}.png?size=64 1x, https://cdn.discordapp.com/avatars/${m.id}/${m.avatar}.png?size=128 2x`;
                } else if(m.avatar_url){
                    img.src = m.avatar_url;
                } else {
                    const disc = m.discriminator || '0';
                    const idx = (parseInt(disc,10) || 0) % 5;
                    img.src = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
                }

                a.appendChild(img);
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    const copyUsername = m.username || 'user';
                    navigator.clipboard && navigator.clipboard.writeText(copyUsername).then(() => {
                        showNotification(`Copied ${copyUsername} - ready to add as friend!`);
                    }).catch(err => {
                        console.error('Failed to copy username:', err);
                        showNotification('Failed to copy username');
                    });
                });

                listEl.appendChild(a);
            });
        } else {
            statusEl.textContent = `${count} online (no member list available)`;
        }
    }

    // Force direct fetch to Discord API first (may be CORS-blocked in some environments)
    try{
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const directRes = await fetch(`https://discord.com/api/guilds/${encodeURIComponent(GUILD_ID)}/widget.json`, { signal: ctrl.signal });
        clearTimeout(t);
        if(directRes && directRes.ok){
            const widget = await directRes.json();
            renderWidgetMembers(widget);
            return;
        }
    }catch(directErr){
        // direct fetch failed (likely CORS) — try proxy as fallback
        console.warn('Direct Discord API fetch failed, trying proxy fallback:', directErr && directErr.message ? directErr.message : directErr);
    }

    // Try proxy endpoint (same-origin) as a fallback
    try{
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const proxyRes = await fetch(`/api/widget/${encodeURIComponent(GUILD_ID)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if(proxyRes && proxyRes.ok){
            const widget = await proxyRes.json();
            renderWidgetMembers(widget);
            return;
        }
    }catch(proxyErr){
        console.warn('Proxy fetch failed:', proxyErr && proxyErr.message ? proxyErr.message : proxyErr);
    }

    // both live attempts failed — leave sample avatars and show message
    statusEl.textContent = 'Unable to load live members (running in static preview or API blocked)';
    statusEl.setAttribute('role', 'alert');
    loadDiscordOnline._running = false;
}

// Auto-refresh live members every 10 seconds with overlap protection
const AUTO_REFRESH_MS = 10000;
let _autoRefreshTimer = null;
function startAutoRefresh(){
    if(_autoRefreshTimer) return;
    _autoRefreshTimer = setInterval(()=>{
        try{ loadDiscordOnline(); }catch(e){ console.warn('Auto refresh failed', e); }
    }, AUTO_REFRESH_MS);
}
function stopAutoRefresh(){ if(_autoRefreshTimer){ clearInterval(_autoRefreshTimer); _autoRefreshTimer = null; } }

window.addEventListener('load', ()=> startAutoRefresh());
window.addEventListener('beforeunload', ()=> stopAutoRefresh());

// === Owner Analytics Tracking ===
function trackPageView() {
  const analytics = JSON.parse(localStorage.getItem('siteAnalytics') || '{"pageViews": 0, "joins": [], "lightModeUsers": 0, "darkModeUsers": 0}');
  analytics.pageViews = (analytics.pageViews || 0) + 1;
  
  // Track theme preference
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  if (theme === 'light') {
    analytics.lightModeUsers = (analytics.lightModeUsers || 0) + 1;
  } else {
    analytics.darkModeUsers = (analytics.darkModeUsers || 0) + 1;
  }
  
  localStorage.setItem('siteAnalytics', JSON.stringify(analytics));
}

function trackOAuthJoin(username) {
  const joins = JSON.parse(localStorage.getItem('discordJoins') || '[]');
  joins.push({
    username: username || 'Unknown User',
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('discordJoins', JSON.stringify(joins));
  console.log('✅ OAuth join tracked:', username);
}

// Check if returning from OAuth callback
window.addEventListener('load', () => {
  const params = new URLSearchParams(location.search);
  if (params.get('success') === 'joined') {
    const username = params.get('user') || 'Unknown';
    trackOAuthJoin(username);
    showNotification(`✅ Welcome ${username}! You've been added to the server.`, 'success', 5000);
    // Clean up URL
    window.history.replaceState({}, document.title, location.pathname);
  }
  if (params.get('error')) {
    showNotification(`❌ Error: ${params.get('error')}`, 'error', 5000);
  }
  trackPageView();
});

document.addEventListener('DOMContentLoaded', ()=>{
    setTimeout(() => {
        loadDiscordOnline().catch(err => {
            console.error('Failed to load Discord online:', err);
        });
    }, 800);

    const refreshBtn = document.getElementById('refreshOnline');
    if(refreshBtn){
        refreshBtn.addEventListener('click', async (e)=>{
            try{
                refreshBtn.disabled = true;
                refreshBtn.setAttribute('aria-busy', 'true');
                refreshBtn.textContent = 'Refreshing…';
                await loadDiscordOnline();
            } catch (err) {
                console.error('Refresh failed:', err);
            } finally{
                setTimeout(()=>{
                    refreshBtn.disabled = false;
                    refreshBtn.setAttribute('aria-busy', 'false');
                    refreshBtn.textContent = 'Refresh';
                }, 600);
            }
        });
    }
});

