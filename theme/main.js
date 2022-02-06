// Part 1: open externel link on new tab
function externalLinks() {
  for (var c = document.getElementsByTagName("a"), a = 0; a < c.length; a++) {
    var b = c[a];
    b.getAttribute("href") && b.hostname !== location.hostname && (b.target = "_blank") && (b.rel = "noopener noreferrer")
  }
};
externalLinks();

// Part 1: hignlight code
// document.addEventListener("DOMContentLoaded", (event) => {
//   document.querySelectorAll("pre .src").forEach((el) => {
//     hljs.highlightElement(el);
//   });
// });

var hlf = function () {
  Array.prototype.forEach.call(
    document.querySelectorAll("pre.src"),
    function (t) {
      var e;
      (e = t.getAttribute("class")),
        (e = e.replace(/src-(\w+)/, "src-$1 $1")),
        console.log(e),
        t.setAttribute("class", e),
        hljs.highlightElement(t);
    }
  );
};
addEventListener("DOMContentLoaded", hlf);