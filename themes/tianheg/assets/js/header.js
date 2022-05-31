window.addEventListener(
  'DOMContentLoaded',
  (event) => {
    /**
     * Measure header height for the scrolling fix
     */
    const header = document.querySelector('.header');

    if (header) {
      const headerHeight = window
        .getComputedStyle(header, null)
        .getPropertyValue('height');

      document.documentElement.style.setProperty(
        '--header-height',
        headerHeight
      );

      {{ if and .Site.Params.enableHeaderAutoHide (eq .Site.Params.headerLayout "flex") }}
      /**
       * Auto hide header
       */
      let lastScrollY = 0;

      window.addEventListener(
        'scroll',
        throttle(() => {
          window.scrollY > lastScrollY
            ? header.classList.add('hide')
            : header.classList.remove('hide');

          lastScrollY = window.scrollY;
        }, delayTime)
      );
      {{ end }}
    }

    const timeEl = document.querySelector('.time')

    function setTime() {
      const time = new Date()
      const hours = time.getHours()
      const minutes = time.getMinutes()

      timeEl.innerHTML = `${hours}:${
        minutes < 10 ? `0${minutes}` : minutes
      }`
    }

    setTime()
    setInterval(setTime, 1000)
  },
  { once: true }
);
