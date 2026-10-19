/* Data access + every computed number the app shows. Keeping the arithmetic in one
 * place (all in whole cents / whole people) is what the audit's totals checks rely on. */
(function (g) {
  var App = g.App = g.App || { views: {}, nav: [] };
  var C = App.core;

  var D = App.data = {
    wedding: function () { return App.store.get('wedding', { setupDone: false, date: '', budget: 0, guests: 0 }); },
    saveWedding: function (w) { App.store.set('wedding', w); },
    list: function (key) { return App.store.get(key, []); },
    save: function (key, arr) { App.store.set(key, arr); },

    budgetTotals: function () {
      var cats = D.list('budget'), t = { est: 0, actual: 0, paid: 0, over: [] };
      cats.forEach(function (c) {
        t.est += c.est || 0; t.actual += c.actual || 0; t.paid += c.paid || 0;
        if ((c.actual || 0) > (c.est || 0)) t.over.push(c);
      });
      var budget = D.wedding().budget || 0;
      t.budget = budget;
      t.remaining = budget - t.actual;          // what is left of the total budget after real spending
      t.planGap = t.est - budget;               // > 0 when the plan adds up to more than the total budget
      return t;
    },

    guestTotals: function () {
      var gs = D.list('guests'), t = { entries: gs.length, invited: 0, yes: 0, no: 0, pending: 0, tables: {} };
      gs.forEach(function (x) {
        var n = x.party || 1;
        t.invited += n;
        if (x.rsvp === 'yes') t.yes += n; else if (x.rsvp === 'no') t.no += n; else t.pending += n;
        var label = (x.table || '').trim();
        if (label && x.rsvp !== 'no') t.tables[label] = (t.tables[label] || 0) + n;
      });
      return t;
    },

    vendorTotals: function () {
      var vs = D.list('vendors'), t = { quote: 0, depositDue: 0, depositPaid: 0, next: null };
      vs.forEach(function (v) {
        t.quote += v.quote || 0;
        if (v.depositPaid) t.depositPaid += v.deposit || 0; else t.depositDue += v.deposit || 0;
        if (!v.depositPaid && v.due && (!t.next || v.due < t.next.due)) t.next = v;
      });
      return t;
    },

    taskTotals: function () {
      var ts = D.list('tasks'), done = 0;
      ts.forEach(function (x) { if (x.done) done += 1; });
      return { total: ts.length, done: done };
    },

    /** Months-out groups, soonest-to-do first (largest months-out first). */
    taskGroups: function () {
      var groups = {};
      D.list('tasks').forEach(function (t) { (groups[t.months] = groups[t.months] || []).push(t); });
      return Object.keys(groups).map(Number).sort(function (a, b) { return b - a; })
        .map(function (m) { return { months: m, tasks: groups[m] }; });
    },

    monthsLabel: function (m) {
      if (m >= 12) return '12 or more months before';
      if (m === 0) return 'Wedding week';
      return m + (m === 1 ? ' month' : ' months') + ' before';
    },

    CURRENCIES: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'CHF', 'SEK', 'NOK', 'DKK', 'MAD', 'AED', 'ZAR', 'INR', 'MXN', 'BRL', 'JPY'],
  };
})(window);
