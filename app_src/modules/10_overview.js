/* Overview: first-launch guided setup, then the countdown and the numbers that matter. */
(function (g) {
  var App = g.App = g.App || { views: {}, nav: [] };
  var C = App.core, D = App.data, h = C.h;

  function renderSetup(root) {
    var date = h('input', { type: 'date', id: 'setupDate' });
    var budget = h('input', { type: 'text', id: 'setupBudget', attrs: { inputmode: 'decimal', placeholder: 'e.g. 15000' } });
    var guests = h('input', { type: 'number', id: 'setupGuests', attrs: { min: '1', max: '2000', placeholder: 'e.g. 80' } });
    var fDate = C.field('setupDate', 'Wedding date', date, 'A rough date is fine — you can change it in Settings.');
    var fBudget = C.field('setupBudget', 'Total budget', budget, 'Everything you plan to spend. We split it across typical categories; change any amount afterwards.');
    var fGuests = C.field('setupGuests', 'Expected number of guests', guests);
    var form = h('div', { class: 'card' },
      h('h2', { text: 'Start your plan in five minutes' }),
      h('p', { class: 'sub', text: 'Three answers fill in your budget categories and a month-by-month checklist. Everything stays on this device.' }),
      fDate, fBudget, fGuests,
      h('div', { class: 'row' },
        h('button', { type: 'button', id: 'setupBtn', text: 'Create my plan' }),
        h('button', { type: 'button', id: 'skipSetupBtn', class: 'ghost', text: 'Start from a blank plan' })));
    root.appendChild(form);

    form.querySelector('#setupBtn').addEventListener('click', function () {
      C.clearErrors(form);
      var d = date.value, total = C.parseMoney(budget.value), n = parseInt(guests.value, 10);
      if (!C.parseISO(d)) return C.setError(fDate, 'Pick the wedding date.');
      if (total == null || total <= 0) return C.setError(fBudget, 'Enter your total budget as a number above zero.');
      if (!(n >= 1 && n <= 2000)) return C.setError(fGuests, 'Enter a guest count between 1 and 2000.');
      D.saveWedding({ setupDone: true, date: d, budget: total, guests: n });
      D.save('budget', C.splitBudget(total));
      D.save('tasks', C.TASKS.map(function (t) { return { id: C.uid(), title: t[0], months: t[1], done: false }; }));
      App.views.overview.render(root);
    });
    form.querySelector('#skipSetupBtn').addEventListener('click', function () {
      D.saveWedding({ setupDone: true, date: '', budget: 0, guests: 0 });
      App.views.overview.render(root);
    });
  }

  function countdown(w) {
    var n = C.daysUntil(w.date);
    if (n == null) return C.stat('Days to go', '—', 'Add your wedding date in Settings');
    if (n > 1) return C.stat('Days to go', String(n), C.fmtDate(C.parseISO(w.date)));
    if (n === 1) return C.stat('Days to go', '1', 'Tomorrow');
    if (n === 0) return C.stat('Days to go', 'Today', 'Congratulations!');
    return C.stat('Wedding date', 'Passed', C.fmtDate(C.parseISO(w.date)));
  }

  function renderDash(root) {
    var w = D.wedding(), b = D.budgetTotals(), gt = D.guestTotals(), vt = D.vendorTotals(), tt = D.taskTotals();
    root.appendChild(h('p', { class: 'sub', text: 'Your wedding at a glance.' }));

    var warnings = [];
    if (b.over.length) warnings.push(b.over.length + (b.over.length === 1 ? ' budget category is' : ' budget categories are') + ' over its estimate.');
    if (b.budget > 0 && b.planGap > 0) warnings.push('Your category estimates add up to ' + C.fmt(b.planGap) + ' more than your total budget.');
    warnings.forEach(function (t) { root.appendChild(C.banner('warning', t)); });

    var hasBudget = b.budget > 0;
    root.appendChild(h('div', { class: 'stat-grid' },
      countdown(w),
      C.stat('Budget left', hasBudget ? C.fmt(b.remaining) : '—', hasBudget ? 'of ' + C.fmt(b.budget) + ' total · ' + C.fmt(b.actual) + ' spent' : 'Add a total budget in Settings', hasBudget && b.remaining < 0 ? 'bad' : ''),
      C.stat('Guests confirmed', String(gt.yes), gt.invited ? 'of ' + gt.invited + ' invited · ' + gt.pending + ' waiting to reply' : 'No guests added yet'),
      C.stat('Checklist', tt.total ? tt.done + ' / ' + tt.total : '—', tt.total ? 'tasks done' : 'No tasks yet'),
      C.stat('Deposits still due', C.fmt(vt.depositDue), vt.next ? 'Next: ' + vt.next.name + (vt.next.due ? ' by ' + C.fmtDate(C.parseISO(vt.next.due)) : '') : 'No deposits due')));

    var next = D.list('tasks').filter(function (t) { return !t.done; })
      .sort(function (a, b2) { return b2.months - a.months; }).slice(0, 5);
    var card = h('div', { class: 'card' }, h('h2', { text: 'Next up' }));
    if (!next.length) {
      card.appendChild(C.emptyState(tt.total ? 'Everything is checked off' : 'No tasks yet', tt.total ? 'Nice work.' : 'Add tasks in the Checklist view.'));
    } else {
      var ul = h('ul');
      next.forEach(function (t) {
        var cb = h('input', { type: 'checkbox', attrs: { 'aria-label': 'Mark done: ' + t.title } });
        cb.addEventListener('change', function () {
          var all = D.list('tasks');
          all.forEach(function (x) { if (x.id === t.id) x.done = cb.checked; });
          D.save('tasks', all);
          App.views.overview.render(root);
        });
        ul.appendChild(h('li', null, h('label', { class: 'check' }, cb, h('span', { text: t.title })),
          h('span', { class: 'badge', text: D.monthsLabel(t.months) })));
      });
      card.appendChild(ul);
    }
    root.appendChild(card);
  }

  App.views.overview = {
    navLabel: 'Overview',
    render: function (root) {
      root.dataset.activeView = 'overview';
      root.innerHTML = '';
      root.appendChild(h('h1', { text: 'Overview' }));
      if (D.wedding().setupDone) renderDash(root); else renderSetup(root);
    },
  };
  App.nav.push('overview');
})(window);
