/* ============================================================
   WAHET AL YEMEN - واحة اليمن
   Main JavaScript
   ============================================================ */

'use strict';

// ========================
// LANGUAGE TOGGLE
// ========================
const translations = {
  // Nav
  'الرئيسية': 'Home',
  'القائمة': 'Menu',
  'الفروع': 'Branches',
  'عن الواحة': 'About Us',
  'تواصل معنا': 'Contact',
  'اطلب الآن': 'Order Now',
};

let currentLang = 'ar';

function setLanguage(lang) {
  currentLang = lang;
  const body = document.body;
  const toggleBtn = document.getElementById('langToggle');

  if (lang === 'en') {
    body.classList.add('en');
    body.dir = 'ltr';
    if (toggleBtn) toggleBtn.textContent = 'عر';
    document.documentElement.lang = 'en';
  } else {
    body.classList.remove('en');
    body.dir = 'rtl';
    if (toggleBtn) toggleBtn.textContent = 'EN';
    document.documentElement.lang = 'ar';
  }

  // Update all elements with data-en attributes
  document.querySelectorAll('[data-en]').forEach(el => {
    const arText = el.getAttribute('data-ar') || el.dataset._arOriginal;
    const enText = el.getAttribute('data-en');

    if (!el.dataset._arOriginal) {
      el.dataset._arOriginal = el.textContent.trim();
    }

    if (lang === 'en' && enText) {
      el.textContent = enText;
    } else if (arText) {
      el.textContent = arText;
    } else if (el.dataset._arOriginal) {
      el.textContent = el.dataset._arOriginal;
    }
  });

  localStorage.setItem('wy-lang', lang);
}

// ========================
// NAVBAR BEHAVIOR
// ========================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    if (scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScroll = scrollY;
  }, { passive: true });
}

// ========================
// MOBILE MENU
// ========================
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!hamburger || !mobileMenu) return;

  function closeMenu() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      closeMenu();
    }
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

// ========================
// SCROLL ANIMATIONS
// ========================
function initScrollAnimations() {
  const targets = document.querySelectorAll(
    '.dish-card, .feature-card, .branch-card, .branch-full-card, .about-feature'
  );

  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger based on sibling index
        const siblings = Array.from(entry.target.parentElement.children);
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, idx * 80);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -48px 0px'
  });

  targets.forEach(el => observer.observe(el));
}

// ========================
// BACK TO TOP
// ========================
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ========================
// ACTIVE NAV LINK
// ========================
function initActiveNav() {
  const links = document.querySelectorAll('.nav-link[href^="#"], .mobile-nav-links a[href^="#"]');

  const sections = Array.from(links).map(link => {
    const href = link.getAttribute('href');
    return href && href !== '#' ? document.querySelector(href) : null;
  }).filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = '#' + entry.target.id;
        document.querySelectorAll('.nav-link').forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === id);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
}

// ========================
// MENU TABS (menu.html)
// ========================
function initMenuTabs() {
  const tabs = document.querySelectorAll('.menu-tab');
  const sections = document.querySelectorAll('.menu-section');
  if (!tabs.length) return;

  function activateTab(tabEl) {
    const target = tabEl.dataset.target;

    tabs.forEach(t => t.classList.toggle('active', t === tabEl));
    sections.forEach(s => s.classList.toggle('active', s.id === target));

    // Smooth scroll to menu content
    const menuContent = document.querySelector('.menu-content');
    if (menuContent) {
      const top = menuContent.getBoundingClientRect().top + window.scrollY - 160;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab));
  });

  // Activate first tab by default
  if (tabs[0]) activateTab(tabs[0]);

  // URL hash support
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const matchTab = Array.from(tabs).find(t => t.dataset.target === hash);
    if (matchTab) activateTab(matchTab);
  }
}

// ========================
// BRANCH SELECTOR (menu.html)
// ========================
function initBranchSelector() {
  const tabs = document.querySelectorAll('.branch-tab');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // Could filter menu items by branch here
    });
  });

  if (tabs[0]) tabs[0].classList.add('active');
}

// ========================
// SMOOTH SCROLL FOR ANCHORS
// ========================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ========================
// ORDER MODAL — BRANCH DATA
// ========================
// To add a branch: copy one entry and update all fields.
// To remove a branch: delete its entry.
// whatsappNum: digits only — Egypt prefix 20 + number without the leading 0.
//   Example: 01112223232  →  201112223232
const ORDER_BRANCHES = [
  {
    id: 'mohandessin',
    name: { ar: 'فرع المهندسين', en: 'Mohandessin Branch' },
    phones: ['01112223232', '01124211118', '01116069000', '01200003155'],
    whatsappNum: '201112223232',
  },
  {
    id: 'sheikh-zayed',
    name: { ar: 'فرع الشيخ زايد', en: 'Sheikh Zayed Branch' },
    phones: ['01118883232', '01002829333'],
    whatsappNum: '201118883232',
  },
];

// Edit the message text here — {branch} is replaced with the branch name.
const WA_MESSAGE = {
  ar: (branch) => `مرحباً، أريد الطلب من ${branch}. من فضلك ساعدني في اختيار الطلب.`,
  en: (branch) => `Hello, I'd like to place an order from ${branch}. Please help me with my order.`,
};

