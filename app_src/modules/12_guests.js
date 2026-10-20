/* Guests: RSVP status, party size, meal and table number; headcounts and per-table
 * counts; print. The public demo caps the list (DEMO_GUEST_LIMIT) — the one gated feature. */
(function (g) {
  var App = g.App = g.App || { views: {}, nav: [] };
  var C = App.core, D = App.data, h = C.h;
  var DEMO_GUEST_LIMIT = 10;
  var RSVP = [['pending', 'Waiting'], ['yes', 'Coming'], ['no', 'Declined']];

  function select(options, value, label) {
    var s = h('select', { attrs: { 'aria-label': label } });
    options.forEach(function (o) { s.appendChild(h('option', { value: o[0], text: o[1], selected: o[0] === value })); });
    return s;
  }
  function rsvpLabel(v) { return (RSVP.filter(function (r) { return r[0] === v; })[0] || RSVP[0])[1]; }

  App.views.guests = {
    navLabel: 'Guests',
    render: function (root) {
      root.dataset.activeView = 'guests';
      root.innerHTML = '';
      var guests = D.list('guests'), t = D.guestTotals();
      root.appendChild(h('h1', { text: 'Guests' }));
      root.appendChild(h('p', { class: 'sub', text: 'Who is invited, who is coming, what they eat and where they sit.' }));
      if (window.APP_DEMO_MODE) root.appendChild(C.banner('info', 'Demo: you can add up to ' + DEMO_GUEST_LIMIT + ' guests. The full version has no limit.'));

      var expected = D.wedding().guests;
      root.appendChild(h('div', { class: 'stat-grid' },
        C.stat('Invited', String(t.invited), expected ? 'of about ' + expected + ' planned' : 'people in total'),
        C.stat('Coming', String(t.yes), 'confirmed headcount'),
        C.stat('Waiting', String(t.pending), 'no reply yet'),
        C.stat('Declined', String(t.no))));

      var name = h('input', { type: 'text', id: 'guestName', attrs: { maxlength: '80', autocomplete: 'off' } });
      var party = h('input', { type: 'number', id: 'guestParty', value: '1', attrs: { min: '1', max: '20' } });
      var rsvp = select(RSVP, 'pending', 'RSVP'); rsvp.id = 'guestRsvp';
      var meal = h('input', { type: 'text', id: 'guestMeal', attrs: { maxlength: '40' } });
      var table = h('input', { type: 'text', id: 'guestTable', attrs: { maxlength: '20' } });
      var fName = C.field('guestName', 'Guest name', name), fParty = C.field('guestParty', 'People in this party', party);
      var form = h('div', { class: 'card' }, h('h2', { text: 'Add a guest' }), fName,
        h('div', { class: 'grid-2' }, fParty, C.field('guestRsvp', 'RSVP', rsvp)),
        h('div', { class: 'grid-2' }, C.field('guestMeal', 'Meal choice', meal, 'Optional'), C.field('guestTable', 'Table number or name', table, 'Optional')),
        h('button', { type: 'button', id: 'addGuestBtn', text: 'Add guest' }));
      form.querySelector('#addGuestBtn').addEventListener('click', function () {
        C.clearErrors(form);
        var nm = name.value.trim(), n = parseInt(party.value, 10);
        if (!nm) return C.setError(fName, 'Enter the guest’s name.');
        if (!(n >= 1 && n <= 20)) return C.setError(fParty, 'Enter between 1 and 20 people.');
        if (window.APP_DEMO_MODE && guests.length >= DEMO_GUEST_LIMIT) {
          form.parentNode.insertBefore(C.banner('warning', 'The demo is limited to ' + DEMO_GUEST_LIMIT + ' guests. The full version has no limit.'), form);
          return;
        }
        var all = D.list('guests');
        all.push({ id: C.uid(), name: nm, party: n, rsvp: rsvp.value, meal: meal.value.trim(), table: table.value.trim() });
        D.save('guests', all);
        App.views.guests.render(root);
      });
      var side = h('div', { class: 'side' }, form);

      var listCard = h('div', { class: 'card' }, h('h2', { text: 'Guest list' }));
      if (!guests.length) {
        listCard.appendChild(C.emptyState('No guests yet', 'Add your first guest above.'));
      } else {
        var tbody = h('tbody');
        guests.forEach(function (x) {
          var sel = select(RSVP, x.rsvp || 'pending', 'RSVP for ' + x.name);
          sel.addEventListener('change', function () {
            var all = D.list('guests');
            all.forEach(function (y) { if (y.id === x.id) y.rsvp = sel.value; });
            D.save('guests', all);
            App.views.guests.render(root);
          });
          var del = h('button', { type: 'button', class: 'ghost small', text: 'Remove', attrs: { 'aria-label': 'Remove ' + x.name } });
          del.addEventListener('click', function () {
            D.save('guests', D.list('guests').filter(function (y) { return y.id !== x.id; }));
            App.views.guests.render(root);
          });
          tbody.appendChild(h('tr', null, h('td', { text: x.name }), h('td', { text: String(x.party || 1) }), h('td', null, sel),
            h('td', { text: x.meal || '—' }), h('td', { text: x.table || '—' }), h('td', { class: 'no-print' }, del)));
        });
        var tbl = h('table', { class: 'table cardrows', id: 'guestTable-list' },
          h('thead', null, h('tr', null, ['Name', 'People', 'RSVP', 'Meal', 'Table', ''].map(function (x) { return h('th', { text: x }); }))), tbody);
        listCard.appendChild(C.tableWrap(tbl));
        listCard.appendChild(h('button', { type: 'button', id: 'printGuestsBtn', class: 'ghost', text: 'Print guest list', on: { click: function () {
          // Printable copy: plain text for RSVP instead of dropdowns, no Remove column.
          var pt = h('table', { class: 'table' },
            h('thead', null, h('tr', null, ['Name', 'People', 'RSVP', 'Meal', 'Table'].map(function (x) { return h('th', { text: x }); }))),
            h('tbody', null, D.list('guests').map(function (x) {
              return h('tr', null, h('td', { text: x.name }), h('td', { text: String(x.party || 1) }), h('td', { text: rsvpLabel(x.rsvp) }),
                h('td', { text: x.meal || '' }), h('td', { text: x.table || '' }));
            })));
          C.printSheet('Guest list — ' + t.yes + ' coming, ' + t.pending + ' waiting', pt);
        } } }));
      }
      var main = h('div', { class: 'main' }, listCard);

      var tableNames = Object.keys(t.tables).sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
      var tcard = h('div', { class: 'card' }, h('h2', { text: 'People per table' }));
      if (!tableNames.length) tcard.appendChild(C.emptyState('No tables assigned', 'Give guests a table number and the headcount per table appears here.'));
      else {
        var ul = h('ul');
        tableNames.forEach(function (n) { ul.appendChild(h('li', null, h('span', { text: 'Table ' + n }), h('strong', { text: String(t.tables[n]) }))); });
        tcard.appendChild(ul);
      }
      side.appendChild(tcard);
      root.appendChild(h('div', { class: 'split' }, side, main));
    },
  };
  App.nav.push('guests');
})(window);
