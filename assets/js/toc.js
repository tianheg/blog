// Table of Contents - Active Section Highlighting
(function() {
  'use strict';

  const tocSidebar = document.querySelector('.toc-sidebar');
  const tocMobileButton = document.querySelector('.toc-mobile-button');
  const tocMobileDrawer = document.querySelector('.toc-mobile-drawer');
  const tocMobileOverlay = document.querySelector('.toc-mobile-overlay');
  const tocMobileClose = document.querySelector('.toc-mobile-close');
  
  // Use mobile drawer if available, otherwise use sidebar
  const tocContainer = tocMobileDrawer || tocSidebar;
  if (!tocContainer) return;

  // Mobile TOC functionality
  if (tocMobileButton && tocMobileDrawer && tocMobileOverlay) {
    function openMobileTOC() {
      // Set drawer height to 80vh
      tocMobileDrawer.style.height = '80vh';
      tocMobileDrawer.classList.add('active');
      tocMobileOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      tocMobileButton.setAttribute('aria-expanded', 'true');
      tocMobileButton.classList.add('drawer-open');
      
      // Reset cursor by blurring button and resetting body cursor
      setTimeout(() => {
        tocMobileButton.blur();
        document.body.style.cursor = 'default';
      }, 0);
    }

    function closeMobileTOC() {
      tocMobileDrawer.classList.remove('active');
      tocMobileOverlay.classList.remove('active');
      document.body.style.overflow = '';
      document.body.style.cursor = '';
      tocMobileButton.setAttribute('aria-expanded', 'false');
      tocMobileButton.classList.remove('drawer-open');
    }

    tocMobileButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openMobileTOC();
    });
    if (tocMobileClose) {
      tocMobileClose.addEventListener('click', closeMobileTOC);
    }
    
    // Handle overlay clicks (both mouse and touch)
    function handleOverlayClose(e) {
      e.preventDefault();
      e.stopPropagation();
      closeMobileTOC();
    }
    
    tocMobileOverlay.addEventListener('click', handleOverlayClose);
    tocMobileOverlay.addEventListener('touchend', handleOverlayClose);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && tocMobileDrawer.classList.contains('active')) {
        closeMobileTOC();
      }
    });

    // Close mobile TOC when clicking a link (on mobile)
    const mobileTocLinks = tocMobileDrawer.querySelectorAll('a[href^="#"]');
    mobileTocLinks.forEach(link => {
      link.addEventListener('click', () => {
        // Small delay to allow smooth scroll to start
        setTimeout(closeMobileTOC, 300);
      });
    });

    // Prevent drawer from closing when clicking inside the drawer content
    const mobileTocContent = tocMobileDrawer.querySelector('.toc-mobile-content');
    if (mobileTocContent) {
      mobileTocContent.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      mobileTocContent.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      });
    }
  }

  // Dynamically calculate header height and adjust TOC position
  function adjustTocPosition() {
    const header = document.querySelector('header');
    if (header) {
      const headerHeight = header.offsetHeight;
      
      // Adjust desktop sidebar
      if (tocSidebar) {
        tocSidebar.style.paddingTop = `${headerHeight + 1.5 * 16}px`; // header height + 1.5rem padding
      }
      
      // Adjust mobile button position
      if (tocMobileButton) {
        // Position button below header with 0.5rem spacing
        tocMobileButton.style.top = `${headerHeight + 0.5 * 16}px`;
      }
    }
  }

  // Adjust on load and resize
  adjustTocPosition();
  window.addEventListener('resize', adjustTocPosition);

  const tocLinks = tocContainer.querySelectorAll('a[href^="#"]');
  if (tocLinks.length === 0) return;

  const headings = Array.from(tocLinks).map(link => {
    const id = link.getAttribute('href').substring(1);
    const heading = document.getElementById(id);
    return { id, link, heading };
  }).filter(item => item.heading !== null);

  if (headings.length === 0) return;

  // Smooth scroll behavior for TOC links
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const header = document.querySelector('header');
          const offset = header ? header.offsetHeight + 20 : 100; // Account for sticky header + padding
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Update active state immediately
          updateActiveLink(this);
        }
      }
    });
  });

  function updateActiveLink(activeLink) {
    tocLinks.forEach(link => {
      link.classList.remove('active');
    });
    if (activeLink) {
      activeLink.classList.add('active');
      
      // Scroll TOC to show active link if needed (desktop sidebar only)
      if (tocSidebar) {
        const tocContent = tocSidebar.querySelector('.toc-content');
        if (tocContent && activeLink.offsetParent !== null) {
          const linkTop = activeLink.getBoundingClientRect().top;
          const sidebarTop = tocSidebar.getBoundingClientRect().top;
          const sidebarHeight = tocSidebar.clientHeight;
          
          if (linkTop < sidebarTop + 20) {
            tocSidebar.scrollTo({
              top: tocSidebar.scrollTop + (linkTop - sidebarTop) - 20,
              behavior: 'smooth'
            });
          } else if (linkTop + activeLink.offsetHeight > sidebarTop + sidebarHeight - 20) {
            tocSidebar.scrollTo({
              top: tocSidebar.scrollTop + (linkTop + activeLink.offsetHeight - sidebarTop - sidebarHeight) + 20,
              behavior: 'smooth'
            });
          }
        }
      }
      
      // Scroll mobile drawer to show active link
      if (tocMobileDrawer && tocMobileDrawer.classList.contains('active')) {
        const mobileTocContent = tocMobileDrawer.querySelector('.toc-mobile-content');
        if (mobileTocContent && activeLink.offsetParent !== null) {
          const linkTop = activeLink.getBoundingClientRect().top;
          const drawerTop = mobileTocContent.getBoundingClientRect().top;
          const drawerHeight = mobileTocContent.clientHeight;
          
          if (linkTop < drawerTop + 20) {
            mobileTocContent.scrollTo({
              top: mobileTocContent.scrollTop + (linkTop - drawerTop) - 20,
              behavior: 'smooth'
            });
          } else if (linkTop + activeLink.offsetHeight > drawerTop + drawerHeight - 20) {
            mobileTocContent.scrollTo({
              top: mobileTocContent.scrollTop + (linkTop + activeLink.offsetHeight - drawerTop - drawerHeight) + 20,
              behavior: 'smooth'
            });
          }
        }
      }
    }
  }

  function getActiveHeading() {
    const header = document.querySelector('header');
    const headerOffset = header ? header.offsetHeight + 20 : 120;
    const scrollPosition = window.scrollY + headerOffset; // Offset for header + some padding
    
    // Find the heading that's currently in view
    for (let i = headings.length - 1; i >= 0; i--) {
      const { heading, link } = headings[i];
      if (heading && heading.offsetTop <= scrollPosition) {
        return link;
      }
    }
    
    // If no heading found, return the first one
    return headings[0]?.link || null;
  }

  // Throttled scroll handler
  const handleScroll = throttle(() => {
    const activeLink = getActiveHeading();
    updateActiveLink(activeLink);
  }, 100);

  // Initial active state
  handleScroll();

  // Listen for scroll events
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Also listen for hash changes (when clicking TOC links)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash) {
      const link = tocContainer.querySelector(`a[href="${hash}"]`);
      if (link) {
        updateActiveLink(link);
      }
    }
  });

  // Throttle function (reuse from main.js if available, otherwise define here)
  function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
})();

