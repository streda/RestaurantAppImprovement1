// import { menuArray } from "./data.js";
import handleCheckout from "./handleCheckout.js";

let orderArray = [];

const landingPageContent = `
<div class="landing-page-content">
<h2>Welcome to Our Food Ordering App!</h2>
<p>Explore our menu to find your favorite sandwiches, desserts, and drinks. Please navigate to our menu bar at the top right to get started.</p>
<p>🥪 🍪 🍺</p>
</div>
`;

document.addEventListener("DOMContentLoaded", () => {
  const menuContainer = document.getElementById("main-section-menu");
  const displayCompleteOrderButton = document.getElementById("section-complete");

  if (menuContainer) {
    menuContainer.innerHTML = landingPageContent;
  } else {
    console.log("main-section-menu element is not available on this page.");
  }

  toggleCompleteOrderButton(false);

  const sectionMenu = document.getElementById("section-menu");
  if (sectionMenu) {
    sectionMenu.addEventListener("click", function (event) {
      if (event.target.classList.contains("add-btn")) {
        const itemId = event.target.getAttribute("data-item-id");
        addItem(itemId);
        updateOrderSummary();
      }
    });
  }

  const checkoutButton = document.getElementById("complete-order-button");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", handleCompleteOrderButtonClick);
  } else {
    console.error("Checkout button not found");
  }

  const navbarLinks = document.querySelector(".navbar-links");
  navbarLinks.addEventListener("click", function (event) {
    const linkType = event.target.getAttribute("data-type");
    if (linkType) {
      event.preventDefault();
      if (linkType === "home") {
        if (menuContainer) {
          menuContainer.innerHTML = landingPageContent;
        }
        toggleCompleteOrderButton(false);
        toggleOrderSummaryDisplay(false);
      } else {
        renderMenuByType(linkType);
        toggleCompleteOrderButton(orderArray.length > 0);
        toggleOrderSummaryDisplay(true);
      }
    }
  });

  const sectionSummary = document.getElementById("main-section-summary");
  if (sectionSummary) {
    sectionSummary.addEventListener("click", function (event) {
      if (event.target.classList.contains("remove-single-item")) {
        const itemId = event.target.getAttribute("data-item-id");
        removeSingleItem(itemId);
      } else if (event.target.classList.contains("remove-all-item")) {
        const itemId = event.target.getAttribute("data-item-id");
        removeAllItem(itemId);
      } else if (event.target.classList.contains("add-single-item")) {
        const itemId = event.target.getAttribute("data-item-id");
        addSingleItem(itemId);
      }
    });
  }

  const toggleButton = document.querySelector(".toggle-button");
  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      navbarLinks.classList.toggle("active");
    });
  }

  navbarLinks.addEventListener("click", (event) => {
    if (event.target.classList.contains("navbar-link")) {
      navbarLinks.classList.remove("active");
    }
  });

  const closeBtn = document.getElementById("close-btn");
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
  fetchMenuItems(); // Fetch menu items on page load
});

function fetchMenuItems() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found in localStorage');
    return;
  }

  fetch('http://localhost:3000/menu-items', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to load menu items: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    renderMenu(data);
  })
  .catch(error => console.error('Failed to load menu items:', error));
}

function toggleOrderSummaryDisplay(show) {
  const orderSummaryContainer = document.getElementById("main-section-summary");
  if (orderSummaryContainer) {
    orderSummaryContainer.style.display = show ? "block" : "none";
  }
}

function toggleCompleteOrderButton(isRequired) {
  let completeOrderButton = document.getElementById("complete-order-button");
  if (!completeOrderButton) {
    completeOrderButton = createCompleteOrderButton();
  }
  if (completeOrderButton) {
    completeOrderButton.style.display = isRequired ? "block" : "none";
  }
}

function createCompleteOrderButton() {
  const btn = document.createElement("button");
  btn.id = "complete-order-button";
  btn.textContent = "Complete Order";
  btn.addEventListener("click", handleCompleteOrderButtonClick);

  const displayCompleteOrderButton = document.getElementById("section-complete");
  if (displayCompleteOrderButton) {
    displayCompleteOrderButton.appendChild(btn);
  } else {
    console.error("section-complete element is not available on this page.");
  }
  return btn;
}

function handleCompleteOrderButtonClick() {
  if (orderArray.length > 0) {
    handleCheckout(orderArray).catch((error) => console.error("Checkout failed", error));
  } else {
    alert("Please add items to your order before proceeding to payment.");
  }
}

function renderMenuByType(menuType) {
  const filteredMenu = menuArray.filter((item) => item.type === menuType);
  renderMenu(filteredMenu);
}

