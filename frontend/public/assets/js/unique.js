(function () {
  'use strict';

  /* ── Counter animation ──────────────────────────────────────── */
  function animateStat(el) {
    if (el.dataset.animated) return;
    el.dataset.animated = 'true';

    var target   = parseFloat(el.dataset.target)  || 0;
    var prefix   = el.dataset.prefix  || '';
    var suffix   = el.dataset.suffix  || '';
    var duration = 900;   // ms
    var start    = null;
    var isFloat  = target % 1 !== 0;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      // ease-out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var value  = eased * target;
      el.textContent = prefix + (isFloat ? value.toFixed(1) : Math.round(value)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  /* ── Slide items in one-by-one after panel opens ────────────── */
  function slideItemsIn(panel) {
    var items = panel.querySelectorAll('.unique-list li');
    items.forEach(function (li, i) {
      // reset so re-opening re-animates
      li.classList.remove('in-view');
      li.dataset.animated = '';

      setTimeout(function () {
        li.classList.add('in-view');
        // animate the stat on this row
        var stat = li.querySelector('.unique-stat');
        if (stat) animateStat(stat);
      }, i * 130);   // 130 ms stagger between rows
    });
  }

  /* ── Wire up one toggle / panel pair ───────────────────────── */
  function initToggle(toggleId, panelId) {
    var btn   = document.getElementById(toggleId);
    var panel = document.getElementById(panelId);
    if (!btn || !panel) return;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var isOpen = panel.classList.toggle('is-open');
      btn.classList.toggle('is-open', isOpen);

      if (isOpen) {
        slideItemsIn(panel);
      } else {
        // collapse — reset rows
        panel.querySelectorAll('.unique-list li').forEach(function (li) {
          li.classList.remove('in-view', 'expanded');
        });
      }
    });

    /* ── Each row: click to expand/collapse detail ────────────── */
    var items = panel.querySelectorAll('.unique-list li');
    items.forEach(function (li) {
      li.addEventListener('click', function () {
        var wasExpanded = li.classList.contains('expanded');
        // collapse all siblings first
        items.forEach(function (other) { other.classList.remove('expanded'); });
        if (!wasExpanded) li.classList.add('expanded');
      });
    });
  }

  /* ── Init both instances ─────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initToggle('uniqueToggle1', 'uniquePanel1');
    initToggle('uniqueToggle2', 'uniquePanel2');
  });

}());