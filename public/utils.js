// import { menuArray, orderArray} from "./index.js";
import { getMenuArray, setMenuArray, getOrderArray, setOrderArray } from "./index.js";
import { 
  toggleCompleteOrderButton, 
  handleCompleteOrderButtonClick 
} from "./checkoutUtils.js";

const API_BASE_URL = "https://truefood.rest";

//! handle payment cancellation restoration and call fetchCartData() on page load.
document.addEventListener("DOMContentLoaded", async () => {
  try {

    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("paymentSuccess") === "true") {

      setOrderArray([]); // ✅ Reset cart array
      updateOrderSummary(getOrderArray());
      toggleOrderSummaryDisplay(false);
      toggleCompleteOrderButton(false);

      await fetchCartData();

      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    if (urlParams.get("canceled") === "true") {
      alert("Payment canceled. Restoring your cart.");
      await restoreCartFromDatabase();
    }

    const cartData = await fetchCartData(); 
    setOrderArray(cartData); // ✅ Set order array with fetched data

    updateOrderSummary(getOrderArray());
    toggleCompleteOrderButton(getOrderArray().length > 0);
    toggleOrderSummaryDisplay(getOrderArray().length > 0);

  } catch (error) {
    console.error("Failed to load cart on page load:", error);
  }
});


async function restoreCartFromDatabase() {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found in localStorage. Cannot restore cart.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to restore cart from database:", response.statusText);
      return;
    }

    const data = await response.json();
    const validCartItems = data.order?.items || [];

    if (validCartItems.length > 0) {
      setOrderArray(validCartItems.map(item => ({
        menuItem: item.menuItem,
        quantity: item.quantity
      }))); // ✅ Set order array with restored cart data

      updateOrderSummary(getOrderArray());
      toggleCompleteOrderButton(true);
      toggleOrderSummaryDisplay(true);
    } else {
      console.warn("Cart was empty upon restoration.");
    }
  } catch (error) {
    console.error("Error restoring cart from database:", error);
  }
}

export function renderLandingPage() {
  const menuContainer = document.getElementById("section-menu");
  if (menuContainer) {
    menuContainer.innerHTML = `
        <div class="landing-page-content">
          <h2>Welcome to Our Food Ordering App!</h2>
          <p>Explore our menu to find your favorite sandwiches, desserts, and drinks. Please navigate to our menu bar at the top right to get started.</p>
          <p>🥪 🍪 🍺</p>
        </div>
      `;
  }
}


export function isLoggedIn() {
  // localStorage.getItem("token") returns a string value of the token or null if the token is not found in localStorage.
  const token = localStorage.getItem("token");
  return !!token;
}

export function hideLoginForm() {
    const loginForm = document.getElementById("login-container");
  if (loginForm) {
    loginForm.style.display = "none";
  }
}


//^ fetch the menu items from the server and store them in the menuArray
export async function fetchMenuItems(redirect = false) {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found, user might be logged out.");
    return;
  }


  try {
    const response = await fetch(`${API_BASE_URL}/api/menu-items`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized! Redirecting to login.");
        alert("Session expired. Please log in again.");
        window.location.href = "/login.html";
        return;
      }
      throw new Error(`Failed to load menu items: ${response.statusText}`);
    }

    const data = await response.json();

    // ✅ Use setMenuArray 
    setMenuArray(data);
  
    if (redirect) {
      renderLandingPage(); // Render welcome message
      hideLoginForm();     // Hide login form
      renderMenu(getMenuArray(), isLoggedIn()); // Render the menu items
    } else {
      // When no redirect is needed, refresh the menu items.
      renderMenu(getMenuArray(), isLoggedIn()); // render menu items
    }
  } catch (error) {
    console.error("Failed to load menu items:", error);
  }
}

export async function fetchCartData() {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found in localStorage");
    return [];
  }

  try {
    const payloadBase64 = token.split(".")[1]; 
    const decodedPayload = JSON.parse(atob(payloadBase64));

    if (new Date(decodedPayload.exp * 1000) < new Date()) {
      console.warn("Token expired, logging out user.");
      localStorage.removeItem("token");
      window.location.href = "/login.html";
      return []; 
    }
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    localStorage.removeItem("token");
    window.location.href = "/login.html";
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized! Redirecting to login.");
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "/login.html";
        return [];
      }
      throw new Error(`Failed to fetch cart data: ${response.statusText}`);
    }

    const data = await response.json();
    const validCartItems = data?.order.items || [];

    // ✅ Use the setter function to update orderArray
    setOrderArray(validCartItems);

     setTimeout(() => {
      updateOrderSummary(getOrderArray()); 
      updateQuantityIndicators(getOrderArray());
      toggleCompleteOrderButton(getOrderArray().length > 0);
      toggleOrderSummaryDisplay(getOrderArray().length > 0);
    }, 0);

    return getOrderArray();
  } catch (error) {
    console.error("Failed to fetch cart data:", error);
    return [];
  }
}

