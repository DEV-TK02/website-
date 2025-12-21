const INVITE = "https://discord.gg/aPKREfAP3J";
const GUILD_ID = "1383549875010146505";
const joinBtn = document.getElementById('joinBtn');
const openInvite = document.getElementById('openInvite');
const copyInvite = document.getElementById('copyInvite');
const inviteInput = document.getElementById('inviteInput');

if(inviteInput) inviteInput.value = INVITE;

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

if(joinBtn) joinBtn.addEventListener('click', openLink);
if(openInvite) openInvite.addEventListener('click', openLink);
if(copyInvite) copyInvite.addEventListener('click', ()=> copyToClipboard(INVITE));

if(inviteInput) inviteInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') openLink();
});

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
    const statusEl = document.getElementById('online-status');
    const listEl = document.getElementById('online-list');
    if(!statusEl || !listEl) return;
    statusEl.textContent = 'Loading…';
    statusEl.setAttribute('aria-live', 'polite');
    
    try {
        let guildId = null;
        if (typeof GUILD_ID !== 'undefined' && GUILD_ID) {
            guildId = GUILD_ID;
        } else {
            const inviteUrl = new URL(INVITE);
            const code = inviteUrl.pathname.replace(/\//g, '');
            if(!code) throw new Error('Invalid invite code');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            try {
                const inviteRes = await fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if(!inviteRes.ok) throw new Error('Unable to resolve invite.');
                const inviteJson = await inviteRes.json();
                guildId = inviteJson.guild && inviteJson.guild.id;
                if(!guildId) throw new Error('Could not determine guild id from invite.');
            } catch (e) {
                clearTimeout(timeoutId);
                throw e;
            }
        }

        let widget = null;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try{
            const widgetRes = await fetch(`https://discord.com/api/guilds/${guildId}/widget.json`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if(widgetRes.ok){
                widget = await widgetRes.json();
            } else {
                throw new Error('Direct widget fetch failed');
            }
        }catch(e){
            clearTimeout(timeoutId);
            try{
                const proxyRes = await fetch(`/api/widget/${encodeURIComponent(guildId)}`);
                if(!proxyRes.ok) throw new Error('Proxy fetch failed');
                widget = await proxyRes.json();
            }catch(proxyErr){
                throw new Error('Widget not available (direct fetch failed and proxy unavailable).');
            }
        }

        listEl.innerHTML = '';

        const count = widget.presence_count || (widget.members && widget.members.length) || 0;
        statusEl.textContent = `${count} online`;

        if(Array.isArray(widget.members) && widget.members.length > 0){
            widget.members.forEach(m => {
                const a = document.createElement('a');
                a.href = `https://discord.com/users/${m.id}`;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                
                const actualUsername = m.username || 'user';
                const displayName = `${sanitizeInput(actualUsername)}${m.discriminator && m.discriminator !== '0000' ? '#' + m.discriminator : ''}`;
                a.title = displayName;
                a.setAttribute('aria-label', `${sanitizeInput(actualUsername)} - Click to copy username`);
                a.style.display = 'inline-block';
                a.style.cursor = 'pointer';

                const img = document.createElement('img');
                img.alt = sanitizeInput(actualUsername);
                img.style.width = '40px';
                img.style.height = '40px';
                img.style.borderRadius = '50%';
                img.style.objectFit = 'cover';
                img.style.border = '1px solid rgba(255,255,255,0.06)';
                img.loading = 'lazy';

                if(m.avatar){
                    img.src = `https://cdn.discordapp.com/avatars/${m.id}/${m.avatar}.png?size=64`;
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
                    navigator.clipboard.writeText(copyUsername).then(() => {
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
    } catch (err) {
        console.warn('Discord online load failed:', err);
        statusEl.textContent = 'Unable to load online members — enable the Server Widget or provide a guild ID.';
        statusEl.setAttribute('role', 'alert');
    }
}

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

