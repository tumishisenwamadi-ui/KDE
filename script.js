// DOM Elements
const dashboardSidebar = document.getElementById("dashboardSidebar");
const userMenu = document.getElementById("userMenu");
const userMenuTrigger = document.getElementById("user-menu-trigger");
const userMenuDropdown = document.querySelector(".user-menu-dropdown");
const themeToggle = document.getElementById("theme-toggle");
const dashboardViews = document.querySelectorAll(".dashboard-view");
const dashboardNavItems = document.querySelectorAll(".dashboard-nav-item");
const dashboardTitle = document.getElementById("dashboardTitle");
const dashboardSidebarOverlay = document.getElementById("dashboardSidebarOverlay");
const searchContainer = document.getElementById("searchContainer");
const searchInput = document.getElementById("searchInput");
const searchClose = document.getElementById("searchClose");
const mobileSearchBtn = document.getElementById("mobileSearchBtn");
// State
let sidebarCollapsed = false;
let currentView = "overview";
// ===================================
// INITIALIZATION
// ===================================
document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  initThemeToggle();
  initSidebar();
  initUserMenu();
  initNavigation();
  initSearch();
  initCharts();
});
// ===================================
// SIDEBAR FUNCTIONALITY
// ===================================
function initSidebar() {
  // Load saved sidebar state
  sidebarCollapsed = localStorage.getItem("dashboard-sidebar-collapsed") === "true";
  dashboardSidebar.classList.toggle("collapsed", sidebarCollapsed);
  // Sidebar toggle functionality
  document.querySelectorAll(".dashboard-sidebar-toggle").forEach((toggle) => {
    toggle.addEventListener("click", toggleSidebar);
  });
  // Sidebar overlay functionality
  dashboardSidebarOverlay?.addEventListener("click", closeSidebar);
}
function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  const isMobile = window.innerWidth <= 1024;
  if (isMobile) {
    // Mobile behavior - toggle sidebar and overlay together
    const isOpen = dashboardSidebar.classList.contains("collapsed");
    dashboardSidebar.classList.toggle("collapsed", !isOpen);
    dashboardSidebarOverlay?.classList.toggle("active", !isOpen);
  } else {
    // Desktop behavior
    dashboardSidebar.classList.toggle("collapsed", sidebarCollapsed);
  }
  localStorage.setItem("dashboard-sidebar-collapsed", sidebarCollapsed.toString());
}
function closeSidebar() {
  if (window.innerWidth <= 1024) {
    dashboardSidebar.classList.remove("collapsed");
    dashboardSidebarOverlay?.classList.remove("active");
  }
}
// ===================================
// USER MENU FUNCTIONALITY
// ===================================
function initUserMenu() {
  if (!userMenuTrigger || !userMenu) return;
  userMenuTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    userMenu.classList.toggle("active");
  });
  // Close menu when clicking outside or pressing escape
  document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target)) {
      userMenu.classList.remove("active");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && userMenu.classList.contains("active")) {
      userMenu.classList.remove("active");
    }
  });
}
// ===================================
// NAVIGATION FUNCTIONALITY
// ===================================
function initNavigation() {
  dashboardNavItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const viewId = item.getAttribute("data-view");
      if (viewId) switchView(viewId);
    });
  });
}
function switchView(viewId) {
  // Update active nav item
  dashboardNavItems.forEach((item) => {
    item.classList.toggle("active", item.getAttribute("data-view") === viewId);
  });
  // Hide all views and show selected one
  dashboardViews.forEach((view) => view.classList.remove("active"));
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.add("active");
    currentView = viewId;
    updatePageTitle(viewId);
  }
  // Leaflet needs a size refresh when its container becomes visible again
  if (viewId === "overview" && window.TrackingMap) setTimeout(() => TrackingMap.invalidate(), 50);
  // Close sidebar on mobile after navigation
  if (window.innerWidth <= 1024) closeSidebar();
}
function updatePageTitle(viewId) {
  const titles = {
    overview: "Overview",
    performance: "Performance Indicators",
    analytics: "Analytics",
    products: "Products",
    settings: "Settings",
  };
  if (dashboardTitle) {
    dashboardTitle.textContent = titles[viewId] || "Dashboard";
  }
}
// ===================================
// THEME FUNCTIONALITY
// ===================================
function initTheme() {
  // Load saved theme
  const savedTheme = localStorage.getItem("dashboard-theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  // Update theme toggle UI
  updateThemeToggleUI(savedTheme);
}
function initThemeToggle() {
  if (!themeToggle) return;
  themeToggle.querySelectorAll(".theme-option").forEach((option) => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      setTheme(option.getAttribute("data-theme"));
    });
  });
}
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("dashboard-theme", theme);
  updateThemeToggleUI(theme);
}
function updateThemeToggleUI(theme) {
  if (!themeToggle) return;
  themeToggle.querySelectorAll(".theme-option").forEach((option) => {
    option.classList.toggle("active", option.getAttribute("data-theme") === theme);
  });
}
// ===================================
// SEARCH FUNCTIONALITY
// ===================================
function initSearch() {
  mobileSearchBtn?.addEventListener("click", () => {
    searchContainer.classList.add("mobile-active");
    searchInput.focus();
  });
  searchClose?.addEventListener("click", () => {
    searchContainer.classList.remove("mobile-active");
    searchInput.value = "";
  });
}
// ===================================
// CHART INITIALIZATION
// ===================================
function initCharts() {
  initProgressChart();
  initCategoryChart();
}
function initProgressChart() {
  const ctx = document.getElementById("progressChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Project Progress",
          data: [20, 35, 45, 60, 70, 85],
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { callback: (value) => value + "%" },
        },
      },
    },
  });
}
function initCategoryChart() {
  const ctx = document.getElementById("categoryChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Frontend", "Backend", "Mobile", "DevOps"],
      datasets: [
        {
          data: [35, 25, 20, 20],
          backgroundColor: ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
      },
    },
  });
}