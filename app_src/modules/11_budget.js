/* Budget: categories with estimated / actual / paid, a left-to-spend column and an
 * over-budget warning (approved opportunity: overspend warnings). */
(function (g) {
  var App = g.App = g.App || { views: {}, nav: [] };
  var C = App.core, D = App.data, h = C.h;

  function moneyInput(cat, key, label, root) {
    var inp = h('input', { type: 'text', class: 'cell-input', value: C.inputMoney(cat[key]), attrs: { inputmode: 'decimal', 'aria-label': label + ' for ' + cat.name } });
    inp.addEventListener('change', function () {
      var v = inp.value.trim() === '' ? 0 : C.parseMoney(inp.value);
      if (v == null || v < 0) { inp.value = C.inputMoney(cat[key]); inp.classList.add('invalid'); return; }
      var all = D.list('budget');
      all.forEach(function (c) { if (c.id === cat.id) c[key] = v; });
      D.save('budget', all);
      App.views.budget.render(root);
    });
    return inp;
  }

  App.views.budget = {
    navLabel: 'Budget',
    render: function (root) {
      root.dataset.activeView = 'budget';
      root.innerHTML = '';
      var cats = D.list('budget'), t = D.budgetTotals();
      root.appendChild(h('h1', { text: 'Budget' }));
      root.appendChild(h('p', { class: 'sub', text: 'Estimate each category, then enter what you actually spend and what you have already paid.' }));

      if (t.over.length) root.appendChild(C.banner('warning', 'Over budget in: ' + t.over.map(function (c) { return c.name; }).join(', ') + '.'));
      if (t.budget > 0 && t.planGap > 0) root.appendChild(C.banner('warning', 'Your estimates add up to ' + C.fmt(t.planGap) + ' more than your total budget of ' + C.fmt(t.budget) + '.'));

      root.appendChild(h('div', { class: 'stat-grid' },
        C.stat('Total budget', t.budget ? C.fmt(t.budget) : '—', t.budget ? '' : 'Set it in Settings'),
        C.stat('Estimated', C.fmt(t.est)), C.stat('Actual spent', C.fmt(t.actual)),
        C.stat('Paid so far', C.fmt(t.paid)),
        C.stat('Budget left', t.budget ? C.fmt(t.remaining) : '—', 'total budget minus actual', t.budget && t.remaining < 0 ? 'bad' : '')));

      var card = h('div', { class: 'card' });
      if (!cats.length) {
        card.appendChild(C.emptyState('No categories yet', 'Add your first category below, or finish the setup on the Overview view.'));
      } else {
        var tbody = h('tbody');
        cats.forEach(function (c) {
          var left = (c.est || 0) - (c.actual || 0);
          var del = h('button', { type: 'button', class: 'ghost small', text: 'Remove', attrs: { 'aria-label': 'Remove ' + c.name } });
          del.addEventListener('click', function () {
            C.confirmDialog('Remove "' + c.name + '"?', 'This removes the category and its amounts.', 'Remove').then(function (ok) {
              if (!ok) return;
              D.save('budget', D.list('budget').filter(function (x) { return x.id !== c.id; }));
              App.views.budget.render(root);
            });
          });
          tbody.appendChild(h('tr', { class: left < 0 ? 'row-over' : '' },
            h('td', { text: c.name }),
            h('td', null, moneyInput(c, 'est', 'Estimate', root)),
            h('td', null, moneyInput(c, 'actual', 'Actual', root)),
            h('td', null, moneyInput(c, 'paid', 'Paid', root)),
            h('td', { class: left < 0 ? 'neg' : '', text: left < 0 ? 'Over by ' + C.fmt(-left) : C.fmt(left) + ' left' }),
            h('td', null, del)));
        });
        tbody.appendChild(h('tr', { class: 'total-row' },
          h('td', { text: 'Total' }), h('td', { text: C.fmt(t.est) }), h('td', { text: C.fmt(t.actual) }),
          h('td', { text: C.fmt(t.paid) }), h('td', { text: C.fmt(t.est - t.actual) + ' left' }), h('td')));
        card.appendChild(C.tableWrap(h('table', { class: 'table' },
          h('thead', null, h('tr', null, ['Category', 'Estimated', 'Actual', 'Paid', 'Left to spend', ''].map(function (x) { return h('th', { text: x }); }))),
          tbody)));
      }
      var main = h('div', { class: 'main' }, card);

      var name = h('input', { type: 'text', id: 'catName', attrs: { maxlength: '60' } });
      var est = h('input', { type: 'text', id: 'catEst', attrs: { inputmode: 'decimal' } });
      var fName = C.field('catName', 'Category name', name), fEst = C.field('catEst', 'Estimated amount', est);
      var add = h('div', { class: 'card' }, h('h2', { text: 'Add a category' }), fName, fEst,
        h('button', { type: 'button', id: 'addCatBtn', text: 'Add category' }));
      add.querySelector('#addCatBtn').addEventListener('click', function () {
        C.clearErrors(add);
        var nm = name.value.trim(), v = est.value.trim() === '' ? 0 : C.parseMoney(est.value);
        if (!nm) return C.setError(fName, 'Give the category a name.');
        if (v == null || v < 0) return C.setError(fEst, 'Enter the estimate as a number, or leave it empty.');
        var all = D.list('budget');
        all.push({ id: C.uid(), name: nm, est: v, actual: 0, paid: 0 });
        D.save('budget', all);
        App.views.budget.render(root);
      });
      root.appendChild(h('div', { class: 'split' }, h('div', { class: 'side' }, add), main));
    },
  };
  App.nav.push('budget');
})(window);
