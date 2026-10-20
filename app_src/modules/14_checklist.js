/* Checklist: tasks grouped by months before the wedding, with a "do by" date once a
 * wedding date is set. */
(function (g) {
  var App = g.App = g.App || { views: {}, nav: [] };
  var C = App.core, D = App.data, h = C.h;
  var MONTH_CHOICES = [12, 9, 6, 4, 3, 2, 1, 0];

  App.views.checklist = {
    navLabel: 'Checklist',
    render: function (root) {
      root.dataset.activeView = 'checklist';
      root.innerHTML = '';
      var tt = D.taskTotals(), w = D.wedding();
      root.appendChild(h('h1', { text: 'Checklist' }));
      root.appendChild(h('p', { class: 'sub', text: 'What to do and when, counted back from your wedding date.' }));

      var pct = tt.total ? Math.round(tt.done * 100 / tt.total) : 0;
      root.appendChild(h('div', { class: 'card' },
        h('strong', { text: tt.total ? tt.done + ' of ' + tt.total + ' tasks done' : 'No tasks yet' }),
        h('div', { class: 'progress', attrs: { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': 'Checklist progress' } },
          h('span', { style: 'width:' + pct + '%' }))));
      if (!w.date) root.appendChild(C.banner('info', 'Add your wedding date in Settings to see a do-by date for each group.'));

      var cols = h('div', { class: 'cols-2' });
      D.taskGroups().forEach(function (grp) {
        var when = w.date ? C.monthsBefore(w.date, grp.months) : null;
        var card = h('div', { class: 'card' },
          h('h2', { text: D.monthsLabel(grp.months) }),
          when ? h('p', { class: 'sub', text: 'Aim to finish by ' + C.fmtDate(when) }) : null);
        var ul = h('ul');
        grp.tasks.forEach(function (t) {
          var cb = h('input', { type: 'checkbox', checked: !!t.done, attrs: { 'aria-label': t.title } });
          cb.addEventListener('change', function () {
            var all = D.list('tasks');
            all.forEach(function (x) { if (x.id === t.id) x.done = cb.checked; });
            D.save('tasks', all);
            App.views.checklist.render(root);
          });
          var del = h('button', { type: 'button', class: 'ghost small', text: 'Remove', attrs: { 'aria-label': 'Remove task: ' + t.title } });
          del.addEventListener('click', function () {
            D.save('tasks', D.list('tasks').filter(function (x) { return x.id !== t.id; }));
            App.views.checklist.render(root);
          });
          ul.appendChild(h('li', null, h('label', { class: 'check' + (t.done ? ' done' : '') }, cb, h('span', { text: t.title })), del));
        });
        card.appendChild(ul);
        cols.appendChild(card);
      });

      var title = h('input', { type: 'text', id: 'taskTitle', attrs: { maxlength: '120' } });
      var months = h('select', { id: 'taskMonths', attrs: { 'aria-label': 'When' } });
      MONTH_CHOICES.forEach(function (m) { months.appendChild(h('option', { value: String(m), text: D.monthsLabel(m), selected: m === 3 })); });
      var fTitle = C.field('taskTitle', 'New task', title);
      var add = h('div', { class: 'card' }, h('h2', { text: 'Add your own task' }), fTitle, C.field('taskMonths', 'When', months),
        h('button', { type: 'button', id: 'addTaskBtn', text: 'Add task' }));
      add.querySelector('#addTaskBtn').addEventListener('click', function () {
        C.clearErrors(add);
        var tl = title.value.trim();
        if (!tl) return C.setError(fTitle, 'Describe the task.');
        var all = D.list('tasks');
        all.push({ id: C.uid(), title: tl, months: parseInt(months.value, 10), done: false });
        D.save('tasks', all);
        App.views.checklist.render(root);
      });
      root.appendChild(h('div', { class: 'split' }, h('div', { class: 'side' }, add), h('div', { class: 'main' }, cols)));
    },
  };
  App.nav.push('checklist');
})(window);
