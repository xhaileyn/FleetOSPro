/* FleetOS Pro — website JavaScript */

// ── Sticky nav scroll behaviour ──────────────────────────────────────
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => {
    if (window.scrollY > 24) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ── Mobile hamburger toggle ───────────────────────────────────────────
(function () {
  const btn = document.getElementById('navHamburger');
  const mobile = document.getElementById('navMobile');
  if (!btn || !mobile) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    mobile.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !mobile.contains(e.target)) {
      btn.classList.remove('open');
      mobile.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

// ── Scroll-reveal (data-reveal attribute) ────────────────────────────
(function () {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
})();

// ── Feature sticky nav active link ───────────────────────────────────
(function () {
  const featureNav = document.getElementById('featureNav');
  if (!featureNav) return;

  const links = featureNav.querySelectorAll('.feature-nav-link');
  const sections = [];
  links.forEach(link => {
    const id = link.getAttribute('href').replace('#', '');
    const el = document.getElementById(id);
    if (el) sections.push({ el, link });
  });

  const onScroll = () => {
    const scrollY = window.scrollY + 120;
    let active = sections[0];
    sections.forEach(({ el, link }) => {
      if (el.offsetTop <= scrollY) active = { el, link };
    });
    links.forEach(l => l.classList.remove('active'));
    if (active) active.link.classList.add('active');
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ── Pricing billing toggle ────────────────────────────────────────────
(function () {
  const toggle = document.getElementById('billingSwitch');
  if (!toggle) return;

  const monthlyLabel = document.getElementById('monthlyLabel');
  const annualLabel = document.getElementById('annualLabel');
  const saveBadge = document.getElementById('saveBadge');
  const billedLabels = {
    starter: document.getElementById('starterBilled'),
    pro: document.getElementById('proBilled'),
    biz: document.getElementById('bizBilled'),
  };

  let isAnnual = false;

  const priceEls = document.querySelectorAll('.pricing-num[data-monthly]');

  const update = () => {
    toggle.setAttribute('aria-checked', String(isAnnual));
    toggle.classList.toggle('checked', isAnnual);

    monthlyLabel.classList.toggle('active', !isAnnual);
    annualLabel.classList.toggle('active', isAnnual);
    if (saveBadge) saveBadge.classList.toggle('visible', isAnnual);

    priceEls.forEach(el => {
      el.textContent = isAnnual
        ? (el.dataset.annual || el.dataset.monthly)
        : el.dataset.monthly;
    });

    const billedText = isAnnual ? 'Billed annually' : 'Billed monthly';
    Object.values(billedLabels).forEach(el => {
      if (el) el.textContent = billedText;
    });
  };

  toggle.addEventListener('click', () => {
    isAnnual = !isAnnual;
    update();
  });

  update();
})();

// ── FAQ accordion ────────────────────────────────────────────────────
(function () {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    answer.style.maxHeight = '0';
    answer.style.overflow = 'hidden';
    answer.style.transition = 'max-height 0.28s ease, padding 0.28s ease';

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Close all others
      items.forEach(other => {
        if (other !== item) {
          const ob = other.querySelector('.faq-question');
          const oa = other.querySelector('.faq-answer');
          if (ob) ob.setAttribute('aria-expanded', 'false');
          if (oa) {
            oa.style.maxHeight = '0';
            oa.style.paddingBottom = '0';
          }
          other.classList.remove('open');
        }
      });

      btn.setAttribute('aria-expanded', String(!isOpen));
      item.classList.toggle('open', !isOpen);

      if (!isOpen) {
        answer.style.maxHeight = answer.scrollHeight + 32 + 'px';
        answer.style.paddingBottom = '16px';
      } else {
        answer.style.maxHeight = '0';
        answer.style.paddingBottom = '0';
      }
    });
  });
})();

// ── Contact form validation ───────────────────────────────────────────
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('formSubmitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const formSuccess = document.getElementById('formSuccess');

  function showError(id, msg) {
    const el = document.getElementById(id + 'Error');
    if (el) el.textContent = msg;
    const input = document.getElementById(id);
    if (input) input.classList.add('error');
  }

  function clearError(id) {
    const el = document.getElementById(id + 'Error');
    if (el) el.textContent = '';
    const input = document.getElementById(id);
    if (input) input.classList.remove('error');
  }

  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const fields = ['firstName', 'lastName', 'email', 'company', 'subject', 'message'];
    fields.forEach(id => clearError(id));

    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const email = document.getElementById('email');
    const company = document.getElementById('company');
    const subject = document.getElementById('subject');
    const message = document.getElementById('message');

    if (!firstName.value.trim()) { showError('firstName', 'First name is required'); valid = false; }
    if (!lastName.value.trim()) { showError('lastName', 'Last name is required'); valid = false; }
    if (!email.value.trim()) {
      showError('email', 'Email address is required'); valid = false;
    } else if (!validateEmail(email.value.trim())) {
      showError('email', 'Please enter a valid email address'); valid = false;
    }
    if (!company.value.trim()) { showError('company', 'Company name is required'); valid = false; }
    if (!subject.value) { showError('subject', 'Please select a subject'); valid = false; }
    if (!message.value.trim()) {
      showError('message', 'Please enter your message'); valid = false;
    } else if (message.value.trim().length < 20) {
      showError('message', 'Message must be at least 20 characters'); valid = false;
    }

    if (!valid) return;

    // Simulate submission
    submitBtn.disabled = true;
    submitBtnText.textContent = 'Sending…';
    submitBtn.style.opacity = '0.7';

    setTimeout(() => {
      form.style.display = 'none';
      formSuccess.style.display = 'flex';
    }, 1000);
  });

  // Clear errors on input
  ['firstName', 'lastName', 'email', 'company', 'subject', 'message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => clearError(id));
  });
})();

