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
    if (!form) return;
    form.addEventListener('submit', function (e) {
      if (!window.fetch) return;
      e.preventDefault();
      var data = new URLSearchParams(new FormData(form));
      data.set('slug', SLUG);
      fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data.toString()
      })
        .then(function (r) { if (!r.ok) throw Error(); form.reset(); loadComments(); })
        .catch(function () { form.submit(); });
    });
  }

  loadComments();
  setupForm();
})();
