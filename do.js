// ─────────────────────────────────────────────
// DataObjects website — do.js
//
// 1. Loads HTML partials marked with data-include="path"
// 2. Handles form submissions for .notify-form (early access signup)
// 3. Scroll-reveal animation for cards
//
// No jQuery. No build step. Edit any partial, refresh, done.
// ─────────────────────────────────────────────

// Where the lead-capture API lives. Update if your do-server URL changes.
const API_BASE = 'https://data.dataobjects.com';

// ─── HTML INCLUDE LOADER ─────────────────────
// Usage in HTML: <div data-include="_partials/nav.html"></div>
async function loadPartials() {
  const includes = document.querySelectorAll('[data-include]');
  await Promise.all([...includes].map(async (el) => {
    try {
      const path = el.getAttribute('data-include');
      const resp = await fetch(path);
      if (!resp.ok) throw new Error(`${path}: ${resp.status}`);
      const html = await resp.text();
      // Replace placeholder with the partial's HTML
      const temp = document.createElement('div');
      temp.innerHTML = html;
      el.replaceWith(...temp.childNodes);
    } catch (e) {
      console.warn('[include]', e.message);
    }
  }));
  document.body.classList.add('partials-loaded');
  // After partials load, wire up anything inside them
  initScrollReveal();
  initFormHandlers();
}

// ─── FORM SUBMISSION ─────────────────────────
function initFormHandlers() {
  document.querySelectorAll('.notify-form').forEach(form => {
    if (form.dataset.wired) return;
    form.dataset.wired = '1';
    form.addEventListener('submit', handleNotifySubmit);
  });
}

async function handleNotifySubmit(e) {
  e.preventDefault();
  const form  = e.currentTarget;
  const input = form.querySelector('input[name="DOemail"]');
  const btn   = form.querySelector('button');
  const email = (input.value || '').trim();

  if (!email || !email.includes('@')) {
    input.focus();
    return;
  }

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    const resp = await fetch(`${API_BASE}/v6/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'website-early-access' })
    });
    // Treat any 2xx as success; treat network errors as failure.
    // Server returns ambiguous success even for existing emails — that's fine.
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    showSuccess(form);
  } catch (err) {
    console.warn('[notify]', err.message);
    // Fail gracefully — most likely a CORS or network issue.
    // Still show success to avoid revealing API behavior.
    showSuccess(form);
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = originalText;
      input.value = '';
    }, 5000);
  }
}

function showSuccess(form) {
  const notify = document.getElementById('DOnotify');
  if (notify) {
    notify.style.display = 'block';
    setTimeout(() => { notify.style.display = 'none'; }, 5000);
  }
}

// ─── SCROLL REVEAL ───────────────────────────
function initScrollReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      io.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(
    '.feat-card, .aud-card, .rm-item, .compare-card, .price-card, .obj-card, .app-card, .vid-card'
  ).forEach((el, i) => {
    if (el.dataset.revealWired) return;
    el.dataset.revealWired = '1';
    el.style.opacity = '0';
    el.style.transform = 'translateY(22px)';
    el.style.transition = `opacity 0.55s ease ${(i % 4) * 0.08}s, transform 0.55s ease ${(i % 4) * 0.08}s`;
    io.observe(el);
  });
}

// ─── BOOT ────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPartials);
} else {
  loadPartials();
}
