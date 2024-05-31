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
  removeAllItem,
  removeSingleItem,
  addSingleItem,
  addItem,
} from "./utils.js";

export let orderArray = [];
export let menuArray = [];

document.addEventListener("DOMContentLoaded", async () => {
  const menuContainer = document.getElementById("section-menu");
  const sectionComplete = document.getElementById("section-complete");
  const checkoutButton = document.getElementById("complete-order-button");
  const navbarLinks = document.querySelector(".navbar-links");
  const sectionSummary = document.getElementById("section-summary");
  const toggleButton = document.querySelector(".toggle-button");
  const closeBtn = document.getElementById("close-btn");

  renderLandingPage();

  if (sectionComplete) {
    toggleCompleteOrderButton(false);
  } else {
    console.log("section-complete element is not available on this page.");
  }

  if (checkoutButton) {
    checkoutButton.addEventListener("click", handleCompleteOrderButtonClick);
  } else {
    console.error("Checkout button not found");
  }

  if (navbarLinks) {
    navbarLinks.addEventListener("click", async function (event) {
      const linkType = event.target.getAttribute("data-type");
      if (linkType) {
        event.preventDefault();
        hideLoginForm(); // Hide the login form when navigating to other pages
        if (linkType === "home") {
          renderLandingPage();
          toggleCompleteOrderButton(false);
          toggleOrderSummaryDisplay(false);
        } else {
          await fetchMenuItems(); // Ensure menu items are fetched before rendering
          renderMenuByType(linkType, isLoggedIn()); // Render the menu items based on type
          if (isLoggedIn()) {
            const validItems = await fetchCartData();
            updateOrderSummary(validItems);
            updateQuantityIndicators(validItems);

            toggleCompleteOrderButton(orderArray.length > 0);
            toggleOrderSummaryDisplay(true);
          }
        }
      }
    });

    navbarLinks.addEventListener("click", (event) => {
      if (event.target.classList.contains("navbar-link")) {
        navbarLinks.classList.remove("active");
      }
    });
  }
  
   // Fetch menu items initially, but only if not already fetched during login
   if (!isLoggedIn()) {
    await fetchMenuItems(); // No token, fetch without authorization header
  } else {
    // await fetchMenuItems(); // Fetch and render menu items if already logged in
    renderLandingPage(); // Render landing page after successful initial login
  }

  if (sectionSummary) {
    sectionSummary.addEventListener("click", async function (event) {
      if (event.target.classList.contains("remove-single-item")) {
        const itemId = event.target.getAttribute("data-item-id");
        await removeSingleItem(itemId);
      } else if (event.target.classList.contains("remove-all-item")) {
        const itemId = event.target.getAttribute("data-item-id");
        await removeAllItem(itemId);
      } else if (event.target.classList.contains("add-single-item")) {
        const itemId = event.target.getAttribute("data-item-id");
        await addSingleItem(itemId);
      }
    });
  }

  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      navbarLinks.classList.toggle("active");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      navbarLinks.classList.remove("active");
    });
  }

  document.addEventListener("click", function (event) {
    if (
      !navbarLinks.contains(event.target) &&
      !toggleButton.contains(event.target) &&
      navbarLinks.classList.contains("active")
    ) {
      navbarLinks.classList.remove("active");
    }
  });

  //! IMPORTANT TO LOAD THE MENU ARRAY WHEN THE PAGE STARTS
  // fetchMenuItems(); // Fetch menu items on page load
});


