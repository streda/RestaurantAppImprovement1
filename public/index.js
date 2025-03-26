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
  removeAllItem,
  removeSingleItem,
  addSingleItem,
  toggleCompleteOrderButton,
} from "./utils.js";

// import { 
//   initializeCheckoutButton,
// } from "./checkoutUtils.js"; 


//! This exports "orderArray" and "menuArray" to be manipulated and updated
//! We declare the here because index.js is the entry point of the app
export let orderArray = [];
export let menuArray = [];

document.addEventListener("DOMContentLoaded", async () => {
  // To improve performance and avoid any unnecessary UI rendering, if the page is the login or signup page exit early, and any further code will not be executed.
   const isAuthenticationPage = window.location.pathname === '/login.html' || 
                               window.location.pathname === '/signUp.html';

  // Stops further execution before loading cart, menu, or UI updates
  if (isAuthenticationPage) {
    return;  
  }

  /* 
    Creates a helper object to work with URL parameters. Checks the url for the "paymentSuccess" word. If true, it updates the UI. 
  */
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("paymentSuccess") === "true") {
    const cartData = await fetchCartData();
    updateOrderSummary(cartData);
  }

  // On page load update the UI
  const cartItems = await fetchCartData();
  updateOrderSummary(cartItems);
  updateQuantityIndicators(cartItems);
  toggleCompleteOrderButton(cartItems.length > 0);
  // initializeCheckoutButton();
  
  const savedPage = localStorage.getItem("currentPage") || "home";
    // Check login status and render content accordingly
  if (isLoggedIn()) {
    // User is logged in, load the correct menu based on saved page
    if (savedPage === "home") {
      //  renderLandingPage(); //Render Landing Page
      toggleCompleteOrderButton(false);
      toggleOrderSummaryDisplay(false);
    } else {
      await fetchMenuItems();
      renderMenuByType(savedPage, isLoggedIn()); // Fetch menu items if not home
    }

    updateOrderSummary(cartItems);
    updateQuantityIndicators(cartItems);
    toggleCompleteOrderButton(cartItems.length > 0);
    toggleOrderSummaryDisplay(cartItems.length > 0);
  } else {
    // User is logged out: landing page is already in index.html
    toggleCompleteOrderButton(false);
    toggleOrderSummaryDisplay(false);
  }

  const navbarLinks = document.querySelector(".navbar-links");
      if (navbarLinks) {
        navbarLinks.addEventListener("click", async function (event) {
          const linkType = event.target.getAttribute("data-type");
          if (linkType) {
            event.preventDefault();
            hideLoginForm(); // Hide login form when switching pages

            localStorage.setItem("currentPage", linkType); // Store the selected page

            if (linkType === "home") {
               renderLandingPage(); //Render Landing Page
              toggleCompleteOrderButton(false);
              toggleOrderSummaryDisplay(false);
            } else {
                if (isLoggedIn()) {
                  await fetchMenuItems();
                  renderMenuByType(linkType, isLoggedIn());

                  const cartItems = await fetchCartData();
                  updateOrderSummary(cartItems);
                  updateQuantityIndicators(cartItems);
                  toggleCompleteOrderButton(cartItems.length > 0);
                  toggleOrderSummaryDisplay(cartItems.length > 0);
                } else {
                    alert("Please log in or sign up to view menu items.");
                    // Redirect to the login page (optional)
                  //  window.location.href = "/login.html";
                    return; // Stop further processing
                }
              }
            }
          });
        }

  const sectionSummary = document.getElementById("order-summary-container");
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

      const updatedItems = await fetchCartData();
      toggleCompleteOrderButton(updatedItems.length > 0);
    });
  }

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


// import {
//   fetchMenuItems,
//   renderMenuByType,
//   fetchCartData,
//   updateOrderSummary,
//   updateQuantityIndicators,
//   renderLandingPage,
//   hideLoginForm,
//   isLoggedIn,
//   toggleOrderSummaryDisplay,
//   removeAllItem,
//   removeSingleItem,
//   addSingleItem,
// } from "./utils.js";

// import { 
//   initializeCheckoutButton,
//   toggleCompleteOrderButton
// } from "./checkoutUtils.js"; 

// // export let orderArray = [];
// // export let menuArray = [];

// let menuArray = [];
// let orderArray = [];

// export function getMenuArray() {
//   return menuArray;
// }
// // Reset the menuArray to 0 so that it is ready to store the latest version of the datas from the server/DataBase. This will prevent from displaying outdated data if changes was made to the DB.

// // This line populates the menuArray with the menu items received from the API.
// // The ...data spreads the data as individual item objects. Thus every object item is added individually inside the variable menuArray[]
// export function setMenuArray(newData) {
//   menuArray.length = 0; // Clear existing array
//   menuArray.push(...newData); // Add new items
// }