// ========================
// ORDER MODAL
// ========================
function initOrderModal() {
  const modal = document.getElementById('orderModal');
  if (!modal) return;

  const step1      = document.getElementById('orderStep1');
  const step2      = document.getElementById('orderStep2');
  const step2Title = document.getElementById('orderStep2Title');
  const branchList = document.getElementById('orderBranchList');

  let currentMethod  = null;
  let activeBranchId = null;

  const isEn = () => document.body.classList.contains('en');

  function openModal(branchId) {
    activeBranchId = branchId || null;
    showStep(1);
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const firstBtn = modal.querySelector('#orderStep1 .order-method-btn');
      if (firstBtn) firstBtn.focus();
    }, 360);
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    currentMethod = null;
  }

  function showStep(n) {
    step1.hidden = n !== 1;
    step2.hidden = n !== 2;
  }

  function getWaLink(branch) {
    const lang = isEn() ? 'en' : 'ar';
    const name = isEn() ? branch.name.en : branch.name.ar;
    return `https://wa.me/${branch.whatsappNum}?text=${encodeURIComponent(WA_MESSAGE[lang](name))}`;
  }

  function selectMethod(method) {
    currentMethod = method;

    const branches = activeBranchId
      ? ORDER_BRANCHES.filter(b => b.id === activeBranchId)
      : ORDER_BRANCHES;

    // One branch: act directly without showing step 2
    if (branches.length === 1) {
      const b = branches[0];
      closeModal();
      if (method === 'call') {
        window.location.href = 'tel:' + b.phones[0];
      } else {
        window.open(getWaLink(b), '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // Multiple branches: build step 2
    if (step2Title) {
      step2Title.textContent = isEn()
        ? (method === 'call' ? 'Choose a Branch to Call' : 'Choose a Branch for WhatsApp')
        : (method === 'call' ? 'اختر الفرع للاتصال' : 'اختر الفرع للواتساب');
    }

    branchList.innerHTML = '';
    const phoneSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L6.91 8.92a16 16 0 006.17 6.17l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>`;
    const waSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

    branches.forEach(branch => {
      const card = document.createElement('div');
      card.className = 'order-branch-card';

      const nameEl = document.createElement('div');
      nameEl.className = 'order-branch-name';
      nameEl.textContent = isEn() ? branch.name.en : branch.name.ar;
      card.appendChild(nameEl);

      if (method === 'call') {
        const wrap = document.createElement('div');
        wrap.className = 'order-phones';
        branch.phones.forEach(phone => {
          const a = document.createElement('a');
          a.href = 'tel:' + phone;
          a.className = 'order-phone-btn';
          a.innerHTML = `${phoneSvg}<span>${phone}</span>`;
          wrap.appendChild(a);
        });
        card.appendChild(wrap);
      } else {
        const waBtn = document.createElement('a');
        waBtn.href = getWaLink(branch);
        waBtn.target = '_blank';
        waBtn.rel = 'noopener noreferrer';
        waBtn.className = 'order-whatsapp-btn';
        waBtn.innerHTML = `${waSvg}<span>${isEn() ? 'Chat on WhatsApp' : 'تواصل عبر واتساب'}</span>`;
        card.appendChild(waBtn);
      }

      branchList.appendChild(card);
    });

    showStep(2);
  }

  document.getElementById('btnCallMethod').addEventListener('click', () => selectMethod('call'));
  document.getElementById('btnWhatsappMethod').addEventListener('click', () => selectMethod('whatsapp'));
  document.getElementById('orderModalBack').addEventListener('click', () => showStep(1));

  modal.querySelectorAll('.order-modal-close').forEach(btn => btn.addEventListener('click', closeModal));
  modal.querySelector('.order-modal-backdrop').addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // Wire every [data-order-modal] trigger — value = branch id (or empty for all branches)
  document.querySelectorAll('[data-order-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const val = trigger.dataset.orderModal;
      openModal(val || null);
    });
  });
}

// ========================
// BRANCH SLIDESHOW
// ========================
function initSlideshows() {
  document.querySelectorAll('.branch-slideshow').forEach(ss => {
    const slides = ss.querySelectorAll('.slideshow-slide');
    const dots   = ss.querySelectorAll('.slideshow-dot');
    if (!slides.length) return;
    let current = 0;
    let timer;

    function goTo(n) {
      slides[current].classList.remove('active');
      if (dots[current]) dots[current].classList.remove('active');
      current = ((n % slides.length) + slides.length) % slides.length;
      slides[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');
    }

    const start = () => { timer = setInterval(() => goTo(current + 1), 4500); };
    const stop  = () => clearInterval(timer);

    dots.forEach(dot => {
      dot.addEventListener('click', () => { stop(); goTo(+dot.dataset.index); start(); });
    });

    const prev = ss.querySelector('.slideshow-prev');
    const next = ss.querySelector('.slideshow-next');
    if (prev) prev.addEventListener('click', () => { stop(); goTo(current - 1); start(); });
    if (next) next.addEventListener('click', () => { stop(); goTo(current + 1); start(); });

    ss.addEventListener('mouseenter', stop);
    ss.addEventListener('mouseleave', start);

    let tx = 0;
    ss.addEventListener('touchstart', e => { tx = e.touches[0].clientX; stop(); }, { passive: true });
    ss.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1));
      start();
    }, { passive: true });

    start();
  });
}

// ========================
// INIT
// ========================
document.addEventListener('DOMContentLoaded', () => {
  // Restore language preference
  const savedLang = localStorage.getItem('wy-lang');
  if (savedLang && savedLang !== 'ar') {
    setLanguage(savedLang);
  }

  // Language toggle button
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      setLanguage(currentLang === 'ar' ? 'en' : 'ar');
    });
  }

  initNavbar();
  initMobileMenu();
  initScrollAnimations();
  initBackToTop();
  initActiveNav();
  initMenuTabs();
  initBranchSelector();
  initSmoothScroll();
  initOrderModal();
  initSlideshows();

  // Page load animation for page hero
  const pageHero = document.querySelector('.page-hero');
  if (pageHero) {
    pageHero.style.animation = 'fadeIn 0.6s ease both';
  }
});
