// import handleCheckout from "./handleCheckout.js";
import { menuArray, orderArray } from "./index.js";

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
//   const loginForm = document.querySelector(".login-container");
  if (loginForm) {
    loginForm.style.display = "none";
  }
}

export async function fetchMenuItems(redirect = false) {
  const token = localStorage.getItem("token");
  console.log("Checking existence of token before fetchMenuItems sends Authorization header: ", token);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const response = await fetch("https://truefood.rest/menu-items", {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to load menu items: ${response.statusText}`);
    }

    const data = await response.json();

    menuArray.length = 0; // Clear the existing array
    menuArray.push(...data); // Update the menuArray with the fetched items

    if (redirect) {
      renderLandingPage(); // Ensure landing page is rendered after login
      hideLoginForm(); // Ensure the login form is hidden after login
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
    const response = await fetch("https://truefood.rest/cart", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cart data: ${response.statusText}`);
    }

    if (response.status === 404) {
      console.warn("Your cart is empty.");
      return []; // Treat 404 as an empty cart
    }

    const data = await response.json();
    console.log('This a the structure of the order:', data.order);

    // data = The JavaScript object that I want to convert to a JSON string
    // null = a placeholder for the replacer function. Setting it to null means that no replacer function is used, and all properties of the object will be included in the JSON string.
    // 2 = is the space parameter. It specifies the number of spaces to use for indentation in the output JSON string. It makes the JSON string more readable by formatting it with line breaks and indentations.
    console.log("Cart data fetched:", JSON.stringify(data, null, 2));

    if (data && data.order && Array.isArray(data.order.items)) {
      // Filter out items with null menuItem
      const validItems = data.order.items.filter(
        (item) => item.menuItem !== null
      );

      // Update the order with valid items only
      if (validItems.length !== data.order.items.length) {
        await updateOrderWithValidItems(data.order._id, validItems);
      }

      console.log("Valid Cart Items:", validItems);
      orderArray.length = 0; // Clear the existing array
      orderArray.push(...validItems); // Update the global orderArray
      return validItems;
    } else {
      console.error("Invalid cart data:", data);
      return [];
    }
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
  console.log("Attempting to add item with ID:", itemId);

  // Check if menuArray is defined and has elements
  if (!menuArray || menuArray.length === 0) {
    console.error("menuArray is not defined or empty.");
    alert("Menu items are not loaded. Please try again later.");
    return; // Exit the function early
  }

  const itemInMenuArray = menuArray.find((item) => item._id === itemId);

  // Check if the item is found in the menuArray
  if (!itemInMenuArray) {
    console.error(`Item with ID ${itemId} not found in the menuArray.`);
    alert(`Item with ID ${itemId} not found in the menu.`);
    return; // Exit the function if the item is not found
  }

  const token = localStorage.getItem("token");
  console.log("Authorization Header:", `Bearer ${token}`);
  console.log("Client Time:", new Date().toString());

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
    console.log("Added to cart successfully", data);

    const validCartItems = await fetchCartData();
    console.log("Valid Cart Items:", validCartItems);

    orderArray.length = 0; //! Clear the existing array
    // orderArray = validCartItems; // Update the global orderArray with the valid items
    orderArray.push(...validCartItems); // Update the global orderArray with the valid items
    updateOrderSummary(validCartItems); // Call updateOrderSummary with the fetched cart items
    updateQuantityIndicators(validCartItems); // Update quantity indicators
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
    console.log("Removed item successfully", data);

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
    console.log("Removed item successfully", data);

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

    const data = await response.json();
    console.log("Removed item successfully", data);

    const validCartItems = await fetchCartData();

    updateOrderSummary(validCartItems);
    updateQuantityIndicators(validCartItems); // update quantity indicators
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

export function toggleCompleteOrderButton(isRequired) {
  let completeOrderButton = document.getElementById("complete-order-button");
  if (!completeOrderButton) {
    completeOrderButton = createCompleteOrderButton();
  }
  completeOrderButton.style.display = isRequired ? "block" : "none";
}

export function createCompleteOrderButton() {
  const btn = document.createElement("button");
  btn.id = "complete-order-button";
  btn.textContent = "Complete Order";
  btn.addEventListener("click", handleCompleteOrderButtonClick);

  const displayCompleteOrderButton =
    document.getElementById("section-complete");
  if (displayCompleteOrderButton) {
    displayCompleteOrderButton.appendChild(btn);
  } else {
    console.error("section-complete element is not available on this page.");
  }
  return btn;
}

export function handleCompleteOrderButtonClick() {
  if (orderArray.length > 0) {
    handleCheckout(orderArray).catch((error) =>
      console.error("Checkout failed", error)
    );
  } else {
    alert("Please add items to your order before proceeding to payment.");
  }
}


export function initializeCheckoutButton() {
  const checkoutButton = document.getElementById("complete-order-button");
  
  if (checkoutButton) {
    checkoutButton.addEventListener("click", handleCompleteOrderButtonClick);
  } else {
    console.error("Checkout button not found");
  }
}

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
    console.log("Order updated with valid items");
  } catch (error) {
    console.error("Failed to update order:", error);
  }
}

export function updateQuantityIndicators(orderArray) {
  document.querySelectorAll(".quantity-indicator").forEach((indicator) => {
    // Set the initial quantity indicator for each item to "0"
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
    On the client side, I need a quick calculation using the data already present in the client’s state. This function does not need to fetch any additional data and hence can be synchronous.
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

  console.log("Updating order summary with items:", items);

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

  updateQuantityIndicators(items);
  toggleCompleteOrderButton(items.length > 0);
}



export default async function handleCheckout(orderArray) {
  const items = orderArray.map(({menuItem, quantity})=> ({
    id: menuItem._id,
    name: menuItem.name,
    price: menuItem.price,
    quantity: quantity,
  }));

  console.log("Prepared items for checkout:", JSON.stringify({ items }));
  const response = await fetch('https://truefood.rest/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ items }), // Send the items to the backend
});


  console.log(JSON.stringify({ items: orderArray })); // This will show the exact structure being sent to the server


  if(!response.ok){
    throw new Error('Network response was not ok.');
  }

  let session;
  try {
    session = await response.json();
  } catch (error) {
    throw new Error('Failed to parse JSON response.');
  }
  // session = await response.json();
  window.location.href = session.url; // Redirect to Stripe Checkout

  console.log("Another check is a check")

}
