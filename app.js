/* Thème 2 — Identité numérique · by Twagirumukiza */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var isMobile = function () { return window.matchMedia('(max-width: 900px)').matches; };

  /* ---------- Thème clair / sombre ---------- */
  var themeBtn = $('#themeBtn');
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    themeBtn.querySelector('.ico').textContent = t === 'dark' ? '☀' : '☾';
    themeBtn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    var m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0a1119' : '#0f2742');
  }
  applyTheme(root.getAttribute('data-theme') || 'light');
  themeBtn.addEventListener('click', function () {
    var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(t); store.set('t2-theme', t);
  });

  /* ---------- Taille du texte ---------- */
  var fs = store.get('t2-fs', 100);
  function applyFs(v) {
    fs = Math.max(80, Math.min(150, v));
    root.style.setProperty('--fs', fs + '%');
    $('#fsVal').textContent = fs + '%';
    store.set('t2-fs', fs);
  }
  applyFs(fs);
  $('#fsUp').addEventListener('click', function () { applyFs(fs + 10); });
  $('#fsDown').addEventListener('click', function () { applyFs(fs - 10); });
  $('#fsReset').addEventListener('click', function () { applyFs(100); });

  /* ---------- Menu burger (mobile) / menu rétractable (PC) ---------- */
  var menuBtn = $('#menuBtn'), overlay = $('#overlay'), sidebar = $('#sidebar');
  function setOpen(o) {
    document.body.classList.toggle('sb-open', o);
    overlay.hidden = !o;
    menuBtn.setAttribute('aria-expanded', o ? 'true' : 'false');
  }
  function toggleCollapsed(c) {
    root.classList.toggle('sb-collapsed', c);
    store.set('t2-sb', c);
    menuBtn.setAttribute('aria-expanded', c ? 'false' : 'true');
    $('#collapseBtn').setAttribute('aria-label', c ? 'Déplier le menu latéral' : 'Replier le menu latéral');
  }
  menuBtn.addEventListener('click', function () {
    if (isMobile()) setOpen(!document.body.classList.contains('sb-open'));
    else toggleCollapsed(!root.classList.contains('sb-collapsed'));
  });
  $('#collapseBtn').addEventListener('click', function () { toggleCollapsed(true); menuBtn.focus(); });
  overlay.addEventListener('click', function () { setOpen(false); });
  if (!isMobile()) menuBtn.setAttribute('aria-expanded', root.classList.contains('sb-collapsed') ? 'false' : 'true');
  window.addEventListener('resize', function () { if (!isMobile()) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setOpen(false); closeResults(); }
  });

  /* ---------- Onglets ---------- */
  var tabs = $$('.tab');
  var order = tabs.map(function (t) { return t.id.replace('tab-', ''); });
  var current = null;
  var done = store.get('t2-done', {});

  function labelOf(id) { return $('#tab-' + id).getAttribute('data-title'); }

  function showTab(id, opts) {
    opts = opts || {};
    if (order.indexOf(id) < 0) id = 'presentation';
    tabs.forEach(function (t) { t.hidden = t.id !== 'tab-' + id; });
    $$('.nav a').forEach(function (a) {
      var on = a.getAttribute('data-tab') === id;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    current = id;
    document.title = labelOf(id) + ' — Identité numérique · BTS SIO SISR';
    buildToc();
    if (!opts.keepScroll) window.scrollTo(0, 0);
    if (isMobile()) setOpen(false);
    updateScroll();
  }

  function routeFromHash() {
    var id = decodeURIComponent((location.hash || '').replace('#', '')) || 'presentation';
    showTab(id);
  }
  window.addEventListener('hashchange', routeFromHash);

  /* Marquer une séance comme terminée + navigation précédent / suivant */
  tabs.forEach(function (t) {
    var id = t.id.replace('tab-', '');
    var body = $('.tabbody', t);
    if (/^seance-/.test(id)) {
      var bar = document.createElement('div');
      bar.className = 'donebar';
      bar.innerHTML = '<label><input type="checkbox" data-done="' + id + '"> Séance terminée</label><span style="color:var(--muted);font-size:.85rem">Votre progression est mémorisée dans ce navigateur.</span>';
      body.appendChild(bar);
      var sa = document.createElement('div');
      sa.className = 'showall';
      sa.innerHTML = '<button type="button" data-showall="1">Afficher / masquer tous les corrigés</button>';
      var meta = $('.meta', body); if (meta) meta.parentNode.insertBefore(sa, meta.nextSibling);
    }
    var i = order.indexOf(id), pager = document.createElement('nav');
    pager.className = 'pager'; pager.setAttribute('aria-label', 'Navigation entre les onglets');
    var html = '';
    if (i > 0) html += '<a class="pv" href="#' + order[i - 1] + '"><small>← Précédent</small><b>' + labelOf(order[i - 1]) + '</b></a>';
    if (i < order.length - 1) html += '<a class="nx" href="#' + order[i + 1] + '"><small>Suivant →</small><b>' + labelOf(order[i + 1]) + '</b></a>';
    pager.innerHTML = html;
    body.appendChild(pager);
  });

  function refreshProgress() {
    var seances = order.filter(function (i) { return /^seance-/.test(i); });
    var n = 0;
    seances.forEach(function (s) {
      var a = $('.nav a[data-tab="' + s + '"]');
      var d = !!done[s];
      a.classList.toggle('done', d);
      if (d) n++;
      var cb = $('input[data-done="' + s + '"]'); if (cb) cb.checked = d;
    });
    $('#pcount').textContent = n + '/' + seances.length;
    $('#pfill').style.width = (100 * n / seances.length) + '%';
  }
  document.addEventListener('change', function (e) {
    var cb = e.target.closest && e.target.closest('input[data-done]');
    if (!cb) return;
    done[cb.getAttribute('data-done')] = cb.checked;
    store.set('t2-done', done); refreshProgress();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-showall]');
    if (b) {
      var ds = $$('details.corrige', $('#tab-' + current));
      var open = ds.some(function (d) { return !d.open; });
      ds.forEach(function (d) { d.open = open; });
    }
  });
  refreshProgress();

  /* ---------- Sommaire de la page (sidebar) ---------- */
  var tocBox = $('#toc'), tocList = $('#toc ul');
  function buildToc() {
    var hs = $$('h2', $('#tab-' + current));
    tocList.innerHTML = '';
    tocBox.hidden = hs.length < 2;
    hs.forEach(function (h) {
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + current; a.textContent = h.textContent; a.setAttribute('data-h', h.id);
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (isMobile()) setOpen(false);
      });
      li.appendChild(a); tocList.appendChild(li);
    });
  }
  function spy() {
    if (tocBox.hidden) return;
    var hs = $$('h2', $('#tab-' + current)), cur = null;
    hs.forEach(function (h) { if (h.getBoundingClientRect().top < 140) cur = h.id; });
    $$('a', tocList).forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-h') === cur); });
  }

  /* ---------- Barre de lecture, retour en haut ---------- */
  var readbar = $('#readbar'), toTop = $('#toTop');
  function updateScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    readbar.style.width = (h > 0 ? 100 * window.scrollY / h : 0) + '%';
    toTop.hidden = window.scrollY < 600;
    spy();
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------- Copier les commandes d'une console ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.copy');
    if (!b) return;
    var con = b.closest('.console');
    var text = $$('.pl2', con).map(function (n) { return n.textContent.replace(/^└─\$\s*/, ''); }).join('\n');
    function ok() { var o = b.textContent; b.textContent = 'Copié ✓'; setTimeout(function () { b.textContent = 'Copier'; }, 1600); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (er) {}
      document.body.removeChild(ta);
    }
  });

  /* ---------- Recherche plein texte ---------- */
  var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var index = [];
  tabs.forEach(function (t) {
    var id = t.id.replace('tab-', ''), cur = { tab: id, hid: null, title: labelOf(id), text: '' };
    index.push(cur);
    $$('.tabbody > *', t).forEach(function (el) {
      if (el.tagName === 'H2') { cur = { tab: id, hid: el.id, title: el.textContent, text: '' }; index.push(cur); }
      else if (!el.classList.contains('pager') && !el.classList.contains('donebar')) cur.text += ' ' + el.textContent;
    });
  });
  var input = $('#search'), results = $('#results');
  function closeResults() { results.hidden = true; }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  input.addEventListener('input', function () {
    var q = norm(input.value.trim());
    if (q.length < 2) { closeResults(); return; }
    var terms = q.split(/\s+/);
    var hits = index.map(function (e) {
      var nt = norm(e.title), nx = norm(e.text), s = 0;
      for (var i = 0; i < terms.length; i++) {
        var inT = nt.indexOf(terms[i]) >= 0, inX = nx.indexOf(terms[i]) >= 0;
        if (!inT && !inX) return null;
        s += (inT ? 5 : 0) + (inX ? 1 : 0);
      }
      return { e: e, s: s, p: nx.indexOf(terms[0]) };
    }).filter(Boolean).sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
    if (!hits.length) { results.innerHTML = '<div class="none">Aucun résultat pour « ' + esc(input.value) + ' ».</div>'; results.hidden = false; return; }
    results.innerHTML = hits.map(function (h) {
      var e = h.e, snip = '';
      if (h.p >= 0) {
        var raw = e.text.replace(/\s+/g, ' ').trim(), np = norm(raw).indexOf(terms[0]);
        var a = Math.max(0, np - 40), b = Math.min(raw.length, np + terms[0].length + 80);
        snip = (a > 0 ? '… ' : '') + esc(raw.slice(a, np)) + '<mark>' + esc(raw.slice(np, np + terms[0].length)) + '</mark>' + esc(raw.slice(np + terms[0].length, b)) + (b < raw.length ? ' …' : '');
      }
      return '<a href="#' + e.tab + '" role="option" data-h="' + (e.hid || '') + '"><div class="rt">' + esc(e.title) + '</div><div class="rs">' + esc(labelOf(e.tab)) + '</div>' + (snip ? '<div class="rx">' + snip + '</div>' : '') + '</a>';
    }).join('');
    results.hidden = false;
  });
  results.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    e.preventDefault();
    var tab = a.getAttribute('href').slice(1), h = a.getAttribute('data-h');
    closeResults(); input.value = '';
    if (location.hash.slice(1) !== tab) { history.pushState(null, '', '#' + tab); }
    showTab(tab);
    if (h) setTimeout(function () { var el = document.getElementById(h); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.search')) closeResults(); });
  document.addEventListener('keydown', function (e) {
    var tg = (e.target.tagName || '').toLowerCase();
    if (e.key === '/' && tg !== 'input' && tg !== 'textarea') { e.preventDefault(); input.focus(); }
  });

  /* ---------- QCM interactif ---------- */
  var qd = $('#qcm-data'), qbox = $('#qcm');
  if (qd && qbox) {
    var data = JSON.parse(qd.textContent);
    var render = function () {
      qbox.innerHTML = data.map(function (q, i) {
        return '<div class="q" data-i="' + i + '"><div class="qt">' + (i + 1) + '. ' + q.q + '</div>' +
          q.o.map(function (o, j) {
            return '<label><input type="radio" name="q' + i + '" value="' + j + '"><span><b>' + 'abc'[j] + ')</b> ' + o + '</span></label>';
          }).join('') + '<div class="fb" hidden></div></div>';
      }).join('') +
        '<div class="qbar"><button type="button" class="btn" id="qcheck">Corriger</button><button type="button" class="btn ghost" id="qreset">Recommencer</button><span class="score" id="qscore"></span></div>';
    };
    render();
    qbox.addEventListener('click', function (e) {
      if (e.target.id === 'qreset') { render(); return; }
      if (e.target.id !== 'qcheck') return;
      var score = 0, unanswered = 0;
      $$('.q', qbox).forEach(function (el) {
        var i = +el.getAttribute('data-i'), sel = $('input:checked', el), good = data[i].a;
        $$('label', el).forEach(function (l, j) { l.classList.remove('good', 'bad'); if (j === good) l.classList.add('good'); });
        var fb = $('.fb', el); fb.hidden = false;
        if (!sel) { unanswered++; el.className = 'q ko'; fb.textContent = 'Sans réponse. Bonne réponse : ' + 'abc'[good] + ').'; return; }
        if (+sel.value === good) { score++; el.className = 'q ok'; fb.textContent = 'Bonne réponse.'; }
        else { el.className = 'q ko'; sel.closest('label').classList.add('bad'); fb.textContent = 'Réponse incorrecte. Bonne réponse : ' + 'abc'[good] + ').'; }
      });
      $('#qscore').textContent = 'Score : ' + score + ' / ' + data.length + (unanswered ? ' (' + unanswered + ' sans réponse)' : '');
      $('#qscore').scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  /* ---------- Impression : déplier les corrigés ---------- */
  window.addEventListener('beforeprint', function () { $$('details.corrige').forEach(function (d) { d.setAttribute('data-was', d.open ? '1' : '0'); d.open = true; }); });
  window.addEventListener('afterprint', function () { $$('details.corrige').forEach(function (d) { d.open = d.getAttribute('data-was') === '1'; }); });

  /* ---------- Démarrage ---------- */
  routeFromHash();
})();
