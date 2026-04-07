(function () {
  function makeHamburgerButton(extraClass) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mobile-hamburger-btn' + (extraClass ? ' ' + extraClass : '');
    button.setAttribute('aria-label', 'Open menu');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<span></span><span></span><span></span>';
    return button;
  }

  function closeSidebarMenu() {
    document.body.classList.remove('sidebar-menu-open');
    const btn = document.querySelector('.mobile-dashboard-menu-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function setupDashboardSidebarMenu() {
    const sidebar = document.querySelector('.dashboard-left-nav');
    const header = document.querySelector('.dashboard-main-top');
    const actions = document.querySelector('.dashboard-top-actions');
    if (!sidebar || !header) return;

    const button = makeHamburgerButton('mobile-dashboard-menu-btn');
    button.setAttribute('aria-controls', 'dashboardMobileMenu');

    if (!sidebar.id) {
      sidebar.id = 'dashboardMobileMenu';
    }

    if (actions) {
      actions.insertBefore(button, actions.firstChild);
    } else {
      header.appendChild(button);
    }

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'mobile-menu-close';
    closeBtn.setAttribute('aria-label', 'Close menu');
    closeBtn.textContent = 'X';
    sidebar.insertBefore(closeBtn, sidebar.firstChild);

    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    document.body.appendChild(overlay);

    function openSidebarMenu() {
      document.body.classList.add('sidebar-menu-open');
      button.setAttribute('aria-expanded', 'true');
    }

    button.addEventListener('click', function () {
      const isOpen = document.body.classList.contains('sidebar-menu-open');
      if (isOpen) {
        closeSidebarMenu();
      } else {
        openSidebarMenu();
      }
    });

    closeBtn.addEventListener('click', closeSidebarMenu);
    overlay.addEventListener('click', closeSidebarMenu);

    sidebar.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeSidebarMenu();
      });
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) {
        closeSidebarMenu();
      }
    });
  }

  function setupNavbarHamburger() {
    const navbar = document.querySelector('.navbar');
    const links = navbar ? navbar.querySelector('.nav-links') : null;
    if (!navbar || !links) return;

    const button = makeHamburgerButton('mobile-navbar-menu-btn');
    if (!links.id) {
      links.id = 'mobileTopNav';
    }
    button.setAttribute('aria-controls', links.id);
    navbar.appendChild(button);

    function closeTopMenu() {
      document.body.classList.remove('mobile-nav-open');
      button.setAttribute('aria-expanded', 'false');
    }

    button.addEventListener('click', function () {
      const isOpen = document.body.classList.toggle('mobile-nav-open');
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeTopMenu);
    });

    document.addEventListener('click', function (event) {
      if (!document.body.classList.contains('mobile-nav-open')) return;
      if (navbar.contains(event.target)) return;
      closeTopMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) {
        closeTopMenu();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const pageName = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (!pageName || pageName === 'index.html') return;

    document.body.classList.add('mobile-hamburger-enabled');

    if (document.querySelector('.dashboard-left-nav')) {
      setupDashboardSidebarMenu();
      return;
    }

    if (document.querySelector('.navbar .nav-links')) {
      setupNavbarHamburger();
    }
  });
})();
