window.addEventListener(
  "DOMContentLoaded",
  (event) => {
    const backToTop = document.getElementById("back-to-top");

    if (backToTop !== null) {
      window.addEventListener(
        "scroll",
        throttle(() => {
          window.scrollY > 100
            ? backToTop.classList.add("show")
            : backToTop.classList.remove("show");
        }, delayTime),
      );
    }
  },
  { once: true },
);
