/* Shared helpers: safe DOM building (user-entered names are never parsed as HTML),
 * money in whole cents, dates, ids, the starting budget split and checklist, and a
 * print helper. Every view module below composes these. */
(function (g) {
  var App = g.App = g.App || { views: {}, nav: [] };

  /** h('div', {class, text, attrs:{}, on:{click}, dataset:{}}, ...children) */
  function h(tag, props) {
    var el = document.createElement(tag);
    var p = props || {};
    Object.keys(p).forEach(function (k) {
      var v = p[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'on') Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
      else if (k === 'dataset') Object.keys(v).forEach(function (d) { el.dataset[d] = v[d]; });
      else if (k === 'attrs') Object.keys(v).forEach(function (a) { if (v[a] != null && v[a] !== false) el.setAttribute(a, v[a] === true ? '' : v[a]); });
      else el[k] = v;
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, child) {
    if (child == null || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(el, c); }); return; }
    el.appendChild(typeof child === 'string' || typeof child === 'number' ? document.createTextNode(String(child)) : child);
  }

  /* ---------- Money (whole cents) ---------- */
  function currency() { return App.store.get('currency', 'USD'); }
  function fmt(cents) {
    var c = Math.round(cents || 0);
    var whole = c % 100 === 0;
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency', currency: currency(),
        minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2,
      }).format(c / 100);
    } catch (e) {
      return (c / 100).toFixed(whole ? 0 : 2);
    }
  }
  /** "1,234.50" / "1.234,50" / "12" -> cents, or null when it is not a number. */
  function parseMoney(str) {
    var s = String(str == null ? '' : str).replace(/[^\d.,-]/g, '');
    if (!s || s === '-' || s === '.' || s === ',') return null;
    var hasDot = s.indexOf('.') >= 0, hasComma = s.indexOf(',') >= 0;
    if (hasDot && hasComma) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (hasComma) {
      s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
    }
    var n = parseFloat(s);
    return isFinite(n) ? Math.round(n * 100) : null;
  }
  function inputMoney(cents) {
    if (!cents) return '';
    var v = cents / 100;
    return v % 1 === 0 ? String(v) : v.toFixed(2);
  }

  /* ---------- Dates ---------- */
  function parseISO(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function daysUntil(iso) {
    var d = parseISO(iso);
    return d ? Math.round((d - today()) / 86400000) : null;
  }
  function fmtDate(d) {
    try { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(d); }
    catch (e) { return d.toDateString(); }
  }
  function monthsBefore(iso, months) {
    var d = parseISO(iso);
    if (!d) return null;
    return new Date(d.getFullYear(), d.getMonth() - months, d.getDate());
  }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---------- Starting data (all of it is editable by the buyer) ---------- */
  var BUDGET_SPLIT = [
    ['Venue & catering', 45], ['Photo & video', 10], ['Attire & beauty', 9],
    ['Flowers & decor', 8], ['Music & entertainment', 7], ['Rings', 3],
    ['Stationery & invitations', 3], ['Officiant & legal', 2], ['Transport', 2],
    ['Gifts & favors', 2], ['Miscellaneous & buffer', 9],
  ];
  /** [title, months before the wedding] */
  var TASKS = [
    ['Decide your total budget and who is contributing', 12], ['Draft a first guest list', 12], ['Pick a season and a rough date range', 12],
    ['Book the venue', 10], ['Book a photographer / videographer', 10],
    ['Book the caterer (if the venue does not include one)', 9], ['Start looking at attire', 9], ['Book the officiant', 9],
    ['Order save-the-dates and invitations', 6], ['Book music or a DJ', 6], ['Book the florist', 6], ['Plan the honeymoon', 6],
    ['Order attire', 4], ['Book transport', 4], ['Plan the order of the ceremony', 4],
    ['Send invitations', 3], ['Arrange rooms for out-of-town guests', 3],
    ['Choose the final menu', 2], ['Check the marriage license requirements where you are marrying', 2], ['Buy the rings', 2],
    ['Confirm the final headcount with the caterer', 1], ['Make the seating plan', 1], ['Confirm arrival times with every vendor', 1], ['Write your vows', 1],
    ['Pay the final vendor balances', 0], ['Give the day-of timeline to your wedding party', 0], ['Pack for the wedding day', 0],
  ];
  var TIMELINE = [
    ['09:00', 'Hair and makeup begin', ''], ['12:00', 'Photographer arrives', ''], ['13:30', 'Get dressed', ''],
    ['14:30', 'Guests arrive and are seated', ''], ['15:00', 'Ceremony', ''], ['15:45', 'Group photos', ''],
    ['17:00', 'Reception begins', ''], ['18:00', 'Dinner', ''], ['19:30', 'First dance and speeches', ''], ['23:00', 'Last dance and send-off', ''],
  ];

  /** Splits `total` cents across the budget percentages; the cents always add back up exactly. */
  function splitBudget(total) {
    var out = [], used = 0;
    BUDGET_SPLIT.forEach(function (row, i) {
      var amt = i === BUDGET_SPLIT.length - 1 ? total - used : Math.round(total * row[1] / 100);
      used += amt;
      out.push({ id: uid(), name: row[0], est: amt, actual: 0, paid: 0 });
    });
    return out;
  }

  /* ---------- Small shared UI pieces ---------- */
  function field(id, label, control, help) {
    return h('div', { class: 'field' },
      h('label', { attrs: { for: id }, text: label }), control,
      help ? h('span', { class: 'help', text: help }) : null,
      h('span', { class: 'field-error', attrs: { role: 'alert' } }));
  }
  function setError(fieldEl, message) {
    fieldEl.classList.add('has-error');
    fieldEl.querySelector('.field-error').textContent = message;
    var c = fieldEl.querySelector('input,select');
    if (c) { c.setAttribute('aria-invalid', 'true'); c.focus(); }
  }
  function clearErrors(root) {
    root.querySelectorAll('.field.has-error').forEach(function (f) {
      f.classList.remove('has-error');
      f.querySelector('.field-error').textContent = '';
      var c = f.querySelector('input,select');
      if (c) c.removeAttribute('aria-invalid');
    });
  }
  function banner(kind, text) { return h('div', { class: 'banner ' + kind, attrs: { role: kind === 'error' || kind === 'warning' ? 'alert' : 'status' }, text: text }); }
  function stat(label, value, sub, tone) {
    return h('div', { class: 'stat' + (tone ? ' ' + tone : '') },
      h('span', { class: 'stat-label', text: label }), h('strong', { class: 'stat-value', text: value }),
      sub ? h('span', { class: 'stat-sub', text: sub }) : null);
  }
  function emptyState(title, text) {
    return h('div', { class: 'empty-state' }, h('strong', { text: title }), text ? h('span', { text: text }) : null);
  }
  function tableWrap(table) { return h('div', { class: 'table-scroll' }, table); }

  /** Native <dialog> confirm. Resolves true on confirm. */
  function confirmDialog(title, message, confirmLabel) {
    return new Promise(function (resolve) {
      var done = false;
      var dlg = h('dialog', { class: 'modal' });
      function finish(v) { done = true; resolve(v); if (dlg.open) dlg.close(); }
      dlg.appendChild(h('div', { class: 'modal-header', text: title }));
      dlg.appendChild(h('div', { class: 'modal-body', text: message }));
      dlg.appendChild(h('div', { class: 'modal-footer' },
        h('button', { type: 'button', class: 'ghost', text: 'Cancel', on: { click: function () { finish(false); } } }),
        h('button', { type: 'button', class: 'danger', text: confirmLabel || 'Confirm', on: { click: function () { finish(true); } } })));
      dlg.addEventListener('close', function () { dlg.remove(); if (!done) resolve(false); });
      document.body.appendChild(dlg);
      dlg.showModal();
    });
  }

  /** Prints just `title` + a copy of `node` (nothing else on the page). */
  function printSheet(title, node) {
    var old = document.getElementById('print-area');
    if (old) old.remove();
    var area = h('div', { id: 'print-area' }, h('h1', { text: title }), node.cloneNode(true));
    document.body.appendChild(area);
    document.body.classList.add('printing');
    var cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove('printing');
      area.remove();
    }
    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 60000);
    window.print();
  }

  App.core = {
    h: h, fmt: fmt, parseMoney: parseMoney, inputMoney: inputMoney,
    parseISO: parseISO, today: today, daysUntil: daysUntil, fmtDate: fmtDate, monthsBefore: monthsBefore,
    uid: uid, splitBudget: splitBudget, TASKS: TASKS, TIMELINE: TIMELINE, BUDGET_SPLIT: BUDGET_SPLIT,
    field: field, setError: setError, clearErrors: clearErrors, banner: banner, stat: stat,
    emptyState: emptyState, tableWrap: tableWrap, confirmDialog: confirmDialog, printSheet: printSheet,
  };
})(window);
