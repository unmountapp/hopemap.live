/**
 * HopeMap i18n — lightweight client-side translation engine.
 * Auto-detects device language, provides a picker, stores preference.
 * Falls back to English (the default HTML) for missing keys.
 */
(function () {
  'use strict';

  /* ── Language registry (code → native name) ── */
  var LANGS = {
    en:'English',es:'Español',fr:'Français',ht:'Kreyòl Ayisyen',
    'zh-CN':'简体中文','zh-TW':'繁體中文',ko:'한국어',tl:'Filipino',
    hy:'Հայերեն',vi:'Tiếng Việt',ja:'日本語',fa:'فارسی',
    ru:'Русский',th:'ภาษาไทย',hi:'हिन्दी',ar:'العربية',
    km:'ភាសាខ្មែរ',he:'עברית',pt:'Português',gu:'ગુજરાતી',
    pa:'ਪੰਜਾਬੀ',bn:'বাংলা',id:'Bahasa Indonesia',sm:'Gagana Samoa',
    to:'Lea Faka-Tonga',my:'မြန်မာ',am:'አማርኛ',ur:'اردو',
    de:'Deutsch',it:'Italiano',pl:'Polski',uk:'Українська',
    ro:'Română',tr:'Türkçe',sw:'Kiswahili',so:'Soomaali',
    ti:'ትግርኛ',ne:'नेपाली',te:'తెలుగు',ta:'தமிழ்',
    kn:'ಕನ್ನಡ',ml:'മലയാളം',mh:'Kajin Majōl',hmn:'Hmoob',
    lo:'ພາສາລາວ',mxt:'Tu\'un Savi',zap:'Diidxazá',quc:"K'iche'",
    om:'Afaan Oromoo',ak:'Akan / Twi',yo:'Yorùbá',ig:'Igbo',
    fj:'Vosa Vakaviti',el:'Ελληνικά'
  };

  /* RTL languages */
  var RTL = {ar:1,fa:1,he:1,ur:1};

  var translations = {};
  var currentLang = 'en';
  var originals = {};    // stores original English text per element

  /* ── Detection ── */
  function detectLang() {
    try { var s = localStorage.getItem('hm_lang'); if (s && LANGS[s]) return s; } catch(e){}
    var bl = navigator.languages || [navigator.language || navigator.userLanguage || 'en'];
    for (var i = 0; i < bl.length; i++) {
      var c = bl[i];
      if (LANGS[c]) return c;
      /* try base code */
      var base = c.split('-')[0];
      if (LANGS[base]) return base;
      /* zh special: zh-Hans → zh-CN, zh-Hant → zh-TW */
      if (base === 'zh') {
        if (c.indexOf('Hant') > -1 || c === 'zh-TW' || c === 'zh-HK') return 'zh-TW';
        return 'zh-CN';
      }
    }
    return 'en';
  }

  /* ── Translation lookup ── */
  function t(key) {
    if (currentLang === 'en') return null;
    var ld = translations[currentLang];
    return (ld && ld[key]) || null;
  }

  /* ── Apply translations to DOM ── */
  function applyLang(lang) {
    currentLang = lang;
    try { localStorage.setItem('hm_lang', lang); } catch(e){}
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL[lang] ? 'rtl' : 'ltr';

    /* data-i18n → textContent */
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; var key = el.getAttribute('data-i18n');
      if (!originals[key]) originals[key] = el.textContent;
      var val = t(key);
      el.textContent = val || originals[key];
    }

    /* data-i18n-html → innerHTML */
    els = document.querySelectorAll('[data-i18n-html]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; var key = el.getAttribute('data-i18n-html');
      if (!originals[key]) originals[key] = el.innerHTML;
      var val = t(key);
      if (val) el.innerHTML = val; else el.innerHTML = originals[key];
    }

    /* data-i18n-placeholder */
    els = document.querySelectorAll('[data-i18n-placeholder]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; var key = el.getAttribute('data-i18n-placeholder');
      if (!originals[key]) originals[key] = el.placeholder;
      var val = t(key);
      el.placeholder = val || originals[key];
    }

    /* Update picker button text */
    var btn = document.getElementById('langPickerBtn');
    if (btn) btn.querySelector('.lp-name').textContent = LANGS[lang] || lang;

    /* Mark active in dropdown */
    var items = document.querySelectorAll('.lp-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('lp-active', items[i].getAttribute('data-lang') === lang);
    }
  }

  /* ── Build language picker ── */
  function buildPicker() {
    var nav = document.querySelector('.nav-inner');
    if (!nav) return;

    var wrap = document.createElement('div');
    wrap.className = 'lang-picker';
    wrap.innerHTML =
      '<button id="langPickerBtn" class="lp-btn" aria-label="Change language" aria-expanded="false">' +
        '<span class="lp-globe">🌐</span> <span class="lp-name">' + (LANGS[currentLang] || 'English') + '</span>' +
        '<span class="lp-arrow">▾</span>' +
      '</button>' +
      '<div class="lp-dropdown" id="langDropdown"></div>';

    /* Insert before mobile toggle */
    var toggle = document.getElementById('mobileToggle');
    if (toggle) nav.insertBefore(wrap, toggle);
    else nav.appendChild(wrap);

    /* Populate dropdown */
    var dd = document.getElementById('langDropdown');
    var codes = Object.keys(LANGS);

    /* Group: live first, then coming */
    var live = ['en','es','fr','ht'];
    var coming = codes.filter(function(c){ return live.indexOf(c) === -1; });

    var html = '<div class="lp-group-label">Available now</div>';
    live.forEach(function(c) {
      html += '<button class="lp-item' + (c === currentLang ? ' lp-active' : '') +
        '" data-lang="' + c + '">' + LANGS[c] + '</button>';
    });
    html += '<div class="lp-group-label">Coming soon</div>';
    coming.forEach(function(c) {
      html += '<button class="lp-item' + (c === currentLang ? ' lp-active' : '') +
        '" data-lang="' + c + '">' + LANGS[c] + '</button>';
    });
    dd.innerHTML = html;

    /* Toggle dropdown */
    var btn = document.getElementById('langPickerBtn');
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var open = dd.classList.toggle('lp-open');
      btn.setAttribute('aria-expanded', open);
    });

    /* Language selection */
    dd.addEventListener('click', function(e) {
      var item = e.target.closest('.lp-item');
      if (!item) return;
      var lang = item.getAttribute('data-lang');
      dd.classList.remove('lp-open');
      btn.setAttribute('aria-expanded', 'false');
      applyLang(lang);
    });

    /* Close on outside click */
    document.addEventListener('click', function() {
      dd.classList.remove('lp-open');
      btn.setAttribute('aria-expanded', 'false');
    });
    wrap.addEventListener('click', function(e){ e.stopPropagation(); });
  }

  /* ── Inject picker styles ── */
  function injectStyles() {
    var css = document.createElement('style');
    css.textContent =
      '.lang-picker{position:relative;z-index:1001;}' +
      '.lp-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:50px;color:#B8C2CF;font-size:0.8rem;font-family:inherit;cursor:pointer;transition:all .25s;white-space:nowrap;}' +
      '.lp-btn:hover{border-color:rgba(245,166,35,0.3);color:#E8ECF1;}' +
      '.lp-globe{font-size:1rem;line-height:1;}' +
      '.lp-arrow{font-size:0.6rem;opacity:0.5;}' +
      '.lp-dropdown{display:none;position:absolute;top:calc(100% + 8px);right:0;width:220px;max-height:400px;overflow-y:auto;background:rgba(21,28,37,0.98);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:6px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 20px 60px rgba(0,0,0,0.5);}' +
      '.lp-dropdown.lp-open{display:block;}' +
      '.lp-group-label{padding:8px 12px 4px;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;color:#F5A623;pointer-events:none;}' +
      '.lp-item{display:block;width:100%;text-align:left;padding:8px 12px;background:none;border:none;border-radius:8px;color:#B8C2CF;font-size:0.85rem;font-family:inherit;cursor:pointer;transition:all .2s;}' +
      '.lp-item:hover{background:rgba(255,255,255,0.06);color:#FAFBFC;}' +
      '.lp-item.lp-active{background:rgba(245,166,35,0.12);color:#FFD580;font-weight:600;}' +
      '.lp-dropdown::-webkit-scrollbar{width:5px;}.lp-dropdown::-webkit-scrollbar-track{background:transparent;}.lp-dropdown::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:5px;}' +
      '@media(max-width:768px){.lp-name{display:none;}.lp-arrow{display:none;}.lp-btn{padding:7px 10px;}.lp-dropdown{right:-40px;}}' +
      '[dir="rtl"] .lang-picker .lp-dropdown{right:auto;left:0;}';
    document.head.appendChild(css);
  }

  /* ── Init ── */
  function init() {
    translations = window.HM_TRANSLATIONS || {};
    currentLang = detectLang();
    injectStyles();
    buildPicker();
    if (currentLang !== 'en') applyLang(currentLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Public API */
  window.HM_i18n = { applyLang: applyLang, t: t, currentLang: function(){ return currentLang; } };
})();
