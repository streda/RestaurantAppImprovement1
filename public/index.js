import handleCheckout from "./handleCheckout.js";

let orderArray = [];
let menuArray = [];

// Initially display a landing page instead of the full menu
const landingPageContent = `
<div class="landing-page-content">
<h2>Welcome to Our Food Ordering App!</h2>
<p>Explore our menu to find your favorite sandwiches, desserts, and drinks. Please navigate to our menu bar at the top right to get started.</p>
<p>🥪 🍪 🍺</p>
</div>
`;

document.addEventListener("DOMContentLoaded", () => {
  const menuContainer = document.getElementById("section-menu");
  if (menuContainer) {
    menuContainer.innerHTML = landingPageContent;
  } else {
    console.log("section-menu element is not available on this page.");
  }

  toggleCompleteOrderButton(false);

  const sectionMenu = document.getElementById("section-menu");
  if (sectionMenu) {
    sectionMenu.addEventListener("click", function (event) {
      if (event.target.classList.contains("add-btn")) {
        const itemId = event.target.getAttribute("data-item-id");
        addItem(itemId);
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
        // renderMenuByType(linkType);
        fetchCartData()
        .then(validItems => {
          renderMenuByType(linkType); // Ensure this function correctly renders the menu items
          updateOrderSummary(validItems);
          updateQuantityIndicators(validItems);
        });

        toggleCompleteOrderButton(orderArray.length > 0);
        toggleOrderSummaryDisplay(true);
      }
    }
  });

  const sectionSummary = document.getElementById("section-summary");
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

  //! IMPORTANT TO LOAD THE MENU ARRAY WHEN THE PAGE STARTS
  fetchMenuItems(); // Fetch menu items on page load
});


 export function fetchMenuItems(redirect = false) {
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
    menuArray = data; // Update the menuArray with the fetched items
    // renderMenu(data); // Render the menu items

    if(redirect){
      window.location.href = '/';
    }
  })
  .catch(error => console.error('Failed to load menu items:', error));
}

function renderMenuByType(menuType) {
  const filteredMenu = menuArray.filter((item) => item.type === menuType);
  renderMenu(filteredMenu);
}

export function renderMenu(menuItems) {
  const menuContainer = document.getElementById("section-menu");
  if (!menuContainer) {
    console.error("section-menu element is not available on this page.");
    return;
  }
  menuContainer.innerHTML = ""; // Clear previous items

  menuItems.forEach(item => {
    const menuHtml = document.createElement('div');
    menuHtml.className = 'menu-item-container';

     //! Check the quantity of this item in the orderArray
     const orderItem = orderArray.find(order => order.menuItem._id === item._id);
     const quantity = orderItem ? orderItem.quantity : 0;
     const itemText = quantity > 1 ? 'items' : 'item';
     
    menuHtml.innerHTML = `
      <img src="${item.emoji}" class="menu-item-image" alt="${item.name} image" >
      <div class="menu-item-details">
        <h3>${item.name}</h3>
        <p>Ingredients: ${item.ingredients.join(", ")}</p>
        <p>Price: $${item.price}</p>
      </div>
  
      <div class="button-quantity-container" >
        <button class="add-btn" data-item-id="${item._id}">Add to Cart</button>
         <div class="quantity-indicator" id="quantity-indicator-${item._id}">0 item</div>
      </div>
    `;
    menuContainer.appendChild(menuHtml);
  });
}

function fetchCartData() {
  const token = localStorage.getItem('token');

  return fetch('/cart', {
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
      // Filter out items with null menuItem 
      const validItems = data.order.items.filter(item => item.menuItem !== null);
      console.log("Valid Cart Items:", validItems);
      orderArray = validItems; // Update the global orderArray
      // updateOrderSummary(validItems);
      return validItems;
    } else {
      console.error('Invalid cart data:', data);
      // updateOrderSummary([]); // Pass an empty array to clear the order summary
      return [];
    }
  })
  .catch(error => {
    console.error('Failed to fetch cart data:', error);
    // updateOrderSummary([]); // Pass an empty array to clear the order summary
    return [];

  });
}

