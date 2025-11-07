// Table of Contents - Active Section Highlighting
(function() {
  'use strict';

  const tocSidebar = document.querySelector('.toc-sidebar');
  if (!tocSidebar) return;

  // Dynamically calculate header height and adjust TOC position
  function adjustTocPosition() {
    const header = document.querySelector('header');
    if (header) {
      const headerHeight = header.offsetHeight;
      tocSidebar.style.paddingTop = `${headerHeight + 1.5 * 16}px`; // header height + 1.5rem padding
    }
  }

  // Adjust on load and resize
  adjustTocPosition();
  window.addEventListener('resize', adjustTocPosition);

  const tocLinks = tocSidebar.querySelectorAll('a[href^="#"]');
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
      
      // Scroll TOC to show active link if needed
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
      const link = tocSidebar.querySelector(`a[href="${hash}"]`);
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

