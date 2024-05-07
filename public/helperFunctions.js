function addItem(itemId) {
  // Check the clicked id matches the id of an existing item in the original menuArray
  const itemInMenuArray = menuArray.find((item) => item.id === Number(itemId));
  // if the clicked id matches the id of an existing item in the original menuArray
  if (itemInMenuArray) {
    // Check if there is an item by the same id as in menuArray present in the orderArray so that you can decrement or increment the count
    let itemInOrderArray = orderArray.find(
      (order) => order.item.id === Number(itemId)
    );
    // if there exist the same item in the order Array
    if (itemInOrderArray) {
      itemInOrderArray.quantity += 1;
    } else {
      orderArray.push({ item: itemInMenuArray, quantity: 1 });
    }
  }
  updateOrderSummary();

  // Show the button only if there are items in the order
  toggleCompleteOrderButton(true);
  // updateQuantityIndicators();
}

function removeSingleItem(itemId) {
  const indexToRemove = orderArray.findIndex(
    (order) => order.item.id === Number(itemId)
  );

  if (indexToRemove !== -1 && orderArray[indexToRemove].quantity > 1) {
    orderArray[indexToRemove].quantity -= 1;

    if (orderArray[indexToRemove].quantity <= 0) {
      // Reduces the count by removing one item that has this index to remove
      orderArray.splice(indexToRemove, 1);
    }
  }
  updateOrderSummary();
}

function removeAllItem(itemId) {
  orderArray = orderArray.filter((order) => order.item.id !== Number(itemId));
  updateOrderSummary();
}

function addSingleItem(itemId) {
  addItem(itemId);
}


function updateQuantityIndicators() {
  // Reset all indicators to "0 item"
  document.querySelectorAll(".quantity-indicator").forEach((indicator) => {
    indicator.textContent = "0 item";
  });

  orderArray.forEach((order) => {
    const quantityIndicator = document.getElementById(
      `quantity-indicator-${order.item.id}`
    );
    if (quantityIndicator) {
      const itemText = order.quantity > 1 ? "items" : "item"; // Handle pluralization
      quantityIndicator.textContent = `${order.quantity} ${itemText}`;
    }
  });
}

function toggleOrderSummaryDisplay(show) {
  const orderSummaryContainer = document.getElementById("section-summary");
  orderSummaryContainer.style.display = show ? "block" : "none";
}

function toggleCompleteOrderButton(isRequired) {
  let completeOrderButton = document.getElementById("complete-order-button");
  if (!completeOrderButton) {
    completeOrderButton = createCompleteOrderButton();
  }
  completeOrderButton.style.display = isRequired ? "block" : "none";
}

function createCompleteOrderButton() {
  const btn = document.createElement("button");
  btn.id = "complete-order-button";
  btn.textContent = "Complete Order";
  btn.addEventListener("click", handleCompleteOrderButtonClick);

  const displayCompleteOrderButton =
    document.getElementById("section-complete");
  displayCompleteOrderButton.appendChild(btn);
  return btn;
}

function handleCompleteOrderButtonClick() {
  if (orderArray.length > 0) {
    handleCheckout(orderArray).catch((error) =>
      console.error("Checkout failed", error)
    );
  } else {
    alert("Please add items to your order before proceeding to payment.");
  }
}

function calculateTotalPrice(orders) {
  return orders.reduce(
    (acc, order) => acc + order.item.price * order.quantity,
    0
  );
}


function renderMenuByType(menuType) {
  // Filter menuArray based on the type
  const filteredMenu = menuArray.filter((item) => item.type === menuType);
  renderMenu(filteredMenu);
}

function renderMenu(menu) {
  const menuContainer = document.getElementById("section-menu");
  menuContainer.innerHTML = "";

  // For each items in the menuArray create a menu display on the DOM page
  menu.forEach((item) => {
    const menuHtml = `
      <div class="menu-item">
        <img src="${item.emoji}" alt="${
      item.name
    } image" class="menu-item-image">

        <div class="menu-item-details">
          <h3>${item.name}</h3>
          <p>Ingredients: ${item.ingredients.join(", ")}</p>
          <p>Price: $${item.price}</p>
        </div>

        <div class="button-quantity-container" >
          <button class="circle" data-item-id="${item.id}">+</button>
          <div class="quantity-indicator" id="quantity-indicator-${
            item.id
          }">0</div>
        </div>
      </div>
    `;
    menuContainer.innerHTML += menuHtml;
  });
}

function updateOrderSummary() {
  const orderSummaryContainer = document.getElementById("section-summary");
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

  orderArray.forEach((order) => {
    // Calculate item total price, ensuring it's $0.00 if quantity is 0
    const removeSingleOrAll = order.quantity === 1 ? "remove" : "remove all";
    // const totalPrice = order.quantity > 0 ? (order.item.price * order.quantity).toFixed(2) : '0.00';

    summaryHtml += `
      <div class="receipt-item">
        <span class="order-item-name">${order.item.name}
            <span class="remove-all-item" data-item-id="${
              order.item.id
            }" role="button" tabindex="0">${removeSingleOrAll}</span>
        </span>
        <span class="order-item-quantity">
          ${
            order.quantity > 0
              ? `<button class="remove-single-item" data-item-id="${order.item.id}">-</button>`
              : ""
          }
          ${order.quantity}
          <button class="add-single-item" data-item-id="${
            order.item.id
          }">+</button>
        </span>
        <span class="order-item-price">$${(
          order.item.price * order.quantity
        ).toFixed(2)}</span>
      </div>
    `;
  });

  summaryHtml += `
    <div class="horizontal-divider"></div>

    </div>
  `;

  // const calculateTotalPrice = orderArray.reduce((acc, order) => acc + order.item.price * order.quantity, 0);

  summaryHtml += `
    <div class="receipt-footer">
      <span>Total price: </span>
      <span>$${calculateTotalPrice(orderArray).toFixed(2)}</span>
    </div>
  `;

  orderSummaryContainer.innerHTML = summaryHtml;

  // Call updateQuantityIndicators at the end to ensure quantity indicators are updated
  updateQuantityIndicators();
  toggleCompleteOrderButton();
}



// completeOrderSection.style.display = ''; // Show the button by resetting the display property