function addItem(itemId) {
  console.log("Attempting to add item with ID:", itemId);

  // Check if menuArray is defined and has elements
  if (!menuArray || menuArray.length === 0) {
    console.error('menuArray is not defined or empty.');
    alert('Menu items are not loaded. Please try again later.');
    return; // Exit the function early
  }

  const itemInMenuArray = menuArray.find(item => item._id === itemId);
  
  // Check if the item is found in the menuArray
  if (!itemInMenuArray) {
    console.error(`Item with ID ${itemId} not found in the menuArray.`);
    alert(`Item with ID ${itemId} not found in the menu.`);
    return; // Exit the function if the item is not found
  }

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
      menuItemId: itemInMenuArray._id,
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
    return fetchCartData(); // Wait for fetchCartData to complete and return the fetched cart data
  })
  .then(validCartItems => {
    console.log('Valid Cart Items:', validCartItems);
    orderArray = validCartItems; // Update the global orderArray with the valid items
    updateOrderSummary(validCartItems); // Call updateOrderSummary with the fetched cart items
    updateQuantityIndicators(validCartItems); // Update quantity indicators
  })
  .catch(error => {
    console.error('Failed to add item to cart:', error);
    if (error.message.includes('Unauthorized')) {
      alert("You do not have permission to perform this action or your session has expired.");
      window.location.href = '/login.html';
    }
  });
}



// function addItem(itemId) {
//   console.log("Attempting to add item with ID:", itemId);
//   const itemInMenuArray = menuArray.find(item => item._id === itemId);
//   if (itemInMenuArray) {
//     const token = localStorage.getItem('token');
//     console.log('Authorization Header:', `Bearer ${token}`);
//     console.log('Client Time:', new Date().toString());

//     fetch('/add-to-cart', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//         'Cache-Control': 'no-cache'
//       },
//       body: JSON.stringify({
//         menuItemId: itemInMenuArray._id,
//         quantity: 1
//       })
//     })
//     .then(response => {
//       if (!response.ok) {
//         throw new Error(`Failed to add item to cart: ${response.statusText}`);
//       }
//       return response.json();
//     })
//     .then(data => {
//       console.log('Added to cart successfully', data);
//       return fetchCartData(); // Wait for fetchCartData to complete and return the fetched cart data
//     })
//     .then(validCartItems => {
//       console.log('Valid Cart Items:', validCartItems);
//       orderArray = validCartItems; // Update the global orderArray with the valid items
//       updateOrderSummary(validCartItems); // Call updateOrderSummary with the fetched cart items
//       updateQuantityIndicators(validCartItems); // Update quantity indicators
//     })
//     .catch(error => {
//       console.error('Failed to add item to cart:', error);
//       if (error.message.includes('Unauthorized')) {
//         alert("You do not have permission to perform this action or your session has expired.");
//         window.location.href = '/login.html';
//       }
//     });
//   }
// }

function toggleOrderSummaryDisplay(show) {
  const orderSummaryContainer = document.getElementById("section-summary");
  orderSummaryContainer.style.display = show ? "block" : "none";
}

function toggleCompleteOrderButton(isRequired) {
  let completeOrderButton = document.getElementById('complete-order-button');
  if (!completeOrderButton) {
    completeOrderButton = createCompleteOrderButton();
  }
  completeOrderButton.style.display = isRequired ? "block" : "none";
}

function createCompleteOrderButton(){
  const btn = document.createElement('button');
  btn.id = "complete-order-button";
  btn.textContent = "Complete Order";
  btn.addEventListener('click', handleCompleteOrderButtonClick);

  const displayCompleteOrderButton = document.getElementById('section-complete');
  if (displayCompleteOrderButton) {
    displayCompleteOrderButton.appendChild(btn);
  } else {
    console.error("section-complete element is not available on this page.");
  }
  return btn;
}

function handleCompleteOrderButtonClick(){
  if(orderArray.length > 0){
    handleCheckout(orderArray).catch(error => console.error("Checkout failed", error));
  } else {
    alert("Please add items to your order before proceeding to payment.");
  }
}

function updateQuantityIndicators(orderArray) {
  document.querySelectorAll('.quantity-indicator').forEach(indicator => {
    // Set the initial quantity indicator for each item to "0"
    indicator.textContent = '0 item';
  });

  orderArray.forEach((order) => {
    const quantityCount = document.getElementById(`quantity-indicator-${order.menuItem._id}`);
    if (quantityCount) {
      const itemText = order.quantity > 1 ? 'items' : 'item';
      quantityCount.textContent = `${order.quantity} ${itemText}`;
    }
  });
}



