/* Day-of timeline: timed events kept in order, plus a print layout to hand to the
 * wedding party and vendors. */
(function (g) {
  var App = g.App = g.App || { views: {}, nav: [] };
  var C = App.core, D = App.data, h = C.h;

  function fmtTime(hhmm) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
    if (!m) return hhmm || '';
    try { return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, +m[1], +m[2])); }
    catch (e) { return hhmm; }
  }
  function sorted() { return D.list('events').slice().sort(function (a, b) { return a.time < b.time ? -1 : a.time > b.time ? 1 : 0; }); }

  App.views.dayof = {
    navLabel: 'Day-of',
    render: function (root) {
      root.dataset.activeView = 'dayof';
      root.innerHTML = '';
      var events = sorted(), w = D.wedding();
      root.appendChild(h('h1', { text: 'Day-of timeline' }));
      root.appendChild(h('p', { class: 'sub', text: 'The wedding day, hour by hour. Events stay in time order.' }));

      var time = h('input', { type: 'time', id: 'eventTime' });
      var title = h('input', { type: 'text', id: 'eventTitle', attrs: { maxlength: '100' } });
      var note = h('input', { type: 'text', id: 'eventNote', attrs: { maxlength: '160' } });
      var fTime = C.field('eventTime', 'Time', time), fTitle = C.field('eventTitle', 'What happens', title);
      var form = h('div', { class: 'card' }, h('h2', { text: 'Add an event' }), h('div', { class: 'grid-2' }, fTime, fTitle),
        C.field('eventNote', 'Note or who is responsible', note, 'Optional'),
        h('div', { class: 'row' }, h('button', { type: 'button', id: 'addEventBtn', text: 'Add event' }),
          events.length ? null : h('button', { type: 'button', id: 'seedEventsBtn', class: 'ghost', text: 'Start from a typical timeline' })));
      form.querySelector('#addEventBtn').addEventListener('click', function () {
        C.clearErrors(form);
        if (!/^\d{1,2}:\d{2}$/.test(time.value)) return C.setError(fTime, 'Pick a time.');
        if (!title.value.trim()) return C.setError(fTitle, 'Say what happens.');
        var all = D.list('events');
        all.push({ id: C.uid(), time: time.value.length === 4 ? '0' + time.value : time.value, title: title.value.trim(), note: note.value.trim() });
        D.save('events', all);
        App.views.dayof.render(root);
      });
      var seed = form.querySelector('#seedEventsBtn');
      if (seed) seed.addEventListener('click', function () {
        D.save('events', C.TIMELINE.map(function (e) { return { id: C.uid(), time: e[0], title: e[1], note: e[2] }; }));
        App.views.dayof.render(root);
      });
      var side = h('div', { class: 'side' }, form);

      var card = h('div', { class: 'card' }, h('h2', { text: 'Timeline' }));
      if (!events.length) {
        card.appendChild(C.emptyState('No events yet', 'Add the first event, or start from a typical timeline and edit it.'));
      } else {
        var tbody = h('tbody');
        events.forEach(function (e) {
          var del = h('button', { type: 'button', class: 'ghost small', text: 'Remove', attrs: { 'aria-label': 'Remove ' + e.title } });
          del.addEventListener('click', function () {
            D.save('events', D.list('events').filter(function (x) { return x.id !== e.id; }));
            App.views.dayof.render(root);
          });
          tbody.appendChild(h('tr', null, h('td', { class: 'nowrap', text: fmtTime(e.time) }), h('td', { text: e.title }), h('td', { text: e.note || '' }), h('td', null, del)));
        });
        card.appendChild(C.tableWrap(h('table', { class: 'table' },
          h('thead', null, h('tr', null, ['Time', 'Event', 'Note', ''].map(function (x) { return h('th', { text: x }); }))), tbody)));
        card.appendChild(h('button', { type: 'button', id: 'printTimelineBtn', class: 'ghost', text: 'Print timeline', on: { click: function () {
          var pt = h('table', { class: 'table' },
            h('thead', null, h('tr', null, ['Time', 'Event', 'Note'].map(function (x) { return h('th', { text: x }); }))),
            h('tbody', null, sorted().map(function (e) { return h('tr', null, h('td', { text: fmtTime(e.time) }), h('td', { text: e.title }), h('td', { text: e.note || '' })); })));
          C.printSheet('Wedding day timeline' + (w.date ? ' — ' + C.fmtDate(C.parseISO(w.date)) : ''), pt);
        } } }));
      }
      root.appendChild(h('div', { class: 'split' }, side, h('div', { class: 'main' }, card)));
    },
  };
  App.nav.push('dayof');
})(window);
