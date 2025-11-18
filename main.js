const INVITE = "https://discord.gg/7w6v5QeWn9";
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

function openLink(){
    if(!isAllowedUrl(INVITE)){
        console.warn('Blocked opening an untrusted invite URL', INVITE);
        return;
    }
    const newWin = window.open(INVITE, '_blank');
    try{ if(newWin) newWin.opener = null; }catch(e){ }
}

async function copyToClipboard(text){
    try {
        await navigator.clipboard.writeText(text);
        if(copyInvite) {
            copyInvite.textContent = "Copied!";
            setTimeout(()=> copyInvite.textContent = "Copy", 1600);
        }
    } catch (e) {
        if(inviteInput){
            inviteInput.select();
            document.execCommand('copy');
        }
        if(copyInvite){
            copyInvite.textContent = "Copied!";
            setTimeout(()=> copyInvite.textContent = "Copy", 1600);
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
