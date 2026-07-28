// Comment system for tianheg.co
// Works without JavaScript — form POST falls back to redirect.
(function () {
  'use strict';

  var SERVER = window.COMMENTS_SERVER || '/comments';
  var SLUG = location.pathname
    .replace(/\/+/g, '_')
    .replace(/^_/, '')
    .replace(/_$/, '') || 'index';
  var CONTAINER = document.getElementById('comments');

  if (!CONTAINER) return;

  // --- Load comment list ---
  function loadComments() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', SERVER + '/comments/' + encodeURIComponent(SLUG) + '.html');
    xhr.onload = function () {
      if (xhr.status === 200) {
        var el = document.getElementById('comments-list');
        if (el) el.innerHTML = xhr.responseText;
      }
    };
    xhr.send();
  }

  // --- Form handler (progressive enhancement) ---
  function setupForm() {
    var form = document.getElementById('comment-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      // Check if fetch is supported (old browsers will just submit the form)
      if (!window.fetch) return;

      e.preventDefault();

      var data = new URLSearchParams(new FormData(form));
      // Re-set slug (might have been tampered)
      data.set('slug', SLUG);

      fetch(SERVER + '/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data.toString()
      })
        .then(function (r) {
          if (!r.ok) throw new Error('post failed');
          form.reset();
          loadComments();
        })
        .catch(function () {
          // Fallback: submit the form natively
          form.submit();
        });
    });
  }

  loadComments();
  setupForm();
})();
