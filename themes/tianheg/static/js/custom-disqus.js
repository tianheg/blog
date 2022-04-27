const comment = document.querySelector('section.comments')
const full = comment.classList.contains('comment-full')

if (document.querySelector('#layout-2').checked == true) {
  comment.classList.remove('comments')
  comment.classList.add('comment-full')
} else {
  comment.classList.remove('comment-full')
}

// https://cdn.jsdelivr.net/npm/@xiee/utils/js/custom-disqus.js
// TODO lazy loading
