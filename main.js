// Externalized site JS (moved from inline script in index.html)

// GitHub Copilot — interactive bits
const INVITE = "https://discord.gg/7w6v5QeWn9"; // <-- replace with your real invite
const joinBtn = document.getElementById('joinBtn');
const openInvite = document.getElementById('openInvite');
const copyInvite = document.getElementById('copyInvite');
const inviteInput = document.getElementById('inviteInput');

if(inviteInput) inviteInput.value = INVITE;

// validate URLs before opening external links to avoid accidental navigation to unsafe locations
function isAllowedUrl(u){
    try{
        const url = new URL(u);
        // allow only HTTPS and known hosts (add more if needed)
        const allowedHosts = ['discord.gg','discord.com','www.discord.com'];
        return (url.protocol === 'https:' && (allowedHosts.includes(url.hostname) || allowedHosts.some(h => url.hostname.endsWith(h))));
    }catch(e){
        return false;
    }
}

function openLink(){
    // try to open in new tab; desktop/mobile will handle opening Discord
    if(!isAllowedUrl(INVITE)){
        console.warn('Blocked opening an untrusted invite URL', INVITE);
        return;
    }
    const newWin = window.open(INVITE, '_blank');
    // ensure the opened window doesn't keep a reference to this page
    try{ if(newWin) newWin.opener = null; }catch(e){ /* ignore */ }
}

async function copyToClipboard(text){
    try {
        await navigator.clipboard.writeText(text);
        if(copyInvite) {
            copyInvite.textContent = "Copied!";
            setTimeout(()=> copyInvite.textContent = "Copy", 1600);
        }
    } catch (e) {
        // fallback
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

// small UX: pressing Enter when input focused opens link
if(inviteInput) inviteInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') openLink();
});

// --- entrance & reveal animations (stagger + intersection observer)
document.addEventListener('DOMContentLoaded', ()=>{
    const els = Array.from(document.querySelectorAll('.revealable'));
    // quick staggered entrance for elements already on screen
    els.forEach((el, i)=> setTimeout(()=> el.classList.add('reveal'), i * 90));

    // observe for elements that appear later (scroll)
    const obs = new IntersectionObserver((entries, observer)=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){
                entry.target.classList.add('reveal');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    els.forEach(el=> obs.observe(el));

    // micro interaction: a tiny pulse on the join button on load
    const jb = document.getElementById('joinBtn');
    if(jb){
        jb.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.04)' },
            { transform: 'scale(1)' }
        ], { duration: 700, easing: 'ease-in-out' });
    }
});

// --- loader hide logic: fade overlay after window load or fallback timeout
(function(){
    const loader = document.getElementById('site-loader');
    if(!loader) return;
    // enhanced loader behaviour with simulated progress + minimum visible time
    const progressDots = Array.from(document.querySelectorAll('.loader-progress .dot'));
    const spinner = loader.querySelector('.spinner');
    const loaderLogo = loader.querySelector('.loader-logo');

    const minVisible = 600; // ms
    const startAt = performance.now();
    let progressed = 0;
    let progressTimer = null;
    let hideRequested = false;

    function setActiveDot(idx){
        progressDots.forEach((d,i)=> d.classList.toggle('active', i === idx));
    }

    function startProgressSimulation(){
        // cycle through dots until load finishes
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
        // show final state
        progressDots.forEach(d=> d.classList.add('active'));
        if(spinner) spinner.style.opacity = '0';
        // wait a little so change is visible, then hide
        const wait = Math.max(0, minVisible - (performance.now() - startAt));
        setTimeout(()=>{
            loader.classList.add('hidden');
            setTimeout(()=> loader.remove(), 700);
            // move focus to main content for accessibility
            const main = document.querySelector('.container');
            if(main) main.setAttribute('tabindex', '-1'), main.focus();
        }, wait + 180);
    }

    // start simulation immediately
    startProgressSimulation();

    function onLoaded(){
        if(hideRequested) return;
        hideRequested = true;
        stopProgressSimulation();
        finalizeAndHide();
    }

    window.addEventListener('load', onLoaded, { once:true });

    // fallback: ensure loader doesn't hang forever
    setTimeout(()=>{
        if(!hideRequested) onLoaded();
    }, 7000);
})();
