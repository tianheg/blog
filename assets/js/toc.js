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
    scrollOffset: 3 * 16, // 3rem - matches CSS scroll-margin-top
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

    if (linkTop < containerTop + CONSTANTS.scrollOffset) {
      container.scrollTo({
        top: container.scrollTop + (linkTop - containerTop) - CONSTANTS.scrollOffset,
        behavior: 'smooth'
      });
    } else if (linkTop + linkHeight > containerTop + containerHeight - CONSTANTS.scrollOffset) {
      container.scrollTo({
        top: container.scrollTop + (linkTop + linkHeight - containerTop - containerHeight) + CONSTANTS.scrollOffset,
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

  // Get currently active heading based on scroll position
  const getActiveHeading = () => {
    // Match CSS scroll-margin-top: calc(var(--header-height) + 3rem)
    const headerOffset = elements.header 
      ? elements.header.offsetHeight + CONSTANTS.scrollOffset 
      : 5 * 16 + CONSTANTS.scrollOffset; // 5rem (--header-height) + 3rem
    const scrollPosition = window.scrollY + headerOffset;

    for (let i = headings.length - 1; i >= 0; i--) {
      const { heading, link } = headings[i];
      if (heading && heading.offsetTop <= scrollPosition) {
        return link;
      }
    }

    return headings[0]?.link || null;
  };

  // Handle TOC link clicks
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          // Use scrollIntoView which respects CSS scroll-margin-top
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

  // Handle scroll events
  const handleScroll = throttle(() => {
    updateActiveLink(getActiveHeading());
  }, CONSTANTS.throttleDelay);

  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Handle hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash) {
      const link = tocContainer.querySelector(`a[href="${hash}"]`);
      if (link) updateActiveLink(link);
    }
  });
})();
