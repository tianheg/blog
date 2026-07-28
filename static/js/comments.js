// Comment system for tianheg.co
// Proxied through the blog Worker — all requests are same-origin.
(function () {
  'use strict';

  var SLUG = location.pathname
    .replace(/\/+/g, '_')
    .replace(/^_/, '')
    .replace(/_$/, '') || 'index';
  var CONTAINER = document.getElementById('comments');
  if (!CONTAINER) return;

  function loadComments() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/comments/' + encodeURIComponent(SLUG) + '.html');
    xhr.onload = function () {
      if (xhr.status === 200) {
        var el = document.getElementById('comments-list');
        if (el) el.innerHTML = xhr.responseText;
      }
    };
    xhr.send();
  }

  function setupForm() {
    var form = document.getElementById('comment-form');
    var btn = form && form.querySelector('button[type="submit"]');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!window.fetch || btn.disabled) return;

      btn.disabled = true;
      btn.textContent = 'Posting…';

      var data = {};
      data.slug = SLUG;
      data.name = form.querySelector('[name="name"]').value;
      data.body = form.querySelector('[name="body"]').value;
      data.email = form.querySelector('[name="email"]').value || '';

      fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) {
          if (!r.ok) throw new Error('Post failed');
          form.reset();
          loadComments();
        })
        .catch(function () {
          var el = document.getElementById('comments-error');
          if (el) el.style.display = 'block';
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = 'Post Comment';
        });
    });
  }

  loadComments();
  setupForm();
})();
