/* Settings: wedding details, display (currency + light/dark), and data (backup,
 * restore, reset). Tabs follow the shared role=tablist convention (App.ui.initTabs). */
(function (g) {
  var App = g.App = g.App || { views: {}, nav: [] };
  var C = App.core, D = App.data, h = C.h;

  function tab(id, label, selected) {
    return h('button', { type: 'button', id: 'tab-' + id, attrs: { role: 'tab', 'aria-controls': 'panel-' + id, 'aria-selected': selected ? 'true' : 'false' }, text: label });
  }
  function panel(id, hidden) {
    return h('div', { id: 'panel-' + id, attrs: { role: 'tabpanel', 'aria-labelledby': 'tab-' + id }, hidden: !!hidden });
  }

  App.views.settings = {
    navLabel: 'Settings',
    render: function (root) {
      root.dataset.activeView = 'settings';
      root.innerHTML = '';
      var w = D.wedding();
      root.appendChild(h('h1', { text: 'Settings' }));
      root.appendChild(h('p', { class: 'sub', text: 'Your wedding details, how the app looks, and your data. Everything stays on this device.' }));
      root.appendChild(h('div', { class: 'tabs', attrs: { role: 'tablist' } }, tab('wedding', 'Wedding', true), tab('display', 'Display', false), tab('data', 'Your data', false)));

      /* --- Wedding --- */
      var pW = panel('wedding', false);
      var date = h('input', { type: 'date', id: 'setDate', value: w.date || '' });
      var budget = h('input', { type: 'text', id: 'setBudget', value: C.inputMoney(w.budget), attrs: { inputmode: 'decimal' } });
      var guests = h('input', { type: 'number', id: 'setGuests', value: w.guests ? String(w.guests) : '', attrs: { min: '0', max: '2000' } });
      var fDate = C.field('setDate', 'Wedding date', date), fBudget = C.field('setBudget', 'Total budget', budget, 'Changing this does not rewrite your category estimates.'), fGuests = C.field('setGuests', 'Expected number of guests', guests);
      pW.appendChild(fDate); pW.appendChild(fBudget); pW.appendChild(fGuests);
      var msg = h('div');
      pW.appendChild(h('button', { type: 'button', id: 'saveDetailsBtn', text: 'Save details', on: { click: function () {
        C.clearErrors(pW); msg.innerHTML = '';
        var b = budget.value.trim() === '' ? 0 : C.parseMoney(budget.value);
        var n = guests.value.trim() === '' ? 0 : parseInt(guests.value, 10);
        if (date.value && !C.parseISO(date.value)) return C.setError(fDate, 'Pick a valid date.');
        if (b == null || b < 0) return C.setError(fBudget, 'Enter the budget as a number.');
        if (!(n >= 0 && n <= 2000)) return C.setError(fGuests, 'Enter a guest count between 0 and 2000.');
        D.saveWedding({ setupDone: true, date: date.value, budget: b, guests: n });
        msg.appendChild(C.banner('success', 'Saved.'));
      } } }));
      pW.appendChild(msg);
      root.appendChild(pW);

      /* --- Display --- */
      var pD = panel('display', true);
      var cur = h('select', { id: 'setCurrency', attrs: { 'aria-label': 'Currency' } });
      D.CURRENCIES.forEach(function (c) { cur.appendChild(h('option', { value: c, text: c, selected: c === App.store.get('currency', 'USD') })); });
      cur.addEventListener('change', function () { App.store.set('currency', cur.value); });
      pD.appendChild(C.field('setCurrency', 'Currency', cur, 'Only changes how amounts are shown.'));
      var themeBtn = h('button', { type: 'button', id: 'setThemeBtn', class: 'ghost' });
      function themeLabel() { themeBtn.textContent = App.store.get('theme', 'light') === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'; }
      themeLabel();
      themeBtn.addEventListener('click', function () {
        var next = App.store.get('theme', 'light') === 'dark' ? 'light' : 'dark';
        App.store.set('theme', next);
        document.documentElement.setAttribute('data-theme', next);
        themeLabel();
      });
      pD.appendChild(h('div', { class: 'field' }, h('label', { text: 'Appearance' }), themeBtn));
      root.appendChild(pD);

      /* --- Data --- */
      var pDa = panel('data', true);
      pDa.appendChild(h('p', { text: 'There is no account. Your plan lives in this browser. Save a backup file to move to another device or to keep a copy.' }));
      pDa.appendChild(h('div', { class: 'row wrap' },
        h('button', { type: 'button', id: 'settingsExportBtn', text: 'Export backup', on: { click: function () { document.getElementById('exportBtn').click(); } } }),
        h('button', { type: 'button', id: 'settingsImportBtn', class: 'ghost', text: 'Import backup', on: { click: function () { document.getElementById('importBtn').click(); } } })));
      var counts = [['Budget categories', D.list('budget').length], ['Guests', D.list('guests').length], ['Vendors', D.list('vendors').length],
        ['Checklist tasks', D.list('tasks').length], ['Timeline events', D.list('events').length]];
      pDa.appendChild(C.tableWrap(h('table', { class: 'table' }, h('thead', null, h('tr', null, h('th', { text: 'Saved on this device' }), h('th', { text: 'Count' }))),
        h('tbody', null, counts.map(function (r) { return h('tr', null, h('td', { text: r[0] }), h('td', { text: String(r[1]) })); })))));
      pDa.appendChild(C.banner('warning', 'Resetting deletes your whole plan from this device. Export a backup first if you might want it back.'));
      pDa.appendChild(h('button', { type: 'button', id: 'resetBtn', class: 'danger', text: 'Reset all data', on: { click: function () {
        C.confirmDialog('Reset everything?', 'This deletes your budget, guests, vendors, checklist and timeline from this device.', 'Delete everything').then(function (ok) {
          if (!ok) return;
          ['wedding', 'budget', 'guests', 'vendors', 'tasks', 'events'].forEach(function (k) { App.store.set(k, k === 'wedding' ? { setupDone: false, date: '', budget: 0, guests: 0 } : []); });
          location.hash = '#overview';
          AppRouter.init();
        });
      } } }));
      root.appendChild(pDa);

      App.ui.initTabs(root);
    },
  };
  App.nav.push('settings');
})(window);