export function renderMenuByType(menuType, isUserLoggedIn) {
  const filteredMenu = getMenuArray().filter((item) => item.type === menuType);
  renderMenu(filteredMenu, isUserLoggedIn);
}

export function renderMenu(menuItems, isUserLoggedIn) {
  const menuContainer = document.getElementById("section-menu");
  if (!menuContainer) {
    console.error("section-menu element is not available on this page.");
    return;
  }

  menuContainer.innerHTML = ""; 

  menuItems.forEach((item) => {
    const menuHtml = document.createElement("div");
    menuHtml.className = "menu-item-container";

    const orderItem = getOrderArray().find(
      (order) => order.menuItem._id === item._id
    );
    const quantity = orderItem ? orderItem.quantity : 0;
    const itemText = quantity > 1 ? "items" : "item";

    menuHtml.innerHTML = `
      <img src="${item.emoji}" class="menu-item-image" alt="${item.name} image">
      <div class="menu-item-details">
        <h3>${item.name}</h3>
        <p>Ingredients: ${item.ingredients.join(", ")}</p>
        <p>Price: $${item.price}</p>
      </div>
  
      <div class="button-quantity-container">
        ${
          isUserLoggedIn
            ? `<button class="add-btn" data-item-id="${item._id}">Add to Cart</button>`
            : ""
        }
        <div class="quantity-indicator" id="quantity-indicator-${item._id}">${quantity} ${itemText}</div>
      </div>
    `;
    menuContainer.appendChild(menuHtml);
  });

  if (isUserLoggedIn) {
    document.querySelectorAll(".add-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const itemId = event.target.getAttribute("data-item-id");
        await addItem(itemId);
      });
    });
  }
}

export async function addItem(itemId) {
  if (!getMenuArray() || getMenuArray().length === 0) {
    console.error("The menu array is not defined or empty.");
    alert("Menu items are not loaded. Please try again later.");
    return;
  }

  const itemInMenuArray = getMenuArray().find((item) => item._id === itemId);
  if (!itemInMenuArray) {
    console.error(`Item with ID ${itemId} not found in the menuArray.`);
    alert(`Item with ID ${itemId} not found in the menu.`);
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const response = await fetch("/api/add-to-cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        menuItemId: itemInMenuArray._id,
        quantity: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add item to cart: ${response.statusText}`);
    }

    // const data = await response.json();
    const validCartItems = await fetchCartData();
    setOrderArray(validCartItems);

   // Ensure UI updates reflect the latest state
    setTimeout(() => {
      updateOrderSummary(getOrderArray());
      updateQuantityIndicators(getOrderArray());
      toggleOrderSummaryDisplay(getOrderArray().length > 0);
      toggleCompleteOrderButton(getOrderArray().length > 0);
    }, 0); // Allows state update to settle before triggering UI updates

  } catch (error) {
    console.error("Failed to add item to cart:", error);
    if (error.message.includes("Unauthorized")) {
      alert(
        "You do not have permission to perform this action or your session has expired."
      );
      window.location.href = "/login.html";
    }
  }
}

export async function addSingleItem(itemId) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`/api/update-item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: itemId, action: "increase" }),
    });

    if (!response.ok) {
      throw new Error("Failed to update item");
    }

    // const data = await response.json();

    const validCartItems = await fetchCartData();
    updateOrderSummary(validCartItems);
    updateQuantityIndicators(validCartItems);
  } catch (error) {
    console.error("Error updating item:", error);
  }
}

