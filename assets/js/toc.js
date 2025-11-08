// Table of Contents - Active Section Highlighting
(function() {
  'use strict';

  const SELECTORS = {
    sidebar: '.toc-sidebar',
    mobileButton: '.toc-mobile-button',
    mobileDrawer: '.toc-mobile-drawer',
    mobileOverlay: '.toc-mobile-overlay',
    mobileClose: '.toc-mobile-close',
    mobileContent: '.toc-mobile-content',
    tocContent: '.toc-content',
    header: 'header'
  };

  const CONSTANTS = {
    closeDelay: 300,
    throttleDelay: 100,
    paddingTop: 1.5 * 16, // 1.5rem
    buttonSpacing: 0.5 * 16 // 0.5rem
  };

  const elements = {
    sidebar: document.querySelector(SELECTORS.sidebar),
    mobileButton: document.querySelector(SELECTORS.mobileButton),
    mobileDrawer: document.querySelector(SELECTORS.mobileDrawer),
    mobileOverlay: document.querySelector(SELECTORS.mobileOverlay),
    mobileClose: document.querySelector(SELECTORS.mobileClose),
    header: document.querySelector(SELECTORS.header)
  };

  const tocContainer = elements.mobileDrawer || elements.sidebar;
  if (!tocContainer) return;

  // Mobile TOC functionality
  if (elements.mobileButton && elements.mobileDrawer && elements.mobileOverlay) {
    const openMobileTOC = () => {
      elements.mobileDrawer.classList.add('active');
      elements.mobileOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      elements.mobileButton.setAttribute('aria-expanded', 'true');
      elements.mobileButton.classList.add('drawer-open');
    };

    const closeMobileTOC = () => {
      elements.mobileDrawer.classList.remove('active');
      elements.mobileOverlay.classList.remove('active');
      document.body.style.overflow = '';
      elements.mobileButton.setAttribute('aria-expanded', 'false');
      elements.mobileButton.classList.remove('drawer-open');
    };

    const handleOverlayClose = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeMobileTOC();
    };

    elements.mobileButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openMobileTOC();
    });

    if (elements.mobileClose) {
      elements.mobileClose.addEventListener('click', closeMobileTOC);
    }

    elements.mobileOverlay.addEventListener('click', handleOverlayClose);
    elements.mobileOverlay.addEventListener('touchend', handleOverlayClose);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.mobileDrawer.classList.contains('active')) {
        closeMobileTOC();
      }
    });

    // Close mobile TOC when clicking a link
    const mobileTocLinks = elements.mobileDrawer.querySelectorAll('a[href^="#"]');
    mobileTocLinks.forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(closeMobileTOC, CONSTANTS.closeDelay);
      });
    });

    // Prevent drawer from closing when clicking inside content
    const mobileTocContent = elements.mobileDrawer.querySelector(SELECTORS.mobileContent);
    if (mobileTocContent) {
      mobileTocContent.addEventListener('click', (e) => e.stopPropagation());
      mobileTocContent.addEventListener('touchstart', (e) => e.stopPropagation());
    }
  }

  // Adjust TOC position based on header height
  const adjustTocPosition = () => {
    if (!elements.header) return;
    const headerHeight = elements.header.offsetHeight;

    if (elements.sidebar) {
      elements.sidebar.style.paddingTop = `${headerHeight + CONSTANTS.paddingTop}px`;
    }

    if (elements.mobileButton) {
      elements.mobileButton.style.top = `${headerHeight + CONSTANTS.buttonSpacing}px`;
    }
  };

  adjustTocPosition();
  window.addEventListener('resize', adjustTocPosition);

  // Get all TOC links and their corresponding headings
  const tocLinks = tocContainer.querySelectorAll('a[href^="#"]');
  if (tocLinks.length === 0) return;

  const headings = Array.from(tocLinks).map(link => {
    const id = link.getAttribute('href').substring(1);
    const heading = document.getElementById(id);
    return heading ? { id, link, heading } : null;
  }).filter(Boolean);

  if (headings.length === 0) return;

  // Scroll element into view within container
  const scrollIntoView = (link, container) => {
    if (!container || !link.offsetParent) return;

    const linkTop = link.getBoundingClientRect().top;
    const containerTop = container.getBoundingClientRect().top;
    const containerHeight = container.clientHeight;
    const linkHeight = link.offsetHeight;
    const scrollOffset = 32; // 2rem offset for TOC navigation

    if (linkTop < containerTop + scrollOffset) {
      container.scrollTo({
        top: container.scrollTop + (linkTop - containerTop) - scrollOffset,
        behavior: 'smooth'
      });
    } else if (linkTop + linkHeight > containerTop + containerHeight - scrollOffset) {
      container.scrollTo({
        top: container.scrollTop + (linkTop + linkHeight - containerTop - containerHeight) + scrollOffset,
        behavior: 'smooth'
      });
    }
  };

  // Update active link state
  const updateActiveLink = (activeLink) => {
    tocLinks.forEach(link => link.classList.remove('active'));

    if (activeLink) {
      activeLink.classList.add('active');

      if (elements.sidebar) {
        const tocContent = elements.sidebar.querySelector(SELECTORS.tocContent);
        if (tocContent) scrollIntoView(activeLink, elements.sidebar);
      }

      if (elements.mobileDrawer?.classList.contains('active')) {
        const mobileTocContent = elements.mobileDrawer.querySelector(SELECTORS.mobileContent);
        if (mobileTocContent) scrollIntoView(activeLink, mobileTocContent);
      }
    }
  };

  // Active heading calculation is handled by an IntersectionObserver below.
  // The previous offsetTop-based implementation was removed in favor of
  // a more robust, performant IntersectionObserver approach that accounts
  // for the header height using rootMargin.

  // Handle TOC link clicks
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          // Let CSS scroll-margin-top handle the offset
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          updateActiveLink(this);
        }
      }
    });
  });

  // Throttle function
  const throttle = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // IntersectionObserver-based active heading tracking
  // We'll observe the headings and maintain a set of currently-visible
  // headings (relative to a top rootMargin equal to the header height).
  // The active heading is chosen as the visible heading closest to the
  // top of the viewport (i.e. largest boundingClientRect.top). If none
  // are intersecting (rare), we fall back to picking the last heading
  // scrolled past the header using getBoundingClientRect.

  let observer = null;
  const visible = new Set();

  const updateActiveFromVisible = () => {
    if (visible.size > 0) {
      const chosen = Array.from(visible).sort((a, b) => {
        return b.getBoundingClientRect().top - a.getBoundingClientRect().top;
      })[0];
      const match = headings.find(h => h.heading === chosen);
      if (match) {
        updateActiveLink(match.link);
        return;
      }
    }

    // Fallback: choose last heading that is above the header line
    const headerHeight = elements.header ? elements.header.offsetHeight : 5 * 16;
    for (let i = headings.length - 1; i >= 0; i--) {
      const rect = headings[i].heading.getBoundingClientRect();
      if (rect.top <= headerHeight) {
        updateActiveLink(headings[i].link);
        return;
      }
    }

    // As a last resort, pick the first heading
    updateActiveLink(headings[0].link);
  };

  const createObserver = () => {
    if (observer) observer.disconnect();

    const headerHeight = elements.header ? elements.header.offsetHeight : 5 * 16;
    const rootMargin = `-${headerHeight}px 0px 0px 0px`;

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      // throttle DOM-heavy update calls slightly
      throttle(updateActiveFromVisible, CONSTANTS.throttleDelay)();
    }, { root: null, rootMargin, threshold: [0, 0.1, 0.5, 1] });

    headings.forEach(({ heading }) => {
      observer.observe(heading);
    });

    // Run an initial pass to set the active link
    updateActiveFromVisible();
  };

  // Create observer now and recreate on resize (debounced)
  createObserver();
  window.addEventListener('resize', throttle(() => {
    createObserver();
  }, CONSTANTS.throttleDelay));

  // Handle hash changes: ensure TOC highlights the correct link
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash) {
      const link = tocContainer.querySelector(`a[href="${hash}"]`);
      if (link) updateActiveLink(link);
    }
  });
})();
