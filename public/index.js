import {
  fetchMenuItems,
  renderMenuByType,
  fetchCartData,
  updateOrderSummary,
  updateQuantityIndicators,
  renderLandingPage,
  hideLoginForm,
  isLoggedIn,
  toggleOrderSummaryDisplay,
  toggleCompleteOrderButton,
  handleCompleteOrderButtonClick,
  initializeCheckoutButton,
  removeAllItem,
  removeSingleItem,
  addSingleItem,
  addItem,
} from "./utils.js";

export let orderArray = [];
export let menuArray = [];

document.addEventListener("DOMContentLoaded", async () => {

  const currentPagePath = window.location.pathname;
  const isAuthenticationPage = currentPagePath === '/login.html' || currentPagePath === '/signUp.html';

  if (isAuthenticationPage) {
    return; // Exit early on authentication pages
  }

  // Retrieve stored page from localStorage, default to 'home'
  const savedPage = localStorage.getItem("currentPage") || "home";

  // Fetch cart items on page load
  const validItems = await fetchCartData();
  updateOrderSummary(validItems);
  updateQuantityIndicators(validItems);

  // Ensure the "Complete Order" button persists on refresh
  toggleCompleteOrderButton(validItems.length > 0);
  initializeCheckoutButton();

  // Load the correct menu based on saved page
  if (savedPage === "home") {
    renderLandingPage();
    toggleCompleteOrderButton(false);
    toggleOrderSummaryDisplay(false);
  } else {
    await fetchMenuItems();
    renderMenuByType(savedPage, isLoggedIn());

    if (isLoggedIn()) {
      updateOrderSummary(validItems);
      updateQuantityIndicators(validItems);
      toggleCompleteOrderButton(validItems.length > 0);
      toggleOrderSummaryDisplay(validItems.length > 0);
    }
  }

  // Setup Navbar Click Handlers
  const navbarLinks = document.querySelector(".navbar-links");
  if (navbarLinks) {
    navbarLinks.addEventListener("click", async function (event) {
      const linkType = event.target.getAttribute("data-type");
      if (linkType) {
        event.preventDefault();
        hideLoginForm(); // Hide login form when switching pages

        localStorage.setItem("currentPage", linkType); // Store the selected page

        if (linkType === "home") {
          renderLandingPage();
          toggleCompleteOrderButton(false);
          toggleOrderSummaryDisplay(false);
        } else {
          await fetchMenuItems();
          renderMenuByType(linkType, isLoggedIn());

          if (isLoggedIn()) {
            const validItems = await fetchCartData();
            updateOrderSummary(validItems);
            updateQuantityIndicators(validItems);
            toggleCompleteOrderButton(validItems.length > 0);
            toggleOrderSummaryDisplay(validItems.length > 0);
          }
        }
      }
    });
  }

  // Attach event listeners for order modifications
  const sectionSummary = document.getElementById("section-summary");
  if (sectionSummary) {
    sectionSummary.addEventListener("click", async function (event) {
      const itemId = event.target.getAttribute("data-item-id");

      if (event.target.classList.contains("remove-single-item")) {
        await removeSingleItem(itemId);
      } else if (event.target.classList.contains("remove-all-item")) {
        await removeAllItem(itemId);
      } else if (event.target.classList.contains("add-single-item")) {
        await addSingleItem(itemId);
      }

      // Ensure the "Complete Order" button stays visible when items exist
      const updatedItems = await fetchCartData();
      toggleCompleteOrderButton(updatedItems.length > 0);
    });
  }

  // Handle navbar toggle for mobile view
  const toggleButton = document.querySelector(".toggle-button");
  const closeBtn = document.getElementById("close-btn");

  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      navbarLinks.classList.toggle("active");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      navbarLinks.classList.remove("active");
    });
  }

  document.addEventListener("click", (event) => {
    if (!navbarLinks.contains(event.target) &&
        !toggleButton.contains(event.target) &&
        navbarLinks.classList.contains("active")) {
      navbarLinks.classList.remove("active");
    }
  });
});