export async function removeSingleItem(itemId) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`/api/update-item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: itemId, action: "decrease" }),
    });

    if (!response.ok) {
      throw new Error("Failed to update item");
    }

    // const data = await response.json();

    const validCartItems = await fetchCartData();

    updateOrderSummary(validCartItems);
    updateQuantityIndicators(validCartItems);
  } catch (error) {
    console.error("Error updating item:", error);
  }
}

export async function removeAllItem(itemId) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`/api/remove-item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: itemId }),
    });

    if (!response.ok) {
      throw new Error("Failed to remove item");
    }

    const validCartItems = await fetchCartData();
    updateOrderSummary(validCartItems);
    updateQuantityIndicators(validCartItems);

    toggleOrderSummaryDisplay(validCartItems.length > 0);
    toggleCompleteOrderButton(validCartItems.length > 0);
  } catch (error) {
    console.error("Error removing item:", error);
  }
}

export function toggleOrderSummaryDisplay(show) {
  const orderSummaryContainer = document.getElementById("section-summary");
  
  if (orderSummaryContainer) {
    orderSummaryContainer.style.display = show ? "block" : "none";
  }
}

export function updateQuantityIndicators() {
  document.querySelectorAll(".quantity-indicator").forEach((indicator) => {
    indicator.textContent = "0 item";
  });

  getOrderArray().forEach((order) => {
    const quantityCount = document.getElementById(
      `quantity-indicator-${order.menuItem._id}`
    );
    if (quantityCount) {
      const itemText = order.quantity > 1 ? "items" : "item";
      quantityCount.textContent = `${order.quantity} ${itemText}`;
    }
  });
}

// export function updateQuantityIndicators(orderArray) {
//   document.querySelectorAll(".quantity-indicator").forEach((indicator) => {
//     indicator.textContent = "0 item";
//   });

//   orderArray.forEach((order) => {
//     const quantityCount = document.getElementById(
//       `quantity-indicator-${order.menuItem._id}`
//     );
//     if (quantityCount) {
//       const itemText = order.quantity > 1 ? "items" : "item";
//       quantityCount.textContent = `${order.quantity} ${itemText}`;
//     }
//   });
// }

export function calculateTotalPrice(orders) {
  return orders.reduce((acc, order) => {
    if (!order.menuItem) {
      console.error("Invalid order item:", order);
      return acc;
    }
    return acc + order.menuItem.price * order.quantity;
  }, 0);
}

export function updateOrderSummary(items) {
  if (!items || !Array.isArray(items)) {
    console.error("Invalid items array:", items);
    items = []; 
    return;
  }


  const orderSummaryContainer = document.getElementById("section-summary");

  if (!orderSummaryContainer) {
    return;
  }
  orderSummaryContainer.innerHTML = ""; 

  const receiptDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    day: "numeric",
  });

  let summaryHtml = `
        <div class="receipt-header">Order Summary - (${receiptDate})</div>
        <div class="receipt-body">
          <div class="receipt-titles">
            <span>Item</span>
            <span>Quantity</span>
            <span>Price</span>
          </div>
          <div class="horizontal-divider-dashed"> </div>
      `;

  items.forEach((order) => {
    const item = order.menuItem;
    if (!item) {
      console.error("Invalid item in order:", order);
      return;
    }
    summaryHtml += `
          <div class="receipt-item">
            <span class="order-item-name">${item.name}
                <span class="remove-all-item" data-item-id="${
                  item._id
                }" role="button" tabindex="0">remove all</span>
            </span>
            <span class="order-item-quantity">
              <button class="remove-single-item" data-item-id="${
                item._id
              }">-</button>
              ${order.quantity}
              <button class="add-single-item" data-item-id="${
                item._id
              }">+</button>
            </span>
            <span class="order-item-price">$${(
              item.price * order.quantity
            ).toFixed(2)}</span>
          </div>
        `;
  });

  summaryHtml += `
        <div class="horizontal-divider"></div>
        </div>
      `;

  summaryHtml += `
        <div class="order-total-price">
          <span>Total price: </span>
          <span>$${calculateTotalPrice(items).toFixed(2)}</span>
        </div>
      `;

  orderSummaryContainer.innerHTML = summaryHtml;

  //! Ensure button is inside order summary
    const completeOrderBtn = document.createElement("button");
    completeOrderBtn.id = "complete-order-button";
    completeOrderBtn.textContent = "Complete Order";
    completeOrderBtn.classList.add("complete-order-btn");
    completeOrderBtn.disabled = items.length === 0; 

    completeOrderBtn.addEventListener("click", handleCompleteOrderButtonClick);
    orderSummaryContainer.appendChild(completeOrderBtn); 

  updateQuantityIndicators(items);
  toggleCompleteOrderButton(items.length > 0);
}