function removeAllItem(itemId) {
  const token = localStorage.getItem('token');

  fetch(`/api/item/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ id: itemId })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to remove item');
    }
    return fetchCartData();
  })
  .then(validCartItems => {
    updateOrderSummary(validCartItems);
  })
  .catch(error => console.error('Error removing item:', error));
}


function removeSingleItem(itemId) {
  const token = localStorage.getItem('token');

  fetch(`/api/item/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ id: itemId, action: 'decrease' })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to update item');
    }
    return fetchCartData()
  })
  .then(validCartItems => {
    updateOrderSummary(validCartItems);
  })
  .catch(error => console.error('Error updating item:', error));
}



function addSingleItem(itemId) {
  const token = localStorage.getItem('token');

  fetch(`/api/item/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ id: itemId, action: 'increase' })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to update item');
    }
    return fetchCartData();
  })
  .then(validCartItems => {
    updateOrderSummary(validCartItems);
  })
  .catch(error => console.error('Error updating item:', error));
}

function calculateTotalPrice(orders) {
  return orders.reduce((acc, order) => {
    if (!order.menuItem) {
      console.error('Invalid order item:', order);
      return acc;
    }
    return acc + order.menuItem.price * order.quantity;
  }, 0);
}

function updateOrderSummary(items) {
  if (!items || !Array.isArray(items)) {
    console.error('Invalid items array:', items);
    items = []; // Ensure items is at least an empty array
    return;
  }


  console.log('Updating order summary with items:', items);
  
  const orderSummaryContainer = document.getElementById("section-summary");
  orderSummaryContainer.innerHTML = "";

  const receiptDate = new Date().toLocaleDateString('en-US',{
    month: 'long',
    year: 'numeric',
    day: 'numeric'
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

  items.forEach(order => {
    const item = order.menuItem;
    if (!item) {
      console.error('Invalid item in order:', order);
      return;
    }
    summaryHtml += `
      <div class="receipt-item">
        <span class="order-item-name">${item.name}
            <span class="remove-all-item" data-item-id="${item._id}" role="button" tabindex="0">remove all</span>
        </span>
        <span class="order-item-quantity">
          <button class="remove-single-item" data-item-id="${item._id}">-</button>
          ${order.quantity}
          <button class="add-single-item" data-item-id="${item._id}">+</button>
        </span>
        <span class="order-item-price">$${(item.price * order.quantity).toFixed(2)}</span>
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




// document.addEventListener("DOMContentLoaded", () => {
//   const menuContainer = document.getElementById("section-menu");
//   if (menuContainer) {
//     menuContainer.innerHTML = landingPageContent;
//   } else {
//     console.log("section-menu element is not available on this page.");
//   }

//   toggleCompleteOrderButton(false);

//   const sectionMenu = document.getElementById("section-menu");
//   if (sectionMenu) {
//     sectionMenu.addEventListener("click", function (event) {
//       if (event.target.classList.contains("add-btn")) {
//         const itemId = event.target.getAttribute("data-item-id");
//         addItem(itemId);
//         fetchCartData();
//       }
//     });
//   }

//   const checkoutButton = document.getElementById("complete-order-button");
//   if (checkoutButton) {
//     checkoutButton.addEventListener("click", handleCompleteOrderButtonClick);
//   } else {
//     console.error("Checkout button not found");
//   }

//   const navbarLinks = document.querySelector(".navbar-links");
//   navbarLinks.addEventListener("click", function (event) {
//     const linkType = event.target.getAttribute("data-type");
//     if (linkType) {
//       event.preventDefault();
//       if (linkType === "home") {
//         if (menuContainer) {
//           menuContainer.innerHTML = landingPageContent;
//         }
//         toggleCompleteOrderButton(false);
//         toggleOrderSummaryDisplay(false);
//       } else {
//         renderMenuByType(linkType);
//         toggleCompleteOrderButton(orderArray.length > 0);
//         toggleOrderSummaryDisplay(true);
//       }
//     }
//   });

  
//   const sectionSummary = document.getElementById("section-summary");
//   if (sectionSummary) {
//     sectionSummary.addEventListener("click", function (event) {
//       if (event.target.classList.contains("remove-single-item")) {
//         const itemId = event.target.getAttribute("data-item-id");
//         removeSingleItem(itemId);
//       } else if (event.target.classList.contains("remove-all-item")) {
//         const itemId = event.target.getAttribute("data-item-id");
//         removeAllItem(itemId);
//       } else if (event.target.classList.contains("add-single-item")) {
//         const itemId = event.target.getAttribute("data-item-id");
//         addSingleItem(itemId);
//       }
//     });
//   }

//   const toggleButton = document.querySelector(".toggle-button");
//   if (toggleButton) {
//     toggleButton.addEventListener("click", function () {
//       navbarLinks.classList.toggle("active");
//     });
//   }

//   navbarLinks.addEventListener("click", (event) => {
//     if (event.target.classList.contains("navbar-link")) {
//       navbarLinks.classList.remove("active");
//     }
//   });

//   const closeBtn = document.getElementById("close-btn");
//   if (closeBtn) {
//     closeBtn.addEventListener("click", () => {
//       navbarLinks.classList.remove("active");
//     });
//   }

//   document.addEventListener("click", function (event) {
//     if (
//       !navbarLinks.contains(event.target) &&
//       !toggleButton.contains(event.target) &&
//       navbarLinks.classList.contains("active")
//     ) {
//       navbarLinks.classList.remove("active");
//     }
//   });

//   fetchMenuItems(); // Fetch menu items on page load
// });

// function removeSingleItem(itemId){
//   const item = orderArray.find((order) => order.item._id === itemId);
//   if (item && item.quantity > 1) {
//     item.quantity -= 1;
//     fetch("/api/item/update", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         id: itemId,
//         quantity: item.quantity,
//       }),
//     })
//     .then((response) => {
//       if (!response.ok) throw new Error("Failed to update item");
//       updateOrderSummary();
//     })
//     .catch((error) => console.error("Error updating item:", error));
//   } else if (item && item.quantity === 1) {
//     fetch("/api/item/remove", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ id: itemId }),
//     })
//     .then((response) => {
//       if (!response.ok) throw new Error("Failed to remove item");
//       orderArray = orderArray.filter((order) => order.item._id !== itemId);
//       updateOrderSummary();
//     })
//     .catch((error) => console.error("Error removing item:", error));
//   }
// }

// function addSingleItem(itemId){
//   addItem(itemId);
// }

// function removeAllItem(itemId){
//   orderArray = orderArray.filter(order => 
//     order.item._id !== itemId
//   )
//   updateOrderSummary();
// }


// function calculateTotalPrice(orders) {
//   return orders.reduce((acc, order) => acc + order.item.price * order.quantity, 0);
// }






// document.addEventListener("DOMContentLoaded", () => {
//   const itemsContainer = document.getElementById("items-container");
//   const summaryContainer = document.getElementById("summary-container");
//   const displayCompleteOrderButton = document.getElementById("section-complete");

//   if (itemsContainer) {
//     itemsContainer.innerHTML = landingPageContent;
//   } else {
//     console.log("items-container element is not available on this page.");
//   }

//   toggleCompleteOrderButton(false);

//   const sectionMenu = document.getElementById("items-container");
//   if (sectionMenu) {
//     sectionMenu.addEventListener("click", function (event) {
//       if (event.target.classList.contains("add-btn")) {
//         const itemId = event.target.getAttribute("data-item-id");
//         addItem(itemId);
//       }
//     });
//   }

//   const checkoutButton = document.getElementById("complete-order-button");
//   if (checkoutButton) {
//     checkoutButton.addEventListener("click", handleCompleteOrderButtonClick);
//   } else {
//     console.error("Checkout button not found");
//   }

//   const navbarLinks = document.querySelector(".navbar-links");
//   navbarLinks.addEventListener("click", function (event) {
//     const linkType = event.target.getAttribute("data-type");
//     if (linkType) {
//       event.preventDefault();
//       if (linkType === "home") {
//         if (itemsContainer) {
//           itemsContainer.innerHTML = landingPageContent;
//         }
//         toggleCompleteOrderButton(false);
//         toggleOrderSummaryDisplay(false);
//       } else {
//         renderMenuByType(linkType);
//         toggleCompleteOrderButton(orderArray.length > 0);
//         toggleOrderSummaryDisplay(true);
//       }
//     }
//   });

//   if (summaryContainer) {
//     summaryContainer.addEventListener("click", function (event) {
//       if (event.target.classList.contains("remove-single-item")) {
//         const itemId = event.target.getAttribute("data-item-id");
//         removeSingleItem(itemId);
//       } else if (event.target.classList.contains("remove-all-item")) {
//         const itemId = event.target.getAttribute("data-item-id");
//         removeAllItem(itemId);
//       } else if (event.target.classList.contains("add-single-item")) {
//         const itemId = event.target.getAttribute("data-item-id");
//         addSingleItem(itemId);
//       }
//     });
//   }

//   const toggleButton = document.querySelector(".toggle-button");
//   if (toggleButton) {
//     toggleButton.addEventListener("click", function () {
//       navbarLinks.classList.toggle("active");
//     });
//   }

//   navbarLinks.addEventListener("click", (event) => {
//     if (event.target.classList.contains("navbar-link")) {
//       navbarLinks.classList.remove("active");
//     }
//   });

//   const closeBtn = document.getElementById("close-btn");
//   if (closeBtn) {
//     closeBtn.addEventListener("click", () => {
//       navbarLinks.classList.remove("active");
//     });
//   }

//   document.addEventListener("click", function (event) {
//     if (
//       !navbarLinks.contains(event.target) &&
//       !toggleButton.contains(event.target) &&
//       navbarLinks.classList.contains("active")
//     ) {
//       navbarLinks.classList.remove("active");
//     }
//   });
//   fetchMenuItems(); // Fetch menu items on page load
// });

// function fetchMenuItems() {
//   const token = localStorage.getItem('token');
//   if (!token) {
//     console.error('No token found in localStorage');
//     return;
//   }

//   fetch('http://localhost:3000/menu-items', {
//     headers: {
//       'Authorization': `Bearer ${token}`
//     }
//   })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error(`Failed to load menu items: ${response.statusText}`);
//     }
//     return response.json();
//   })
//   .then(data => {
//     renderMenu(data);
//   })
//   .catch(error => console.error('Failed to load menu items:', error));
// }

// function toggleOrderSummaryDisplay(show) {
//   const orderSummaryContainer = document.getElementById("summary-container");
//   if (orderSummaryContainer) {
//     orderSummaryContainer.style.display = show ? "block" : "none";
//   }
// }

// function toggleCompleteOrderButton(isRequired) {
//   let completeOrderButton = document.getElementById("complete-order-button");
//   if (!completeOrderButton) {
//     completeOrderButton = createCompleteOrderButton();
//   }
//   if (completeOrderButton) {
//     completeOrderButton.style.display = isRequired ? "block" : "none";
//   }
// }

// function createCompleteOrderButton() {
//   const btn = document.createElement("button");
//   btn.id = "complete-order-button";
//   btn.textContent = "Complete Order";
//   btn.addEventListener("click", handleCompleteOrderButtonClick);

//   const displayCompleteOrderButton = document.getElementById("section-complete");
//   if (displayCompleteOrderButton) {
//     displayCompleteOrderButton.appendChild(btn);
//   } else {
//     console.error("section-complete element is not available on this page.");
//   }
//   return btn;
// }

// function handleCompleteOrderButtonClick() {
//   if (orderArray.length > 0) {
//     handleCheckout(orderArray).catch((error) => console.error("Checkout failed", error));
//   } else {
//     alert("Please add items to your order before proceeding to payment.");
//   }
// }

// function renderMenuByType(menuType) {
//   fetchMenuItemsByType(menuType);
// }

// function fetchMenuItemsByType(menuType) {
//   const token = localStorage.getItem('token');
//   if (!token) {
//     console.error('No token found in localStorage');
//     return;
//   }

//   fetch(`http://localhost:3000/menu-items?type=${menuType}`, {
//     headers: {
//       'Authorization': `Bearer ${token}`
//     }
//   })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error(`Failed to load menu items: ${response.statusText}`);
//     }
//     return response.json();
//   })
//   .then(data => {
//     renderMenu(data);
//   })
//   .catch(error => console.error('Failed to load menu items:', error));
// }


// export function renderMenu(menuItems) {
//   const menuContainer = document.getElementById("items-container");
//   if (menuContainer) {
//     menuContainer.innerHTML = "";
//     menuItems.forEach((item) => {
//       const menuHtml = document.createElement("div");
//       menuHtml.className = "menu-item-container";
//       menuHtml.innerHTML = `
//         <img src="${item.emoji}" class="menu-item-image" alt="${item.name} image">
//         <div class="menu-item-details">
//           <h3>${item.name}</h3>
//           <p>Ingredients: ${item.ingredients.join(", ")}</p>
//           <p>Price: $${item.price}</p>
//         </div>
//         <div class="button-quantity-container">
//           <button class="add-btn" data-item-id="${item._id}">Add to Cart</button>
//           <div class="quantity-indicator" id="quantity-indicator-${item._id}">0 item</div>
//         </div>
//       `;
//       menuContainer.appendChild(menuHtml);
//     });
//   } else {
//     console.error("items-container element is not available on this page.");
//   }
// }

// function addItem(itemId) {
//   console.log("Attempting to add item with ID:", itemId);
//   const token = localStorage.getItem('token');
//   console.log('Authorization Header:', `Bearer ${token}`);
//   console.log('Client Time:', new Date().toString());

//   fetch('/add-to-cart', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`,
//       'Cache-Control': 'no-cache'
//     },
//     body: JSON.stringify({
//       menuItemId: itemId,
//       quantity: 1
//     })
//   })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error(`Failed to add item to cart: ${response.statusText}`);
//     }
//     return response.json();
//   })
//   .then(data => {
//     console.log('Added to cart successfully', data);
//     fetchCartData();
//   })
//   .catch(error => {
//     console.error('Failed to add item to cart:', error);
//     if (error.message.includes('Unauthorized')) {
//       alert("You do not have permission to perform this action or your session has expired.");
//       window.location.href = '/login.html';
//     }
//   });
// }

// function fetchCartData() {
//   const token = localStorage.getItem('token');

//   fetch('/cart', {
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`
//     }
//   })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error(`Failed to fetch cart data: ${response.statusText}`);
//     }
//     return response.json();
//   })
//   .then(data => {
//     console.log('Cart data fetched:', JSON.stringify(data, null, 2));
//     if (data && data.order && Array.isArray(data.order.items)) {
//       // Filter out items with null menuItem to avoid errors
//       const validItems = data.order.items.filter(item => item.menuItem !== null);
//       updateOrderSummary(validItems);
//     } else {
//       console.error('Invalid cart data:', data);
//     }
//   })
//   .catch(error => {
//     console.error('Failed to fetch cart data:', error);
//   });
// }


// function updateQuantityIndicators() {
//   document.querySelectorAll(".quantity-indicator").forEach((indicator) => {
//     indicator.textContent = "0 item";
//   });

//   orderArray.forEach((order) => {
//     const quantityCount = document.getElementById(`quantity-indicator-${order.item._id}`);
//     if (quantityCount) {
//       const itemText = order.quantity > 1 ? "items" : "item";
//       quantityCount.textContent = `${order.quantity} ${itemText}`;
//     }
//   });
// }

// function removeAllItem(itemId) {
//   orderArray = orderArray.filter((order) => order.item._id !== itemId);
//   updateOrderSummary();
// }

// function removeSingleItem(itemId) {
//   const item = orderArray.find((order) => order.item._id === itemId);
//   if (item && item.quantity > 1) {
//     item.quantity -= 1;
//     fetch("/api/item/update", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         id: itemId,
//         quantity: item.quantity,
//       }),
//     })
//     .then((response) => {
//       if (!response.ok) throw new Error("Failed to update item");
//       updateOrderSummary();
//     })
//     .catch((error) => console.error("Error updating item:", error));
//   } else if (item && item.quantity === 1) {
//     fetch("/api/item/remove", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ id: itemId }),
//     })
//     .then((response) => {
//       if (!response.ok) throw new Error("Failed to remove item");
//       orderArray = orderArray.filter((order) => order.item._id !== itemId);
//       updateOrderSummary();
//     })
//     .catch((error) => console.error("Error removing item:", error));
//   }
// }

// function addSingleItem(itemId) {
//   addItem(itemId);
// }

// function calculateTotalPrice(orders) {
//   return orders.reduce((acc, order) => acc + order.item.price * order.quantity, 0);
// }

// function updateOrderSummary(items) {
//   console.log("Updating order summary.");
//   const orderSummaryContainer = document.getElementById("summary-container");
//   orderSummaryContainer.innerHTML = "";

//   const receiptDate = new Date().toLocaleDateString("en-US", {
//     month: "long",
//     year: "numeric",
//     day: "numeric",
//   });

//   let summaryHtml = `
//     <div class="receipt-header">Order Summary - (${receiptDate})</div>
//     <div class="receipt-body">
//       <div class="receipt-titles">
//         <span>Item</span>
//         <span>Quantity</span>
//         <span>Price</span>
//       </div>
//       <div class="horizontal-divider-dashed"></div>
//   `;

//   if (items && Array.isArray(items)) {
//     items.forEach(order => {
//       const item = order.menuItem;
//       summaryHtml += `
//         <div class="receipt-item">
//           <span class="order-item-name">${item.name}</span>
//           <span class="order-item-quantity">
//             <button class="remove-single-item" data-item-id="${item._id}">-</button>
//             ${order.quantity}
//             <button class="add-single-item" data-item-id="${item._id}">+</button>
//           </span>
//           <span class="order-item-price">$${(item.price * order.quantity).toFixed(2)}</span>
//         </div>
//       `;
//     });

//     const totalPrice = items.reduce((acc, order) => acc + order.menuItem.price * order.quantity, 0);
//     summaryHtml += `
//       <div class="order-total-price">
//         <span>Total price: </span>
//         <span>$${totalPrice.toFixed(2)}</span>
//       </div>
//     `;
//   } else {
//     console.error("Invalid items array:", items);
//   }

//   summaryHtml += `
//     <div class="horizontal-divider"></div>
//     </div>
//   `;

//   orderSummaryContainer.innerHTML = summaryHtml;
//   console.log("Updated HTML:", orderSummaryContainer.innerHTML);
//   updateQuantityIndicators();
//   toggleCompleteOrderButton(items && items.length > 0);
// }


// Clean up existing orders with null menuItem fields
// Order.updateMany(
//   { "items.menuItem": null },
//   { $pull: { items: { menuItem: null } } }
// ).exec();


// function fetchCartData() {
//   const token = localStorage.getItem('token');

//   fetch('/cart', {
//       method: 'GET',
//       headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//       }
//   })
//   .then(response => {
//       if (!response.ok) {
//           throw new Error(`Failed to fetch cart data: ${response.statusText}`);
//       }
//       return response.json();
//   })
//   .then(data => {
//       updateOrderSummary(data.order.items); // Pass the fetched items to updateOrderSummary
//   })
//   .catch(error => {
//       console.error('Failed to fetch cart data:', error);
//   });
// }

//! My Old addItem() Function
// function addItem(itemId) {
//   console.log("Attempting to add item with ID:", itemId);
//   const itemInMenuArray = menuArray.find(item => item.id === (itemId));
//   if (itemInMenuArray) {
//     let itemInOrderArray = orderArray.find(order => order.item.id === (itemId));
//     if (itemInOrderArray) {
//       itemInOrderArray.quantity += 1;
//     } else {
//       orderArray.push({ item: itemInMenuArray, quantity: 1 });
//     }
//     updateOrderSummary();
//     toggleCompleteOrderButton(orderArray.length > 0);

//     const token = localStorage.getItem('token');  // Fetch the token from localStorage
//     console.log('Authorization Header:', `Bearer ${token}`);  // Right before the fetch call

//     console.log('Client Time:', new Date().toString());

//     fetch('/add-to-cart', {
//         method: 'POST',
//         headers: { 
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`,  // Use the token in the Authorization header
//             'Cache-Control': 'no-cache'  // Instructs the browser not to cache the request
//         },
//         body: JSON.stringify({
//             menuItemId: itemInMenuArray.id,
//             quantity: 1
//         })
//     })
//     .then(response => {
//       if (!response.ok) {
//           throw new Error(`Failed to add item to cart: ${response.statusText}`);
//       }
//       return response.json();
//     })
//     .then(data => {
//       console.log('Added to cart successfully', data)
//       updateOrderSummary();
//     })
//     .catch(error => {
//       console.error('Failed to add item to cart:', error);
//       if (error.message.includes('Unauthorized')) {
//           alert("You do not have permission to perform this action or your session has expired.");
//           window.location.href = '/login.html';
//       }
//     });
//   }
// }


//! My old updateOrderSummary() Function
// function updateOrderSummary() {
//   console.log("Updating order summary.");
//   const orderSummaryContainer = document.getElementById("section-summary");
//   orderSummaryContainer.innerHTML = "";

//   const receiptDate = new Date().toLocaleDateString("en-US", {
//     month: "long",
//     year: "numeric",
//     day: "numeric",
//   });

//   let summaryHtml = `
//     <div class="receipt-header">Order Summary - (${receiptDate})</div>
//     <div class="receipt-body">
//       <div class="receipt-titles">
//         <span>Item</span>
//         <span>Quantity</span>
//         <span>Price</span>
//       </div>

//       <div class="horizontal-divider-dashed"> </div>
//   `;

//   orderArray.forEach((order) => {
//     console.log("Rendering order item:", order);  // Log each item being processed
//     const removeSingleOrAll = order.quantity === 1 ? "remove" : "remove all";
//     summaryHtml += `
//       <div class="receipt-item">
//         <span class="order-item-name">${order.item.name}
//             <span class="remove-all-item" data-item-id="${
//               order.item.id
//             }" role="button" tabindex="0">${removeSingleOrAll}</span>
//         </span>
//         <span class="order-item-quantity">
//           ${
//             order.quantity > 0
//               ? `<button class="remove-single-item" data-item-id="${order.item.id}">-</button>`
//               : ""
//           }
//           ${order.quantity}
//           <button class="add-single-item" data-item-id="${
//             order.item.id
//           }">+</button>
//         </span>
//         <span class="order-item-price">$${(
//           order.item.price * order.quantity
//         ).toFixed(2)}</span>
//       </div>
//     `;
//   });

//   summaryHtml += `
//     <div class="horizontal-divider"></div>

//     </div>
//   `;

//   summaryHtml += `
//     <div class="order-total-price">
//       <span>Total price: </span>
//       <span>$${calculateTotalPrice(orderArray).toFixed(2)}</span>
//     </div>
//   `;

//   orderSummaryContainer.innerHTML = summaryHtml;

//   console.log("Updated HTML:", orderSummaryContainer.innerHTML);  // Log the new HTML
//   // Call updateQuantityIndicators at the end to ensure quantity indicators are updated
//   updateQuantityIndicators();
//   toggleCompleteOrderButton(orderArray.length > 0);
// }



// function addItem(itemId) {
//   const itemInMenuArray = menuArray.find(item => item.id === itemId);
//   if (itemInMenuArray) {
//       const token = localStorage.getItem('token');

//       fetch('/add-to-cart', {
//           method: 'POST',
//           headers: {
//               'Content-Type': 'application/json',
//               'Authorization': `Bearer ${token}`
//           },
//           body: JSON.stringify({
//               menuItemId: itemInMenuArray.id,
//               quantity: 1
//           })
//       })
//       .then(response => {
//           if (!response.ok) {
//               throw new Error(`Failed to add item to cart: ${response.statusText}`);
//           }
//           return response.json();
//       })
//       .then(data => {
//           console.log('Added to cart successfully', data);
//           fetchCartData(); // Fetch updated cart data
//       })
//       .catch(error => {
//           console.error('Failed to add item to cart:', error);
//           if (error.message.includes('Unauthorized')) {
//               alert("You do not have permission to perform this action or your session has expired.");
//               window.location.href = '/login.html';
//           }
//       });
//   }
// }

// function fetchCartData() {
//   const token = localStorage.getItem('token');

//   fetch('/cart', {
//       method: 'GET',
//       headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//       }
//   })
//   .then(response => {
//       if (!response.ok) {
//           throw new Error(`Failed to fetch cart data: ${response.statusText}`);
//       }
//       return response.json();
//   })
//   .then(data => {
//       updateOrderSummary(data.order.items); // Pass the fetched items to updateOrderSummary
//   })
//   .catch(error => {
//       console.error('Failed to fetch cart data:', error);
//   });
// }

// function checkout() {
//   // Preparing the items with the expected nested structure
//   const preparedItems = orderArray.map(order => ({
//       item: {  // Encapsulate item details under 'item'
//           id: order.item.id,
//           name: order.item.name,
//           price: order.item.price,
//       },
//       quantity: order.quantity
//   }));

//   fetch("/create-checkout-session", {
//       method: "POST",
//       headers: {
//           "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ items: preparedItems })
//   })
//   .then(response => response.json())
//   .then(session => {
//       window.location.href = session.url;
//   })
//   .catch(error => console.error("Error initiating checkout:", error));
// }

// You can bind this function to a checkout button
// function checkout() {
//   // Assuming the server is ready to handle a POST request to '/create-checkout-session'
//   fetch("/create-checkout-session", {
//       method: "POST",
//       headers: {
//           "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ items: orderArray })
//   })
//   .then(response => response.json())
//   .then(session => {
//       // Assuming the response includes a URL to redirect to for payment
//       window.location.href = session.url;
//   })
//   .catch(error => console.error("Error initiating checkout:", error));
// }









/* 

function removeAllItem(itemId){
  orderArray = orderArray.filter(order => 
    order.item._id !== itemId
  )
  updateOrderSummary();
}

function removeSingleItem(itemId){
  const item = orderArray.find((order) => order.item._id === itemId);
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
      updateOrderSummary(orderArray); // Update the orderArray after changing quantity
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
      orderArray = orderArray.filter((order) => order.item._id !== itemId);
      updateOrderSummary(orderArray); // Update the orderArray after removing item
    })
    .catch((error) => console.error("Error removing item:", error));
  }
}

function addSingleItem(itemId){
  addItem(itemId);
}


function calculateTotalPrice(orders) {
  return orders.reduce((acc, order) => acc + order.item.price * order.quantity, 0);
}


*/