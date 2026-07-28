// Comment system for tianheg.co
(function () {
  'use strict';

  var SLUG = location.pathname
    .replace(/\/+/g, '_')
    .replace(/^_/, '')
    .replace(/_$/, '') || 'index';
  var CONTAINER = document.getElementById('comments');
  var FORM = document.getElementById('comment-form');
  var BTN = FORM && FORM.querySelector('button[type="submit"]');
  var PARENT_INPUT = FORM && FORM.querySelector('[name="parent_id"]');
  var REPLY_INDICATOR = document.getElementById('reply-indicator');
  if (!CONTAINER || !FORM) return;

  function loadComments() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/comments/' + encodeURIComponent(SLUG) + '.html');
    xhr.onload = function () {
      if (xhr.status === 200) {
        var el = document.getElementById('comments-list');
        if (el) el.innerHTML = xhr.responseText;
        wireReplyButtons();
      }
    };
    xhr.send();
  }

  function wireReplyButtons() {
    document.querySelectorAll('.comment-reply-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parentId = this.getAttribute('data-id');
        var parentName = this.getAttribute('data-name');
        PARENT_INPUT.value = parentId;
        REPLY_INDICATOR.style.display = 'block';
        REPLY_INDICATOR.innerHTML = 'Replying to <strong>' + parentName + '</strong> (<a href="#" id="cancel-reply" class="text-gray-500 hover:underline">cancel</a>)';
        document.getElementById('cancel-reply').addEventListener('click', function (e) {
          e.preventDefault();
          cancelReply();
        });
        FORM.querySelector('[name="body"]').focus();
      });
    });
  }

  function cancelReply() {
    PARENT_INPUT.value = '0';
    REPLY_INDICATOR.style.display = 'none';
  }

  function showError(msg) {
    var el = document.getElementById('comments-error');
    if (el) {
      el.textContent = msg || 'Failed to post comment.';
      el.style.display = 'block';
    }
  }

  function hideError() {
    var el = document.getElementById('comments-error');
    if (el) el.style.display = 'none';
  }

  FORM.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!window.fetch || BTN.disabled) return;

    BTN.disabled = true;
    BTN.textContent = 'Posting…';
    hideError();

    var data = {
      slug: SLUG,
      name: FORM.querySelector('[name="name"]').value,
      body: FORM.querySelector('[name="body"]').value,
      email: FORM.querySelector('[name="email"]').value || '',
      parent_id: parseInt(FORM.querySelector('[name="parent_id"]').value) || 0
    };

    fetch('/api/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) {
        if (!r.ok) throw new Error();
        cancelReply();
        FORM.reset();
        loadComments();
      })
      .catch(function () { showError('Failed to post. Try again.'); })
      .finally(function () {
        BTN.disabled = false;
        BTN.textContent = 'Post Comment';
      });
  });

  loadComments();
})();