// export function getOrderArray() {
//   return orderArray;
// }

// export function setOrderArray(newData) {
//   orderArray.length = 0; // Clear existing array
//   orderArray.push(...newData); // Add new items
// }

// document.addEventListener("DOMContentLoaded", async () => {
//   const urlParams = new URLSearchParams(window.location.search);
//   if (urlParams.get("paymentSuccess") === "true") {
//     const cartData = await fetchCartData();
//     updateOrderSummary(cartData);
//   }

//   const currentPagePath = window.location.pathname;
//   const isAuthenticationPage = currentPagePath === '/login.html' || currentPagePath === '/signUp.html';

//   if (isAuthenticationPage) {
//     return; 
//   }

//   const cartItems = await fetchCartData();
//   updateOrderSummary(cartItems);
//   updateQuantityIndicators(cartItems);
//   toggleCompleteOrderButton(cartItems.length > 0);
//   initializeCheckoutButton();
  
//   //******************************************** */
//   const savedPage = localStorage.getItem("currentPage") || "home";
//     // Check login status and render content accordingly
//   if (isLoggedIn()) {
//     // User is logged in, load the correct menu based on saved page
//     if (savedPage === "home") {
//       //  renderLandingPage(); //Render Landing Page
//       toggleCompleteOrderButton(false);
//       toggleOrderSummaryDisplay(false);
//     } else {
//       await fetchMenuItems();
//       renderMenuByType(savedPage, isLoggedIn()); // Fetch menu items if not home
//     }

//     updateOrderSummary(cartItems);
//     updateQuantityIndicators(cartItems);
//     toggleCompleteOrderButton(cartItems.length > 0);
//     toggleOrderSummaryDisplay(cartItems.length > 0);
//   } else {
//     // User is logged out: landing page is already in index.html
//     toggleCompleteOrderButton(false);
//     toggleOrderSummaryDisplay(false);
//   }

//   const navbarLinks = document.querySelector(".navbar-links");
//       if (navbarLinks) {
//         navbarLinks.addEventListener("click", async function (event) {
//           const linkType = event.target.getAttribute("data-type");
//           if (linkType) {
//             event.preventDefault();
//             hideLoginForm(); // Hide login form when switching pages

//             localStorage.setItem("currentPage", linkType); // Store the selected page

//             if (linkType === "home") {
//                renderLandingPage(); //Render Landing Page
//               toggleCompleteOrderButton(false);
//               toggleOrderSummaryDisplay(false);
//             } else {
//                 if (isLoggedIn()) {
//                   await fetchMenuItems();
//                   renderMenuByType(linkType, isLoggedIn());

//                   const cartItems = await fetchCartData();
//                   updateOrderSummary(cartItems);
//                   updateQuantityIndicators(cartItems);
//                   toggleCompleteOrderButton(cartItems.length > 0);
//                   toggleOrderSummaryDisplay(cartItems.length > 0);
//                 } else {
//                     alert("Please log in or sign up to view menu items.");
//                     // Redirect to the login page (optional)
//                   //  window.location.href = "/login.html";
//                     return; // Stop further processing
//                 }
//               }
//             }
//           });
//         }

//   const sectionSummary = document.getElementById("order-summary-container");
//   if (sectionSummary) {
//     sectionSummary.addEventListener("click", async function (event) {
//       const itemId = event.target.getAttribute("data-item-id");

//       if (event.target.classList.contains("remove-single-item")) {
//         await removeSingleItem(itemId);
//       } else if (event.target.classList.contains("remove-all-item")) {
//         await removeAllItem(itemId);
//       } else if (event.target.classList.contains("add-single-item")) {
//         await addSingleItem(itemId);
//       }

//       const updatedItems = await fetchCartData();
//       toggleCompleteOrderButton(updatedItems.length > 0);
//     });
//   }

//   const toggleButton = document.querySelector(".toggle-button");
//   const closeBtn = document.getElementById("close-btn");

//   if (toggleButton) {
//     toggleButton.addEventListener("click", () => {
//       navbarLinks.classList.toggle("active");
//     });
//   }

//   if (closeBtn) {
//     closeBtn.addEventListener("click", () => {
//       navbarLinks.classList.remove("active");
//     });
//   }

//   document.addEventListener("click", (event) => {
//     if (!navbarLinks.contains(event.target) &&
//         !toggleButton.contains(event.target) &&
//         navbarLinks.classList.contains("active")) {
//       navbarLinks.classList.remove("active");
//     }
//   });
// });

  //****************************************************************** */