export function renderMenu(menuItems) {
  const menuContainer = document.getElementById("main-section-menu");
  if (menuContainer) {
    menuContainer.innerHTML = "";
    menuItems.forEach((item) => {
      const menuHtml = document.createElement("div");
      menuHtml.className = "menu-item-container";
      menuHtml.innerHTML = `
        <img src="${item.emoji}" class="menu-item-image" alt="${item.name} image">
        <div class="menu-item-details">
          <h3>${item.name}</h3>
          <p>Ingredients: ${item.ingredients.join(", ")}</p>
          <p>Price: $${item.price}</p>
        </div>
        <div class="button-quantity-container">
          <button class="add-btn" data-item-id="${item.id}">Add to Cart</button>
          <div class="quantity-indicator" id="quantity-indicator-${item.id}">0 item</div>
        </div>
      `;
      menuContainer.appendChild(menuHtml);
    });
  } else {
    console.error("main-section-menu element is not available on this page.");
  }
}

function addItem(itemId) {
  console.log("Attempting to add item with ID:", itemId);
  const itemInMenuArray = menuArray.find(item => item.id === itemId);
  if (itemInMenuArray) {
    const token = localStorage.getItem('token');
    console.log('Authorization Header:', `Bearer ${token}`);
    console.log('Client Time:', new Date().toString());

    fetch('/add-to-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        menuItemId: itemInMenuArray.id,
        quantity: 1
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to add item to cart: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Added to cart successfully', data);
      fetchCartData();
    })
    .catch(error => {
      console.error('Failed to add item to cart:', error);
      if (error.message.includes('Unauthorized')) {
        alert("You do not have permission to perform this action or your session has expired.");
        window.location.href = '/login.html';
      }
    });
  }
}

function fetchCartData() {
  const token = localStorage.getItem('token');

  fetch('/cart', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to fetch cart data: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Cart data fetched:', JSON.stringify(data, null, 2));
    if (data && data.order && Array.isArray(data.order.items)) {
      updateOrderSummary(data.order.items);
    } else {
      console.error('Invalid cart data:', data);
    }
  })
  .catch(error => {
    console.error('Failed to fetch cart data:', error);
  });
}

function updateQuantityIndicators() {
  document.querySelectorAll(".quantity-indicator").forEach((indicator) => {
    indicator.textContent = "0 item";
  });

  orderArray.forEach((order) => {
    const quantityCount = document.getElementById(`quantity-indicator-${order.item.id}`);
    if (quantityCount) {
      const itemText = order.quantity > 1 ? "items" : "item";
      quantityCount.textContent = `${order.quantity} ${itemText}`;
    }
  });
}

function removeAllItem(itemId) {
  orderArray = orderArray.filter((order) => order.item.id !== Number(itemId));
  updateOrderSummary();
}

function removeSingleItem(itemId) {
  const item = orderArray.find((order) => order.item.id === Number(itemId));
  if (item && item.quantity > 1) {
    item.quantity -= 1;
    fetch("/api/item/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: itemId,
        quantity: item.quantity,
      }),
    })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to update item");
      updateOrderSummary();
    })
    .catch((error) => console.error("Error updating item:", error));
  } else if (item && item.quantity === 1) {
    fetch("/api/item/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId }),
    })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to remove item");
      orderArray = orderArray.filter((order) => order.item.id !== Number(itemId));
      updateOrderSummary();
    })
    .catch((error) => console.error("Error removing item:", error));
  }
}

function addSingleItem(itemId) {
  addItem(itemId);
}

function calculateTotalPrice(orders) {
  return orders.reduce((acc, order) => acc + order.item.price * order.quantity, 0);
}

function updateOrderSummary(items) {
  console.log("Updating order summary.");
  const orderSummaryContainer = document.getElementById("main-section-summary");
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
      <div class="horizontal-divider-dashed"></div>
  `;

  if (items && Array.isArray(items)) {
    items.forEach(order => {
      const item = order.menuItem;
      summaryHtml += `
        <div class="receipt-item">
          <span class="order-item-name">${item.name}</span>
          <span class="order-item-quantity">
            <button class="remove-single-item" data-item-id="${item._id}">-</button>
            ${order.quantity}
            <button class="add-single-item" data-item-id="${item._id}">+</button>
          </span>
          <span class="order-item-price">$${(item.price * order.quantity).toFixed(2)}</span>
        </div>
      `;
    });

    const totalPrice = items.reduce((acc, order) => acc + order.menuItem.price * order.quantity, 0);
    summaryHtml += `
      <div class="order-total-price">
        <span>Total price: </span>
        <span>$${totalPrice.toFixed(2)}</span>
      </div>
    `;
  } else {
    console.error("Invalid items array:", items);
  }

  summaryHtml += `
    <div class="horizontal-divider"></div>
    </div>
  `;

  orderSummaryContainer.innerHTML = summaryHtml;
  console.log("Updated HTML:", orderSummaryContainer.innerHTML);
  updateQuantityIndicators();
  toggleCompleteOrderButton(items && items.length > 0);
}