/* 
import { menuArray, orderArray} from "./index.js";

import { 
  toggleCompleteOrderButton, 
  handleCompleteOrderButtonClick 
} from "./checkoutUtils.js";

const API_BASE_URL = "https://truefood.rest";

//! handle payment cancellation restoration and call fetchCartData() on page load.
document.addEventListener("DOMContentLoaded", async () => {
  try {

    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("paymentSuccess") === "true") {

      orderArray.length = 0; 
      updateOrderSummary(orderArray);
      toggleOrderSummaryDisplay(false);
      toggleCompleteOrderButton(false);

      await fetchCartData();

      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    if (urlParams.get("canceled") === "true") {
      alert("Payment canceled. Restoring your cart.");
      await restoreCartFromDatabase();
    }

    const cartData = await fetchCartData(); 
    orderArray.length = 0; 
    orderArray.push(...cartData); 

    updateOrderSummary(orderArray);
    toggleCompleteOrderButton(orderArray.length > 0);
    toggleOrderSummaryDisplay(orderArray.length > 0);

  } catch (error) {
    console.error("Failed to load cart on page load:", error);
  }
});


async function restoreCartFromDatabase() {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found in localStorage. Cannot restore cart.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to restore cart from database:", response.statusText);
      return;
    }

    const data = await response.json();

    const validCartItems = data.order?.items || [];

    if (validCartItems.length > 0) {

      orderArray.length = 0;
      orderArray.push(...validCartItems.map(item => ({
        menuItem: item.menuItem,
        quantity: item.quantity
      })));

      updateOrderSummary(orderArray);
      toggleCompleteOrderButton(true);
      toggleOrderSummaryDisplay(true);
    } else {
      console.warn("Cart was empty upon restoration.");
    }
  } catch (error) {
    console.error("Error restoring cart from database:", error);
  }
}


export function renderLandingPage() {
  const menuContainer = document.getElementById("section-menu");
  if (menuContainer) {
    menuContainer.innerHTML = `
        <div class="landing-page-content">
          <h2>Welcome to Our Food Ordering App!</h2>
          <p>Explore our menu to find your favorite sandwiches, desserts, and drinks. Please navigate to our menu bar at the top right to get started.</p>
          <p>🥪 🍪 🍺</p>
        </div>
      `;
  }
}


export function isLoggedIn() {
  // localStorage.getItem("token") returns a string value of the token or null if the token is not found in localStorage.
  const token = localStorage.getItem("token");
  return !!token;
}

export function hideLoginForm() {
    const loginForm = document.getElementById("login-container");
  if (loginForm) {
    loginForm.style.display = "none";
  }
}


//^ fetch the menu items from the server and store them in the menuArray
export async function fetchMenuItems(redirect = false) {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found, user might be logged out.");
    return;
  }


  try {
    const response = await fetch(`${API_BASE_URL}/api/menu-items`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized! Redirecting to login.");
        alert("Session expired. Please log in again.");
        window.location.href = "/login.html";
        return;
      }
      throw new Error(`Failed to load menu items: ${response.statusText}`);
    }

    const data = await response.json();

    // Reset the menuArray to 0 so that it is ready to store the latest version of the datas from the server/DataBase. This will prevent from displaying outdated data if changes was made to the DB.
    menuArray.length = 0;

    // This line populates the menuArray with the menu items received from the API.
    // The ...data spreads the data as individual item objects. Thus every object item is added individually inside the variable menuArray[]
    menuArray.push(...data);


    // if (redirect) {
    //   renderLandingPage();
    //   hideLoginForm();
    // }
    if (redirect) {
      renderLandingPage(); // Render welcome message
      hideLoginForm();     // Hide login form
      renderMenu(menuArray, isLoggedIn()); // Render the menu items
    } else {
      // When no redirect is needed, refresh the menu items.
      renderMenu(menuArray, isLoggedIn()); // render menu items
    }
  } catch (error) {
    console.error("Failed to load menu items:", error);
  }
}


// if (redirect) {
//       renderLandingPage(); // Render welcome message
//       hideLoginForm();     // Hide login form
//       renderMenu(menuArray, isLoggedIn()); // Render the menu items
//     } else {
//       // When no redirect is needed, refresh the menu items.
//       renderMenu(menuArray, isLoggedIn()); // render menu items
//     }

export async function fetchCartData() {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found in localStorage");
    return [];
  }

  try {
    const payloadBase64 = token.split(".")[1]; 
    const decodedPayload = JSON.parse(atob(payloadBase64));


    if (new Date(decodedPayload.exp * 1000) < new Date()) {
      console.warn("Token expired, logging out user.");
      localStorage.removeItem("token");
      window.location.href = "/login.html";
      return []; 
    }
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    localStorage.removeItem("token");
    window.location.href = "/login.html";
    return [];
  }


  try {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });


    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized! Redirecting to login.");
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "/login.html";
        return [];
      }
      throw new Error(`Failed to fetch cart data: ${response.statusText}`);
    }

    const data = await response.json();
    const validCartItems = data?.order.items || [];


 if (validCartItems.length === 0) {
      orderArray.length = 0;
    }
        updateOrderSummary(validCartItems);
        toggleCompleteOrderButton(validCartItems.length > 0);
         toggleOrderSummaryDisplay(validCartItems.length > 0); 

        return validCartItems;
  } catch (error) {
    console.error("Failed to fetch cart data:", error);
    return [];
  }
}

export function renderMenuByType(menuType, isUserLoggedIn) {
  const filteredMenu = menuArray.filter((item) => item.type === menuType);
  renderMenu(filteredMenu, isUserLoggedIn);
}

export function renderMenu(menuItems, isUserLoggedIn) {
  const menuContainer = document.getElementById("section-menu");
  if (!menuContainer) {
    console.error("section-menu element is not available on this page.");
    return;
  }
  menuContainer.innerHTML = ""; 
  menuItems.forEach((item) => {
    const menuHtml = document.createElement("div");
    menuHtml.className = "menu-item-container";

    const orderItem = orderArray.find(
      (order) => order.menuItem._id === item._id
    );
    const quantity = orderItem ? orderItem.quantity : 0;
    const itemText = quantity > 1 ? "items" : "item";

    menuHtml.innerHTML = `
      <img src="${item.emoji}" class="menu-item-image" alt="${item.name} image">
      <div class="menu-item-details">
        <h3>${item.name}</h3>
        <p>Ingredients: ${item.ingredients.join(", ")}</p>
        <p>Price: $${item.price}</p>
      </div>
  
      <div class="button-quantity-container">
        ${
          isUserLoggedIn
            ? `<button class="add-btn" data-item-id="${item._id}">Add to Cart</button>`
            : ""
        }
        <div class="quantity-indicator" id="quantity-indicator-${item._id}">${quantity} ${itemText}</div>
      </div>
    `;
    menuContainer.appendChild(menuHtml);
  });

  if (isUserLoggedIn) {
    document.querySelectorAll(".add-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const itemId = event.target.getAttribute("data-item-id");
        await addItem(itemId);
      });
    });
  }
}

export async function addItem(itemId) {
  if (!menuArray || menuArray.length === 0) {
    console.error("menuArray is not defined or empty.");
    alert("Menu items are not loaded. Please try again later.");
    return;
  }

  const itemInMenuArray = menuArray.find((item) => item._id === itemId);
  if (!itemInMenuArray) {
    console.error(`Item with ID ${itemId} not found in the menuArray.`);
    alert(`Item with ID ${itemId} not found in the menu.`);
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const response = await fetch("/api/add-to-cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        menuItemId: itemInMenuArray._id,
        quantity: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add item to cart: ${response.statusText}`);
    }

    const data = await response.json();
    const validCartItems = await fetchCartData();

    orderArray.length = 0; 
    orderArray.push(...validCartItems);

    updateOrderSummary(validCartItems);
    updateQuantityIndicators(validCartItems);

    toggleOrderSummaryDisplay(validCartItems.length > 0);
    toggleCompleteOrderButton(validCartItems.length > 0);

  } catch (error) {
    console.error("Failed to add item to cart:", error);
    if (error.message.includes("Unauthorized")) {
      alert(
        "You do not have permission to perform this action or your session has expired."
      );
      window.location.href = "/login.html";
    }
  }
}

export async function addSingleItem(itemId) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`/api/update-item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: itemId, action: "increase" }),
    });

    if (!response.ok) {
      throw new Error("Failed to update item");
    }

    const data = await response.json();

    const validCartItems = await fetchCartData();
    updateOrderSummary(validCartItems);
    updateQuantityIndicators(validCartItems);
  } catch (error) {
    console.error("Error updating item:", error);
  }
}

export async function removeSingleItem(itemId) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`/api/update-item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: itemId, action: "decrease" }),
    });

    if (!response.ok) {
      throw new Error("Failed to update item");
    }

    const data = await response.json();

    const validCartItems = await fetchCartData();

    updateOrderSummary(validCartItems);
    updateQuantityIndicators(validCartItems);
  } catch (error) {
    console.error("Error updating item:", error);
  }
}

export async function removeAllItem(itemId) {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`/api/remove-item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: itemId }),
    });

    if (!response.ok) {
      throw new Error("Failed to remove item");
    }

    const validCartItems = await fetchCartData();
    updateOrderSummary(validCartItems);
    updateQuantityIndicators(validCartItems);

    toggleOrderSummaryDisplay(validCartItems.length > 0);
    toggleCompleteOrderButton(validCartItems.length > 0);
  } catch (error) {
    console.error("Error removing item:", error);
  }
}

export function toggleOrderSummaryDisplay(show) {
  const orderSummaryContainer = document.getElementById("section-summary");
  
  if (orderSummaryContainer) {
    orderSummaryContainer.style.display = show ? "block" : "none";
  }
}

export function updateQuantityIndicators(orderArray) {
  document.querySelectorAll(".quantity-indicator").forEach((indicator) => {
    indicator.textContent = "0 item";
  });

  orderArray.forEach((order) => {
    const quantityCount = document.getElementById(
      `quantity-indicator-${order.menuItem._id}`
    );
    if (quantityCount) {
      const itemText = order.quantity > 1 ? "items" : "item";
      quantityCount.textContent = `${order.quantity} ${itemText}`;
    }
  });
}

export function calculateTotalPrice(orders) {
  return orders.reduce((acc, order) => {
    if (!order.menuItem) {
      console.error("Invalid order item:", order);
      return acc;
    }
    return acc + order.menuItem.price * order.quantity;
  }, 0);
}

export function updateOrderSummary(items) {
  if (!items || !Array.isArray(items)) {
    console.error("Invalid items array:", items);
    items = []; 
    return;
  }


  const orderSummaryContainer = document.getElementById("section-summary");

  if (!orderSummaryContainer) {
    return;
  }
  orderSummaryContainer.innerHTML = ""; 

  const receiptDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    day: "numeric",
  });

  let summaryHtml = `
        <div class="receipt-header">Order Summary - (${receiptDate})</div>
        <div class="receipt-body">
          <div class="receipt-titles">
            <span>Item</span>
            <span>Quantity</span>
            <span>Price</span>
          </div>
          <div class="horizontal-divider-dashed"> </div>
      `;

  items.forEach((order) => {
    const item = order.menuItem;
    if (!item) {
      console.error("Invalid item in order:", order);
      return;
    }
    summaryHtml += `
          <div class="receipt-item">
            <span class="order-item-name">${item.name}
                <span class="remove-all-item" data-item-id="${
                  item._id
                }" role="button" tabindex="0">remove all</span>
            </span>
            <span class="order-item-quantity">
              <button class="remove-single-item" data-item-id="${
                item._id
              }">-</button>
              ${order.quantity}
              <button class="add-single-item" data-item-id="${
                item._id
              }">+</button>
            </span>
            <span class="order-item-price">$${(
              item.price * order.quantity
            ).toFixed(2)}</span>
          </div>
        `;
  });

  summaryHtml += `
        <div class="horizontal-divider"></div>
        </div>
      `;

  summaryHtml += `
        <div class="order-total-price">
          <span>Total price: </span>
          <span>$${calculateTotalPrice(items).toFixed(2)}</span>
        </div>
      `;

  orderSummaryContainer.innerHTML = summaryHtml;

  //! Ensure button is inside order summary
    const completeOrderBtn = document.createElement("button");
    completeOrderBtn.id = "complete-order-button";
    completeOrderBtn.textContent = "Complete Order";
    completeOrderBtn.classList.add("complete-order-btn");
    completeOrderBtn.disabled = items.length === 0; 

    completeOrderBtn.addEventListener("click", handleCompleteOrderButtonClick);
    orderSummaryContainer.appendChild(completeOrderBtn); 

  updateQuantityIndicators(items);
  toggleCompleteOrderButton(items.length > 0);
}

*/