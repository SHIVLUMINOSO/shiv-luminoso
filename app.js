/* Shiv Luminoso · Bhaktamar Stotra — plain JavaScript, no frameworks, no network calls.
   Content lives in data.js (verses, story) and strings.js (screen words). Do not retype the religious text. */
(function () {
  'use strict';
  var D = window.LUZ_DATA, UI = window.LUZ_UI;
  var LANGS = ['en', 'hi', 'gu', 'es', 'pt', 'it'];     // live languages (Hindi, Gujarati, Spanish, Portuguese and Italian are drafts until a native speaker has checked them)
  var SOON = [{ code: 'ta', name: 'தமிழ்', eng: 'Tamil' }];
  var IMG = window.LUZ_IMG_BASE || D.imgBase || '';   // folder (or web address) that holds img/, thumb/, nani.jpg, cover.jpg
  var U = function (p) { var m = window.LUZ_IMAGES; return (m && m[p]) || (IMG + p); };   // the single-file build embeds the pictures in window.LUZ_IMAGES
  var $app = document.getElementById('app'), $toast = document.getElementById('toast');

  /* ---------- tiny helpers ---------- */
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  // Gujarati script for the Sanskrit: Unicode keeps Devanagari and Gujarati letters in the same order, so each letter moves exactly 0x180 places (the danda marks stay as they are)
  var toGu = function (s) { return String(s).replace(/[\u0900-\u097F]/g, function (c) { var n = c.charCodeAt(0); return (n === 0x964 || n === 0x965) ? c : String.fromCharCode(n + 0x180); }); };
  var sc = function (s) { return S.lang === 'gu' ? toGu(s) : s; };
  var toDev = function (n) { return String(n).replace(/\d/g, function (d) { return '०१२३४५६७८९'[d]; }); };
  var norm = function (s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, '').toLowerCase(); };
  var mem = {};
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('luz.' + k); if (v !== null) return JSON.parse(v); } catch (e) {} return k in mem ? mem[k] : d; },
    set: function (k, v) { mem[k] = v; try { localStorage.setItem('luz.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var S = {
    lang: store.get('lang', 'en'), sa: store.get('sa', true), pron: store.get('pron', false), size: store.get('size', 1),
    tab: 'mantra', q: '', count: store.get('count', 0), rounds: store.get('rounds', 0)
  };
  if (LANGS.indexOf(S.lang) < 0) S.lang = 'en';
  var t = function (k, vars) {
    var s = (UI[S.lang] && UI[S.lang][k] != null) ? UI[S.lang][k] : (UI.en[k] != null ? UI.en[k] : k);
    if (vars) for (var v in vars) s = s.replace('{' + v + '}', vars[v]);
    return s;
  };
  var lines = function (a) { return a.map(function (x) { return esc(sc(x)); }).join('<br>'); };
  var verse = function (n) { return D.verses[n - 1]; };
  var clampN = function (x) { x = parseInt(x, 10); return x >= 1 && x <= 48 ? x : 1; };
  var BK = D.book, BOOKBASE = window.LUZ_BOOK_BASE || (IMG + BK.dir);     // the book's pages are pictures, p001.webp to p406.webp, each loaded only when it is read
  var clampP = function (x) { x = parseInt(x, 10); return x >= 1 && x <= BK.pages ? x : 1; };
  var pageUrl = function (n) { return BOOKBASE + 'p' + String(n).padStart(3, '0') + '.webp'; };
  var todayN = function () { var d = new Date(); return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5) % 48 + 1; };

  var ICON = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/>',
    verses: '<path d="M4 5.5C6 4.5 9 4.5 12 6c3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5z"/><path d="M12 6v13.5"/>',
    yantra: '<rect x="4" y="4" width="16" height="16"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2"/>',
    book: '<path d="M12 4v11"/><path d="m7.5 11 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.500-2.500-3.500-5.500-3.500-8.500s1-6 3.500-8.500z"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    next: '<path d="m9 5 7 7-7 7"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    share: '<circle cx="6" cy="12" r="2.4"/><circle cx="17.5" cy="6" r="2.4"/><circle cx="17.5" cy="18" r="2.4"/><path d="m8.2 10.8 7.2-3.6M8.2 13.2l7.2 3.6"/>'
  };
  var ic = function (n, s) { s = s || 22; return '<svg class="ico" aria-hidden="true" focusable="false" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + ICON[n] + '</svg>'; };

  /* ---------- chrome ---------- */
  function langPill(short) {   // inner screens show the short code (EN, ES, GU...) to leave room for the title
    return '<a class="pill" href="#language" aria-label="' + esc(t('language')) + ': ' + esc(UI[S.lang]._name) + '">' + ic('globe', 18) + '<span>' + esc(short ? UI[S.lang]._short : UI[S.lang]._name) + '</span></a>';
  }
  function musicBtn() {
    return '<button type="button" class="round" data-act="music" data-fid="music" aria-pressed="' + MUSIC.on + '" aria-label="' + esc(t('music')) + '">' + ic('music', 20) + '</button>';
  }
  function topHome() { return '<header class="top home"><div class="lbl lat" style="text-align:left">Shiv Luminoso</div><div class="tools">' + musicBtn() + langPill() + '</div></header>'; }
  function topSub(back, label) {
    return '<header class="top"><a class="round" href="' + back + '" aria-label="' + esc(t('back')) + '">' + ic('back') + '</a><div class="lbl">' + esc(label) + '</div><div class="tools">' + musicBtn() + langPill(true) + '</div></header>';
  }
  function nav(active) {
    var items = [['home', '#home', 'home'], ['verses', '#verses', 'verses'], ['yantra', '#yantras', 'yantras'], ['book', '#book', 'book']];
    return '<nav class="nav" aria-label="Main">' + items.map(function (i) {
      return '<a href="' + i[1] + '"' + (active === i[0] ? ' aria-current="page"' : '') + '>' + ic(i[0]) + '<span>' + esc(t(i[2])) + '</span></a>';
    }).join('') + '</nav>';
  }
  function pager(n, base, max) {
    var p = n > 1, x = n < (max || 48);
    return '<div class="row"><a class="btn ghost" href="' + (p ? base + (n - 1) : '#') + '"' + (p ? '' : ' aria-disabled="true" tabindex="-1"') + '>' + ic('back', 18) + '<span>' + esc(t('prev')) + '</span></a>' +
      '<a class="btn" href="' + (x ? base + (n + 1) : '#') + '"' + (x ? '' : ' aria-disabled="true" tabindex="-1"') + '><span>' + esc(t('next')) + '</span>' + ic('next', 18) + '</a></div>';
  }

  /* ---------- views ---------- */
  function vHome() {
    var n = todayN(), v = verse(n);
    return { title: 'Shiv Luminoso · Bhaktamar Stotra', nav: 'home', top: topHome(), html:
      '<div class="hero"><h1>Bhaktamar Stotra</h1><div class="hd" lang="sa">' + esc(sc('भक्तामर स्तोत्र')) + '</div><p>' + esc(t('tagline')) + '</p></div>' +
      '<section class="card" aria-label="' + esc(t('today')) + '"><div class="lbl">' + esc(t('today')) + ' · ' + pad(n) + '</div><div class="sa" lang="sa">' + lines(v.sa) + '</div>' +
      '<a class="btn" href="#verse-' + n + '">' + esc(t('readVerse', { n: n })) + '</a></section>' +
      '<div class="tiles"><a class="tile" href="#verses">' + ic('verses', 26) + '<span>' + esc(t('cardVerses')) + '</span></a>' +
      '<a class="tile" href="#yantras">' + ic('yantra', 26) + '<span>' + esc(t('cardYantras')) + '</span></a>' +
      '<a class="tile" href="#memory">' + ic('heart', 26) + '<span>' + esc(t('cardStory')) + '</span></a></div>' +
      '<a class="mem" href="#memory"><img src="' + U('nani.jpg') + '" alt="' + esc(D.memory.name) + '" width="54" height="54"><span><b>' + esc(t('inMemoryOf')) + '<br>' + esc(D.memory.name) + '</b><i>' + esc(t('sharedBy')) + '</i></span></a>' };
  }

  var index = null;
  function buildIndex() {
    index = D.verses.map(function (v) {
      return norm([v.n].concat(LANGS.map(function (l) { return (v.title[l] || '') + ' ' + (v.meaning[l] || ''); }), v.sa, v.pron).join(' '));
    });
  }
  function rows(q) {
    var out = [], nq = norm(q.trim());
    if (!index) buildIndex();
    D.verses.forEach(function (v, i) {
      var ok = !nq || (/^\d+$/.test(nq) ? String(v.n).indexOf(nq) === 0 : index[i].indexOf(nq) >= 0);
      if (!ok) return;
      out.push('<a class="vrow" href="#verse-' + v.n + '"><span class="num">' + v.n + '</span><span class="tx"><span class="sa1" lang="sa">' + esc(sc(v.sa[0].replace(/-$/, ''))) + '</span><span class="tt" lang="' + S.lang + '">' + esc(v.title[S.lang]) + '</span></span>' + ic('next', 18) + '</a>');
    });
    return out.length ? out.join('') : '<div class="empty">' + esc(t('noMatch')) + '</div>';
  }
  function vVerses() {
    return { title: t('versesTitle'), nav: 'verses', top: '<header class="top home"><div class="lbl lat" style="text-align:left">Bhaktamar Stotra</div><div class="tools">' + musicBtn() + langPill() + '</div></header>', html:
      '<div><h1 tabindex="-1">' + esc(t('versesTitle')) + '</h1><p class="note">' + esc(t('tapToRead')) + '</p></div>' +
      '<div><label class="vh" for="q">' + esc(t('searchLabel')) + '</label><input id="q" class="search" type="search" autocomplete="off" placeholder="' + esc(t('search')) + '" value="' + esc(S.q) + '"></div>' +
      '<div class="list" id="list">' + rows(S.q) + '</div>' };
  }

  function chips() {
    return '<div class="chips" role="group" aria-label="' + esc(t('language')) + '">' + LANGS.map(function (k) {
      return '<button type="button" class="pill" data-act="lang" data-v="' + k + '" data-fid="lang-' + k + '" aria-pressed="' + (S.lang === k) + '" aria-label="' + esc(UI[k]._name) + '">' + esc(UI[k]._short) + '</button>';
    }).join('') + SOON.map(function (s) {
      return '<button type="button" class="pill" disabled title="' + esc(s.eng + ' · ' + t('inReview')) + '" aria-label="' + esc(s.eng + ', ' + t('inReview')) + '">' + s.code.toUpperCase() + '</button>';
    }).join('') + '</div>';
  }
  function vVerse(n) {
    var v = verse(n), L = S.lang;
    return { title: t('verseOf', { n: pad(n) }) + ' · ' + v.title[L], nav: 'verses', top: topSub('#verses', t('verseOf', { n: pad(n) })), swipe: '#verse-', n: n, html:
      '<div class="vhead"><a href="#yantra-' + n + '" aria-label="' + esc(t('yantra') + ' ' + n) + '"><img src="' + U('thumb/y' + pad(n) + '.webp') + '" alt="" width="64" height="75"></a><h1 class="ttl" tabindex="-1" lang="' + L + '">' + esc(v.title[L]) + '</h1></div>' +
      chips() +
      '<section class="card sa-card" aria-label="' + esc(t('sanskrit')) + '"><div class="spread"><div class="lbl">' + esc(t('sanskrit')) + '</div>' +
      '<button type="button" class="pill" data-act="pron" data-fid="pron" aria-pressed="' + S.pron + '">' + esc(t('pronunciation')) + '</button></div>' +
      '<div class="sa" lang="sa">' + lines(v.sa) + '</div>' + (S.pron ? '<div class="pron" lang="sa-Latn">' + lines(v.pron) + '</div>' : '') + '</section>' +
      '<section class="card"><div class="lbl">' + esc(t('meaningLabel')) + '</div><p class="body" lang="' + L + '">' + esc(v.meaning[L]) + '</p></section>' +
      '<div class="row"><a class="btn ghost" href="#yantra-' + n + '">' + esc(t('yantra')) + '</a><a class="btn ghost w2" href="#practice-' + n + '">' + esc(t('mantraBenefit')) + '</a></div>' +
      pager(n, '#verse-') };
  }

  function vYantra(n) {
    var v = verse(n), L = S.lang;
    var alts = function (a) { return a.map(function (x) { return esc(sc(x.dev)); }).join('<br>' + '<span class="sep">' + esc(t('or')) + '</span><br>'); };
    return { title: t('yantraOf', { n: pad(n) }), nav: 'yantra', top: topSub('#verse-' + n, t('yantraOf', { n: pad(n) })), swipe: '#yantra-', n: n, html:
      '<button type="button" class="yframe" data-act="zoom" data-n="' + n + '" data-fid="zoom" aria-label="' + esc(t('yantraAlt', { n: n }) + '. ' + t('fullSize')) + '"><img src="' + U('img/y' + pad(n) + '.webp') + '" alt="' + esc(t('yantraAlt', { n: n })) + '" width="900" height="1048"></button>' +
      '<div class="ytitle"><h1 tabindex="-1">' + esc(t('yantraName', { n: n })) + '</h1>' + ((L === 'hi' || L === 'gu') ? '' : '<span lang="sa">' + esc(sc('भक्तामर यंत्र–' + toDev(n))) + '</span>') + '</div>' +
      '<section class="card"><div class="lbl">' + esc(t('lblRiddhi')) + '</div><div class="mantra" lang="sa">' + alts(v.riddhi) + '</div></section>' +
      '<section class="card"><div class="lbl">' + esc(t('lblMantra')) + '</div><div class="mantra" lang="sa">' + alts(v.mantra) + '</div></section>' +
      '<a class="btn ghost" href="#practice-' + n + '">' + esc(t('mantraBenefit')) + '</a>' + pager(n, '#yantra-') };
  }

  function altCards(list, label) {
    return '<section class="card"><div class="lbl">' + esc(label) + '</div>' + list.map(function (x, i) {
      return (i ? '<div class="sep">' + esc(t('or')) + '</div>' : '') + '<div class="mantra" lang="sa">' + esc(sc(x.dev)) + '</div><div class="iast" lang="sa-Latn">' + esc(x.iast) + '</div>';
    }).join('') + '</section>';
  }
  function paras(txt, L) { return String(txt).split(/\n+/).map(function (p) { return '<p class="body" lang="' + L + '">' + esc(p) + '</p>'; }).join(''); }
  function counterHtml() {
    return '<section class="card counter" aria-label="' + esc(t('counter')) + '"><div class="lbl">' + esc(t('counter')) + '</div>' +
      '<button type="button" class="dot" id="dot" data-act="count" data-fid="count" aria-label="' + esc(t('counterTap') + ', ' + t('counterOf', { c: S.count })) + '"><b id="cnum">' + S.count + '</b><small>' + esc(t('counterTap')) + '</small></button>' +
      '<div class="cstat" id="cstat">' + (S.rounds ? S.rounds + ' ' + esc(t('rounds')) : '') + '</div>' +
      '<button type="button" class="pill" data-act="reset" data-fid="reset">' + esc(t('reset')) + '</button></section>';
  }
  function vPractice(n) {
    var v = verse(n), L = S.lang, tab = S.tab, body = '';
    if (tab === 'mantra') body = altCards(v.riddhi, t('lblRiddhi')) + altCards(v.mantra, t('lblMantra')) + counterHtml();
    else if (tab === 'method') body = '<section class="card"><div class="lbl">' + esc(t('lblMethod')) + '</div>' + paras(v.method[L], L) + '</section>';
    else body = '<section class="card"><div class="lbl">' + esc(t('lblBenefit')) + '</div>' + paras(v.benefit[L], L) + '<p class="note" style="border-top:1px solid var(--soft);padding-top:10px">' + esc(t('benefitNote')) + '</p></section>';
    var tabs = [['mantra', 'tabMantra'], ['method', 'tabMethod'], ['benefit', 'tabBenefit']].map(function (x) {
      return '<button type="button" class="pill" data-act="tab" data-v="' + x[0] + '" data-fid="tab-' + x[0] + '" aria-pressed="' + (tab === x[0]) + '">' + esc(t(x[1])) + '</button>';
    }).join('');
    return { title: t('practiceTitle') + ' · ' + n, nav: 'verses', top: topSub('#verse-' + n, t('practiceOf', { n: pad(n) })), swipe: '#practice-', n: n, html:
      '<h1 class="ttl" tabindex="-1" style="font-size:1.875rem">' + esc(t('practiceTitle')) + '</h1>' +
      '<div class="tabs" role="group" aria-label="' + esc(t('practiceTitle')) + '">' + tabs + '</div>' + body +
      '<p class="note">' + esc(t('textNote')) + '</p>' + pager(n, '#practice-') };
  }

  function vYantras() {
    var g = D.verses.map(function (v) {
      return '<a href="#yantra-' + v.n + '" aria-label="' + esc(t('yantra') + ' ' + v.n) + '"><img loading="lazy" decoding="async" src="' + U('thumb/y' + pad(v.n) + '.webp') + '" alt="" width="260" height="303"><span>' + v.n + '</span></a>';
    }).join('');
    return { title: t('cardYantras'), nav: 'yantra', top: '<header class="top home"><div class="lbl lat" style="text-align:left">Bhaktamar Stotra</div><div class="tools">' + musicBtn() + langPill() + '</div></header>', html:
      '<div><h1 tabindex="-1">' + esc(t('cardYantras')) + '</h1></div><div class="ygrid">' + g + '</div>' };
  }

  function vMemory() {
    var L = S.lang, M = D.memory, d = M.dedication[L], st = M.story[L];
    return { title: t('memoryTitle'), nav: 'home', top: topSub('#home', t('memoryTitle')), html:
      '<div class="memtop"><img class="mp" src="' + U('nani.jpg') + '" alt="' + esc(M.name) + '" width="172" height="268"><h1 tabindex="-1">' + esc(M.name) + '</h1>' +
      '<div class="dates" lang="' + L + '">' + esc(d.role) + ' · ' + esc(M.dates[L]) + '</div>' +
      '<div class="big" lang="' + L + '">' + esc(d.line) + '</div><div class="big" lang="' + L + '">' + esc(d.line2) + '</div>' + (d.line3 ? '<div class="big" lang="' + L + '">' + esc(d.line3) + '</div>' : '') +
      (d.draft ? '<span class="tag">' + esc(t('draftTag')) + '</span>' : '') + '</div>' +
      '<section class="card story"><div class="lbl">' + esc(t('storyLabel')) + '</div><h2 class="ttl" lang="' + L + '">' + esc(st[0]) + '</h2>' +
      st.slice(1).map(function (p) { return '<p class="body" lang="' + L + '">' + esc(p) + '</p>'; }).join('') + '</section>' +
      '<p class="note center">' + esc(t('withLove')) + '</p>' };
  }

  function vLanguage() {
    var L = S.lang;
    var opts = LANGS.map(function (k) {
      return '<label class="opt" for="lg-' + k + '"><input id="lg-' + k + '" type="radio" name="lang" data-act="lang" data-fid="lg-' + k + '" data-v="' + k + '"' + (L === k ? ' checked' : '') + '><span><span class="on1">' + esc(UI[k]._name) + '</span><span class="on2">' + esc(({ en: 'English', hi: 'Hindi', gu: 'Gujarati', es: 'Spanish', pt: 'Portuguese', it: 'Italian' })[k]) + '</span></span></label>';
    }).join('') + SOON.map(function (s) {
      return '<div class="opt soon"><input type="radio" disabled aria-label="' + esc(s.eng) + '"><span><span class="on1">' + esc(s.name) + '</span><span class="on2">' + esc(s.eng + ' · ' + t('inReview')) + '</span></span></div>';
    }).join('');
    var sizes = [[1, 'sizeM'], [0.9, 'sizeS'], [1.15, 'sizeL']].sort(function (a, b) { return a[0] - b[0]; }).map(function (x) {
      return '<button type="button" class="pill" data-act="size" data-v="' + x[0] + '" data-fid="size-' + x[0] + '" aria-pressed="' + (S.size === x[0]) + '">' + esc(t(x[1])) + '</button>';
    }).join('');
    return { title: t('chooseLang'), nav: 'home', top: '<header class="top"><button type="button" class="round" data-act="back" aria-label="' + esc(t('back')) + '">' + ic('back') + '</button><div class="lbl">' + esc(t('language')) + '</div>' + musicBtn() + '</header>', html:
      '<h1 class="ttl" tabindex="-1" style="font-size:2.125rem">' + esc(t('chooseLang')) + '</h1>' +
      '<fieldset><legend class="vh">' + esc(t('language')) + '</legend>' + opts + '</fieldset>' +
      '<div class="card" style="padding:6px 16px"><label class="sw" for="sw-sa">' + esc(t('showSanskrit')) + '<input id="sw-sa" type="checkbox" data-act="sa" data-fid="sw-sa"' + (S.sa ? ' checked' : '') + '></label>' +
      '<label class="sw" for="sw-pr">' + esc(t('showPron')) + '<input id="sw-pr" type="checkbox" data-act="pron2" data-fid="sw-pr"' + (S.pron ? ' checked' : '') + '></label></div>' +
      '<div class="card"><div class="lbl">' + esc(t('textSize')) + '</div><div class="tabs" role="group" aria-label="' + esc(t('textSize')) + '">' + sizes + '</div></div>' +
      '<p class="note">' + esc(t('langNote')) + '</p>' +
      '<button type="button" class="btn" data-act="back">' + esc(t('done')) + '</button>' };
  }

  function vBook() {
    return { title: t('bookTitle'), nav: 'book', top: '<header class="top home"><div class="lbl" style="text-align:left">' + esc(t('bookLabel')) + '</div><div class="tools">' + musicBtn() + langPill() + '</div></header>', html:
      '<h1 class="ttl" tabindex="-1" style="font-size:2.125rem">' + esc(t('bookTitle')) + '</h1>' +
      '<div class="bookrow"><img src="' + U('cover.jpg') + '" alt="" width="112" height="175"><div><b>' + esc(t('freePdf')) + '</b><i>' + esc(t('edition')) + '</i></div></div>' +
      '<a class="btn" href="#read-' + store.get('bookpage', 1) + '">' + ic('verses', 20) + '<span>' + esc(store.get('bookpage', 1) > 1 ? t('continueBook', { n: store.get('bookpage', 1) }) : t('readBook')) + '</span></a>' +
      '<a class="btn ghost" href="' + esc(D.book.url) + '" target="_blank" rel="noopener">' + ic('book', 20) + '<span>' + esc(t('download')) + '</span></a>' +
      '<button type="button" class="btn ghost" data-act="share" data-fid="share">' + ic('share', 20) + '<span>' + esc(t('share')) + '</span></button>' +
      '<section class="card"><div class="lbl">' + esc(t('copyTitle')) + '</div><p class="small" lang="' + S.lang + '">' + esc(t('copyright')) + '</p><p class="note">' + esc(t('jinvani')) + '</p>' +
      '<a href="' + esc(D.book.site) + '" target="_blank" rel="noopener" class="small" style="font-weight:700;display:flex;align-items:center;min-height:44px">www.shivtranslators.com</a></section>' };
  }

  /* ---------- the book, read page by page ---------- */
  function vRead(n) {
    var N = BK.pages, big = !!S.rdBig;
    return { title: t('pageOf', { n: n, total: N }), nav: 'book', top: topSub('#book', t('pageOf', { n: n, total: N })), swipe: '#read-', n: n, max: N,
      after: function () {
        store.set('bookpage', n);
        var img = document.getElementById('rdimg'), fail = document.getElementById('rdfail');
        var warm = function () { [n + 1, n - 1].forEach(function (k) { if (k >= 1 && k <= N) { var im = new Image(); im.src = pageUrl(k); } }); };
        img.addEventListener('error', function () { fail.hidden = false; });
        img.addEventListener('load', function () { fail.hidden = true; warm(); });
        if (img.complete && img.naturalWidth) warm();
      }, html:
      '<h1 class="vh" tabindex="-1">' + esc(t('pageOf', { n: n, total: N })) + '</h1>' +
      '<div class="rd' + (big ? ' big' : '') + '">' +
        '<div class="rdbar"><a class="pill" href="#contents" data-fid="rdtoc">' + esc(t('contents')) + '</a>' +
        '<button type="button" class="pill" data-act="rdzoom" data-fid="rdzoom">' + esc(t(big ? 'zoomOut' : 'zoomIn')) + '</button></div>' +
        '<div class="rdpg" id="rdpg"><img id="rdimg" src="' + pageUrl(n) + '" alt="' + esc(t('pageAlt', { n: n, total: N })) + '" width="1000" height="1563" draggable="false" decoding="async"></div>' +
        '<div class="rdfail" id="rdfail" role="alert" hidden><p class="note">' + esc(t('pageFail')) + '</p><button type="button" class="pill" data-act="rdretry">' + esc(t('retry')) + '</button></div>' +
        pager(n, '#read-', N) +
        '<form class="rdgo" id="rdgo" novalidate><label class="vh" for="rdn">' + esc(t('goToPage')) + '</label><input id="rdn" class="search" type="number" inputmode="numeric" min="1" max="' + N + '" placeholder="' + esc(t('goToPage')) + ' (1–' + N + ')">' +
        '<button type="submit" class="pill">' + esc(t('go')) + '</button></form>' +
        '<p class="note rdprint">' + esc(t('printOff')) + '</p>' +
      '</div>' };
  }
  function vContents() {
    var last = store.get('bookpage', 1);
    var rows = BK.toc.map(function (r) {
      return '<a class="vrow" href="#read-' + r[2] + '"><span class="num rdnum">' + r[2] + '</span><span class="tx"><span class="tt rdtt' + (r[0] > 1 ? ' sub' : '') + '">' + esc(r[1]) + '</span></span></a>';
    }).join('');
    var grid = BK.verses.map(function (p, i) {
      return '<a class="pill" href="#read-' + p + '" aria-label="' + esc(t('jumpVerse') + ' ' + (i + 1)) + '">' + (i + 1) + '</a>';
    }).join('');
    return { title: t('contents'), nav: 'book', top: topSub('#read-' + last, t('contents')), html:
      '<h1 class="ttl" tabindex="-1" style="font-size:2.125rem">' + esc(t('contents')) + '</h1>' +
      '<div class="list">' + rows + '</div>' +
      '<section class="card"><div class="lbl">' + esc(t('jumpVerse')) + '</div><div class="vgrid">' + grid + '</div></section>' };
  }

  /* ---------- router ---------- */
  function parse() { var p = (location.hash || '#home').slice(1).split('-'); return { r: p[0] || 'home', n: p[1] }; }
  var cur = null;
  function build() {
    var p = parse();
    switch (p.r) {
      case 'verses': return vVerses();
      case 'verse': return vVerse(clampN(p.n));
      case 'yantra': return vYantra(clampN(p.n));
      case 'practice': return vPractice(clampN(p.n));
      case 'yantras': return vYantras();
      case 'memory': return vMemory();
      case 'language': return vLanguage();
      case 'book': return vBook();
      case 'read': return vRead(clampP(p.n));
      case 'contents': return vContents();
      default: return vHome();
    }
  }
  function render(keep) {
    closeZoom(true);
    var prev = document.activeElement, fid = prev && prev.getAttribute && prev.getAttribute('data-fid');
    var oldMain = document.getElementById('main'), top = keep && oldMain ? oldMain.scrollTop : 0;
    cur = build();
    document.documentElement.lang = S.lang;
    document.documentElement.style.setProperty('--scale', S.size);
    document.title = cur.title + (cur.title.indexOf('Shiv') === 0 ? '' : ' · Shiv Luminoso');
    $app.innerHTML = '<div class="app' + (S.lang === 'hi' ? ' is-hi' : '') + (S.lang === 'gu' ? ' is-gu' : '') + (S.sa ? '' : ' hide-sa') + '">' + cur.top + '<main id="main" class="scroll" tabindex="-1">' + cur.html + '</main>' + nav(cur.nav) + '</div>';
    var main = document.getElementById('main');
    /* Devanagari must not be letter-spaced (it breaks the conjuncts), so wrap it in labels */
    $app.querySelectorAll('.lbl,.sep').forEach(function (el) {
      if (/[\u0900-\u097F]/.test(el.textContent)) el.innerHTML = esc(el.textContent).replace(/[\u0900-\u097F][\u0900-\u097F ]*/g, '<span class="dv">$&</span>');
    });
    main.scrollTop = top;
    var target = fid && main.parentNode.querySelector('[data-fid="' + fid + '"]');
    if (target && keep) { target.focus({ preventScroll: true }); }
    else if (!keep) { var h = main.querySelector('h1') || main; h.focus({ preventScroll: true }); }
    if (cur.after) cur.after();
  }
  window.addEventListener('hashchange', function () { render(false); });

  /* ---------- zoom overlay (yantra) ---------- */
  var zoomEl = null, zoomFrom = null;
  function openZoom(n) {
    zoomFrom = document.activeElement;
    zoomEl = document.createElement('div');
    zoomEl.className = 'zoom'; zoomEl.setAttribute('role', 'dialog'); zoomEl.setAttribute('aria-modal', 'true'); zoomEl.setAttribute('aria-label', t('yantraName', { n: n }));
    zoomEl.innerHTML = '<div class="zbar"><button type="button" class="pill" data-act="zclose">' + esc(t('close')) + '</button></div><div class="zs"><img src="' + U('img/y' + pad(n) + '.webp') + '" alt="' + esc(t('yantraAlt', { n: n })) + '" data-act="zimg"></div>';
    document.body.appendChild(zoomEl);
    zoomEl.querySelector('button').focus();
  }
  function closeZoom(silent) {
    if (!zoomEl) return;
    zoomEl.remove(); zoomEl = null;
    if (!silent && zoomFrom && document.body.contains(zoomFrom)) zoomFrom.focus({ preventScroll: true });
  }

  /* ---------- actions ---------- */
  function toast(msg) { $toast.textContent = msg; $toast.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(function () { $toast.classList.remove('show'); }, 2200); }
  function setLang(k) { if (LANGS.indexOf(k) < 0) return; S.lang = k; store.set('lang', k); render(true); }
  function count() {
    S.count++;
    if (S.count >= 108) { S.count = 0; S.rounds++; store.set('rounds', S.rounds); try { navigator.vibrate && navigator.vibrate(60); } catch (e) {} toast(t('counterDone')); }
    store.set('count', S.count);
    var num = document.getElementById('cnum'), st = document.getElementById('cstat'), dot = document.getElementById('dot');
    if (num) num.textContent = S.count;
    if (st) st.textContent = S.rounds ? S.rounds + ' ' + t('rounds') : '';
    if (dot) dot.setAttribute('aria-label', t('counterTap') + ', ' + t('counterOf', { c: S.count }));
  }
  function share() {
    var url = location.href.split('#')[0], data = { title: 'Bhaktamar Stotra · Shiv Luminoso', text: t('shareText'), url: url };
    if (navigator.share) { navigator.share(data).catch(function (err) { if (err && err.name !== 'AbortError') copyLink(url); }); return; }
    copyLink(url);
  }
  function copyLink(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { toast(t('copied')); }, function () { toast(url); });
    else toast(url);
  }

  /* ---------- music: an original calm drone, silent until the visitor taps the button ---------- */
  var MUSIC = { on: false, els: [], cur: 0, next: null, timer: 0, ramp: 0, gain: 0, away: false };
  var XFADE = 6, VOL = 0.8;     // the file fades out and in over 6 seconds; the next copy starts as the last one fades
  function musicEl(i) {
    if (MUSIC.els[i]) return MUSIC.els[i];
    var a = new Audio(); a.preload = 'auto'; a.src = window.LUZ_AUDIO || (IMG + 'music/shiv-luminoso.mp3'); a.volume = MUSIC.gain;
    a.addEventListener('ended', function () {
      if (a !== MUSIC.els[MUSIC.cur]) return;
      if (MUSIC.next !== null) { MUSIC.cur = MUSIC.next; MUSIC.next = null; }
      else if (MUSIC.on) { a.currentTime = 0; a.play(); }
    });
    return (MUSIC.els[i] = a);
  }
  function musicGain() { MUSIC.els.forEach(function (a) { if (a) { try { a.volume = MUSIC.gain; } catch (e) {} } }); }
  function rampGain(to, ms, done) {
    clearInterval(MUSIC.ramp); var from = MUSIC.gain, t0 = Date.now();
    MUSIC.ramp = setInterval(function () {
      var k = Math.min(1, (Date.now() - t0) / ms); MUSIC.gain = from + (to - from) * k; musicGain();
      if (k >= 1) { clearInterval(MUSIC.ramp); if (done) done(); }
    }, 40);
  }
  function musicTick() {
    var a = MUSIC.els[MUSIC.cur];
    if (!MUSIC.on || !a || !a.duration || MUSIC.next !== null || a.paused) return;
    if (a.currentTime >= a.duration - XFADE - 0.1) {
      var o = MUSIC.cur ? 0 : 1, b = musicEl(o);
      try { b.currentTime = 0; } catch (e) {}
      var p = b.play(); if (p && p.catch) p.catch(function () {});
      MUSIC.next = o;
    }
  }
  function musicStart() {
    MUSIC.gain = 0; var a = musicEl(MUSIC.cur), p = a.play();
    if (p && p.catch) p.catch(function () { MUSIC.on = false; musicSync(); });   // the browser said no
    if (MUSIC.next !== null) { var q = musicEl(MUSIC.next).play(); if (q && q.catch) q.catch(function () {}); }
    rampGain(VOL, 1200);
    clearInterval(MUSIC.timer); MUSIC.timer = setInterval(musicTick, 400);
  }
  function musicStop() {
    rampGain(0, 500, function () { if (!MUSIC.on) { MUSIC.els.forEach(function (a) { if (a) a.pause(); }); clearInterval(MUSIC.timer); } });
  }
  function musicSync() {
    var b = document.querySelectorAll('[data-act="music"]');
    for (var i = 0; i < b.length; i++) b[i].setAttribute('aria-pressed', MUSIC.on);
  }
  function toggleMusic() {
    MUSIC.on = !MUSIC.on; MUSIC.away = false;
    if (MUSIC.on) musicStart(); else musicStop();
    musicSync(); toast(t(MUSIC.on ? 'musicOn' : 'musicOff'));
  }
  document.addEventListener('visibilitychange', function () {   // the music rests while the page is out of sight
    if (document.hidden) { if (MUSIC.on) { MUSIC.away = true; clearInterval(MUSIC.timer); MUSIC.els.forEach(function (a) { if (a) a.pause(); }); } }
    else if (MUSIC.on && MUSIC.away) { MUSIC.away = false; musicStart(); }
  });
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el) return;
    var a = el.getAttribute('data-act'), v = el.getAttribute('data-v');
    if (a === 'lang') { if (el.tagName === 'INPUT') { S.lang = v; store.set('lang', v); render(true); } else setLang(v); }
    else if (a === 'pron') { S.pron = !S.pron; store.set('pron', S.pron); render(true); }
    else if (a === 'tab') { S.tab = v; render(true); }
    else if (a === 'size') { S.size = parseFloat(v); store.set('size', S.size); render(true); }
    else if (a === 'count') count();
    else if (a === 'reset') { S.count = 0; S.rounds = 0; store.set('count', 0); store.set('rounds', 0); render(true); }
    else if (a === 'zoom') openZoom(el.getAttribute('data-n'));
    else if (a === 'zclose') closeZoom();
    else if (a === 'zimg') zoomEl.classList.toggle('big');
    else if (a === 'share') share();
    else if (a === 'rdzoom') { S.rdBig = !S.rdBig; render(true); }
    else if (a === 'rdretry') { var im = document.getElementById('rdimg'); if (im && cur && cur.n) { document.getElementById('rdfail').hidden = true; im.src = pageUrl(cur.n) + '?r=' + Date.now(); } }
    else if (a === 'music') toggleMusic();
    else if (a === 'back') { if (history.length > 1) history.back(); else location.hash = '#home'; }
  });
  document.addEventListener('change', function (e) {
    var el = e.target.closest('[data-act]'); if (!el) return;
    var a = el.getAttribute('data-act');
    if (a === 'sa') { S.sa = el.checked; store.set('sa', S.sa); render(true); }
    else if (a === 'pron2') { S.pron = el.checked; store.set('pron', S.pron); render(true); }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id !== 'q') return;
    S.q = e.target.value; document.getElementById('list').innerHTML = rows(S.q);
  });

  /* previous / next: arrow keys and swipe */
  function go(dir) {
    if (!cur || !cur.swipe || document.querySelector('.rd.big')) return;
    var n = cur.n + dir; if (n < 1 || n > (cur.max || 48)) return;
    location.hash = cur.swipe + n;
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeZoom(); return; }
    if (zoomEl || /INPUT|TEXTAREA/.test((e.target.tagName || ''))) return;
    if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1);
  });
  // The pictures (especially the yantras) are protected: stop the easy "save image" menu and dragging. This deters casual copying only.
  document.addEventListener('contextmenu', function (e) { if (e.target && (e.target.tagName === 'IMG' || (e.target.closest && e.target.closest('.rdpg')))) e.preventDefault(); });
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'rdgo') return;
    e.preventDefault();
    var v = parseInt(document.getElementById('rdn').value, 10);
    if (v >= 1 && v <= BK.pages) location.hash = '#read-' + v; else toast(t('goToPage') + ': 1–' + BK.pages);
  });
  document.addEventListener('dragstart', function (e) { if (e.target && e.target.tagName === 'IMG') e.preventDefault(); });
  var tx = 0, ty = 0;
  document.addEventListener('touchstart', function (e) { var p = e.changedTouches[0]; tx = p.clientX; ty = p.clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (zoomEl || e.target.closest('.dot')) return;
    var p = e.changedTouches[0], dx = p.clientX - tx, dy = p.clientY - ty;
    if (Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(dy)) go(dx < 0 ? 1 : -1);
  }, { passive: true });

  render(false);
})();
