import { menuArray, orderArray } from "./index.js";

const API_BASE_URL = "https://truefood.rest";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get("canceled") === "true") {
    alert("Payment canceled. Restoring your cart.");
    await restoreCartFromDatabase();
  }
});

async function restoreCartFromDatabase() {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found in localStorage. Cannot restore cart.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/cart`, {
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

      // Properly updating `orderArray`
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
  const token = localStorage.getItem("token");
  return !!token;
}

export function hideLoginForm() {
    const loginForm = document.getElementById("login-container");
  if (loginForm) {
    loginForm.style.display = "none";
  }
}

export async function fetchMenuItems(redirect = false) {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found, user might be logged out.");
    return;
  }


  try {
    const response = await fetch(`${API_BASE_URL}/menu-items`, {
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
    menuArray.length = 0;
    menuArray.push(...data);

    if (redirect) {
      renderLandingPage();
      hideLoginForm();
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

  // Decode and check if token is expired
  try {
    const payloadBase64 = token.split(".")[1]; 
    const decodedPayload = JSON.parse(atob(payloadBase64));


    if (new Date(decodedPayload.exp * 1000) < new Date()) {
      console.warn("Token expired, logging out user.");
      localStorage.removeItem("token");
      window.location.href = "/login.html";
      return []; // Prevent further execution
    }
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    localStorage.removeItem("token");
    window.location.href = "/login.html";
    return [];
  }


  try {
    const response = await fetch(`${API_BASE_URL}/cart`, {
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
        const validCartItems = data.order.items || [];


        // Ensure Order Summary is updated
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
  menuContainer.innerHTML = ""; // Clear previous items
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

  // Attach event listeners to "Add to Cart" buttons
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
    const response = await fetch("/add-to-cart", {
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

    // Immediately update the UI
    updateOrderSummary(validCartItems);
    updateQuantityIndicators(validCartItems);

    // Ensure the order summary section appears immediately after adding an item
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
    const response = await fetch(`/api/item/update`, {
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
    const response = await fetch(`/api/item/update`, {
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
    const response = await fetch(`/api/item/remove`, {
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

    // Ensure Order Summary visibility updates in real-time
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

// export function initializeCheckoutButton() {
//   const checkoutButton = document.getElementById("complete-order-button");
  
//   if (checkoutButton) {
//     checkoutButton.addEventListener("click", handleCompleteOrderButtonClick);
//   } else {
//     console.error("Checkout button not found");
//   }
// }

// export function toggleCompleteOrderButton(isRequired) {
//   let completeOrderButton = document.getElementById("complete-order-button");

//   if (!completeOrderButton) {
//     completeOrderButton = document.createElement("button");
//     completeOrderButton.id = "complete-order-button";
//     completeOrderButton.textContent = "Complete Order";
//     completeOrderButton.classList.add("complete-order-btn");
//     completeOrderButton.disabled = !isRequired;
//     completeOrderButton.addEventListener("click", handleCompleteOrderButtonClick);

//     // Attach inside the #section-summary div
//     const orderSummaryContainer = document.getElementById("section-summary");
//     if (orderSummaryContainer) {
//       orderSummaryContainer.appendChild(completeOrderButton);
//     }
//   }

//   completeOrderButton.style.display = isRequired ? "block" : "none";
// }


// export function createCompleteOrderButton() {
//     const btn = document.createElement("button");
//     btn.id = "complete-order-button";
//     btn.textContent = "Complete Order";
//     btn.classList.add("complete-order-btn");
//     btn.disabled = true; // Initially disabled

//     btn.addEventListener("click", handleCompleteOrderButtonClick);

//     const orderSummaryContainer = document.getElementById("section-summary"); // Fix: Append inside #section-summary
//     if (orderSummaryContainer) {
//         orderSummaryContainer.appendChild(btn);
//     } else {
//         console.error("#section-summary is MISSING in the DOM!");
//     }
//     return btn;
// }


// export function handleCompleteOrderButtonClick() {
//   if (orderArray.length > 0) {
//     handleCheckout(orderArray).catch((error) =>
//       console.error("Checkout failed", error)
//     );
//   } else {
//     alert("Please add items to your order before proceeding to payment.");
//   }
// }


export async function updateOrderWithValidItems(orderId, validItems) {
  const token = localStorage.getItem("token");
  try {
    await fetch(`/update-order/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: validItems }),
    });
  } catch (error) {
    console.error("Failed to update order:", error);
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

/*  
    Client-Side calculateTotalPrice: 
    On the client side, I need a quick calculation using the data already present in the client’s state. 
    This function does not need to fetch any additional data and hence can be synchronous.
  */

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
    items = []; // Ensure items is at least an empty array
    return;
  }


  const orderSummaryContainer = document.getElementById("section-summary");

  if (!orderSummaryContainer) {
    return;
  }
  orderSummaryContainer.innerHTML = ""; // Clear previous summary

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
    orderSummaryContainer.appendChild(completeOrderBtn); // Append inside summary


  updateQuantityIndicators(items);
  toggleCompleteOrderButton(items.length > 0);
}



// export default async function handleCheckout(orderArray) {
//   const items = orderArray.map(({menuItem, quantity})=> ({
//     id: menuItem._id,
//     name: menuItem.name,
//     price: menuItem.price,
//     quantity: quantity,
//   }));

//   const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   credentials: 'include',
//   body: JSON.stringify({ items }), // Send the items to the backend
// });

//   if(!response.ok){
//     throw new Error('Network response was not ok.');
//   }

//   let session;
//   try {
//     session = await response.json();
//   } catch (error) {
//     throw new Error('Failed to parse JSON response.');
//   }
//   window.location.href = session.url; // Redirect to Stripe Checkout

// }



// const API_BASE_URL = window.location.origin.includes("localhost")
//   ? "http://localhost:5005"
//   : "https://truefood.rest";