// ── Counter animation for stats ribbon ───────────────────────────────
(function () {
  const statNums = document.querySelectorAll('.stat-number');
  if (!statNums.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const text = el.textContent;
      // Extract number
      const match = text.match(/[\d,.]+/);
      if (!match) return;
      const raw = match[0].replace(/,/g, '');
      const num = parseFloat(raw);
      if (isNaN(num)) return;

      const suffix = text.replace(match[0], '');
      const prefix = text.substring(0, text.indexOf(match[0]));
      const duration = 1200;
      const steps = 40;
      const stepMs = duration / steps;
      let current = 0;
      const inc = num / steps;

      const timer = setInterval(() => {
        current += inc;
        if (current >= num) {
          current = num;
          clearInterval(timer);
        }
        const formatted = current >= 1000
          ? Math.floor(current).toLocaleString()
          : (Number.isInteger(num) ? Math.floor(current) : current.toFixed(1));
        el.textContent = prefix + formatted + suffix;
      }, stepMs);

      io.unobserve(el);
    });
  }, { threshold: 0.4 });

  statNums.forEach(el => io.observe(el));
})();

// ── Screenshot showcase tab switcher ─────────────────────────────────
(function () {
  const tabs   = document.querySelectorAll('.ss-tab');
  const imgs   = document.querySelectorAll('.ss-img');
  const urlEls = document.querySelectorAll('#ss-url-text, #ss-url-text-features');
  const openEls = document.querySelectorAll('.ss-open-btn');

  if (!tabs.length) return;

  function switchTo(screen, url) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.screen === screen));
    imgs.forEach(i => i.classList.toggle('active', i.dataset.screen === screen));
    urlEls.forEach(el => { el.textContent = `app.fleetospro.com/${url}`; });
    openEls.forEach(el => { el.href = `https://app.fleetospro.com/${url}`; });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTo(tab.dataset.screen, tab.dataset.url));
  });

  // Auto-cycle every 4 seconds
  let idx = 0;
  const tabList = Array.from(tabs);
  setInterval(() => {
    idx = (idx + 1) % tabList.length;
    const t = tabList[idx];
    switchTo(t.dataset.screen, t.dataset.url);
  }, 4000);
})();

// ── Live vehicle counter (hero badge) ────────────────────────────────
(function () {
  const el = document.getElementById('liveVehicleCount');
  if (!el) return;
  let base = 6847;
  setInterval(() => {
    base += Math.floor(Math.random() * 5) - 2;
    if (base < 6800) base = 6800;
    if (base > 6900) base = 6900;
    el.textContent = base.toLocaleString();
  }, 3500);
})();

// ── Smooth scroll for anchor links ───────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href').replace('#', '');
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
