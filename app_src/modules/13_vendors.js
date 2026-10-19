/* Vendors: contact, quote, deposit and the date it is due. */
(function (g) {
  var App = g.App = g.App || { views: {}, nav: [] };
  var C = App.core, D = App.data, h = C.h;

  App.views.vendors = {
    navLabel: 'Vendors',
    render: function (root) {
      root.dataset.activeView = 'vendors';
      root.innerHTML = '';
      var vendors = D.list('vendors'), t = D.vendorTotals();
      root.appendChild(h('h1', { text: 'Vendors' }));
      root.appendChild(h('p', { class: 'sub', text: 'Everyone you are hiring, what they quoted and which deposits are still due.' }));

      root.appendChild(h('div', { class: 'stat-grid' },
        C.stat('Total quotes', C.fmt(t.quote), vendors.length + (vendors.length === 1 ? ' vendor' : ' vendors')),
        C.stat('Deposits paid', C.fmt(t.depositPaid)),
        C.stat('Deposits still due', C.fmt(t.depositDue), t.next ? 'Next: ' + t.next.name : 'None due')));

      var name = h('input', { type: 'text', id: 'vendorName', attrs: { maxlength: '80' } });
      var kind = h('input', { type: 'text', id: 'vendorKind', attrs: { maxlength: '40' } });
      var contact = h('input', { type: 'text', id: 'vendorContact', attrs: { maxlength: '120' } });
      var quote = h('input', { type: 'text', id: 'vendorQuote', attrs: { inputmode: 'decimal' } });
      var deposit = h('input', { type: 'text', id: 'vendorDeposit', attrs: { inputmode: 'decimal' } });
      var due = h('input', { type: 'date', id: 'vendorDue' });
      var fName = C.field('vendorName', 'Vendor name', name), fQuote = C.field('vendorQuote', 'Quoted price', quote), fDep = C.field('vendorDeposit', 'Deposit amount', deposit);
      var form = h('div', { class: 'card' }, h('h2', { text: 'Add a vendor' }), fName,
        h('div', { class: 'grid-2' }, C.field('vendorKind', 'What they do', kind, 'For example photographer, caterer'), C.field('vendorContact', 'Phone or email', contact)),
        h('div', { class: 'grid-2' }, fQuote, fDep),
        C.field('vendorDue', 'Deposit due date', due, 'Optional'),
        h('button', { type: 'button', id: 'addVendorBtn', text: 'Add vendor' }));
      form.querySelector('#addVendorBtn').addEventListener('click', function () {
        C.clearErrors(form);
        var nm = name.value.trim();
        var q = quote.value.trim() === '' ? 0 : C.parseMoney(quote.value);
        var d = deposit.value.trim() === '' ? 0 : C.parseMoney(deposit.value);
        if (!nm) return C.setError(fName, 'Enter the vendor’s name.');
        if (q == null || q < 0) return C.setError(fQuote, 'Enter the quote as a number, or leave it empty.');
        if (d == null || d < 0) return C.setError(fDep, 'Enter the deposit as a number, or leave it empty.');
        var all = D.list('vendors');
        all.push({ id: C.uid(), name: nm, kind: kind.value.trim(), contact: contact.value.trim(), quote: q, deposit: d, due: C.parseISO(due.value) ? due.value : '', depositPaid: false });
        D.save('vendors', all);
        App.views.vendors.render(root);
      });
      root.appendChild(form);

      var card = h('div', { class: 'card' }, h('h2', { text: 'Your vendors' }));
      if (!vendors.length) {
        card.appendChild(C.emptyState('No vendors yet', 'Add the venue, photographer or caterer above.'));
      } else {
        var tbody = h('tbody');
        vendors.slice().sort(function (a, b) { return (a.due || '9999') < (b.due || '9999') ? -1 : 1; }).forEach(function (v) {
          var paid = h('input', { type: 'checkbox', checked: !!v.depositPaid, attrs: { 'aria-label': 'Deposit paid for ' + v.name } });
          paid.addEventListener('change', function () {
            var all = D.list('vendors');
            all.forEach(function (x) { if (x.id === v.id) x.depositPaid = paid.checked; });
            D.save('vendors', all);
            App.views.vendors.render(root);
          });
          var del = h('button', { type: 'button', class: 'ghost small', text: 'Remove', attrs: { 'aria-label': 'Remove ' + v.name } });
          del.addEventListener('click', function () {
            D.save('vendors', D.list('vendors').filter(function (x) { return x.id !== v.id; }));
            App.views.vendors.render(root);
          });
          var overdue = !v.depositPaid && v.due && C.daysUntil(v.due) < 0;
          tbody.appendChild(h('tr', null,
            h('td', null, h('strong', { text: v.name }), v.kind ? h('div', { class: 'caption', text: v.kind }) : null),
            h('td', { text: v.contact || '—' }), h('td', { text: v.quote ? C.fmt(v.quote) : '—' }),
            h('td', { text: v.deposit ? C.fmt(v.deposit) : '—' }),
            h('td', { class: overdue ? 'neg' : '', text: v.due ? C.fmtDate(C.parseISO(v.due)) + (overdue ? ' (overdue)' : '') : '—' }),
            h('td', null, paid), h('td', null, del)));
        });
        card.appendChild(C.tableWrap(h('table', { class: 'table' },
          h('thead', null, h('tr', null, ['Vendor', 'Contact', 'Quote', 'Deposit', 'Due', 'Paid', ''].map(function (x) { return h('th', { text: x }); }))),
          tbody)));
      }
      root.appendChild(card);
    },
  };
  App.nav.push('vendors');
})(window);
