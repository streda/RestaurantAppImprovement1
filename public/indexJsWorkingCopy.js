import { menuArray } from "./data.js";
import  handleCheckout  from "./handleCheckout.js";


let orderArray = [];

// Initially display a landing page instead of the full menu
const landingPageContent = `
<div class="landing-page-content">
<h2>Welcome to Our Food Ordering App!</h2>
<p>Explore our menu to find your favorite sandwiches, desserts, and drinks. Please navigate to our menu bar at the top right to get started.</p>
<p>🥪 🍪 🍺</p>
<!-- Add more content as needed -->
</div>
`;

/* 
Use event delegation to listen for events on multiple elements with a single handler at a common ancestor, a higher-level container that is not removed or overwritten, rather than binding handlers to each element individually. This is particularly effective for handling events on dynamic content.
*/
document.addEventListener("DOMContentLoaded", () => {
  // renderMenu(menuArray);

   const menuContainer = document.getElementById("section-menu");
   menuContainer.innerHTML = landingPageContent;
   toggleCompleteOrderButton(false); // Ensure button is hidden initially
   
  // Event delegation for the menu items
  document.getElementById("section-menu").addEventListener("click", function(event) {
    if (event.target.classList.contains("circle")) {
      const itemId = event.target.getAttribute("data-item-id");
      addItem(itemId);
    }
  });


  //! Click event handlers for Navbar Links
  /*
  The data-* attributes in HTML are a way to store custom data on standard HTML elements. The data-* prefix is recognized globally by web browsers, and you do not need to declare it beforehand in your JavaScript or HTML other than using it directly in your markup.
  */
  const navbarLinks = document.querySelector(".navbar-links");
  navbarLinks.addEventListener("click", function(event) {
    const type = event.target.getAttribute("data-type");
    if (type) {
      event.preventDefault(); // Prevent the default anchor action
      if(type === "home"){
        // Render the overview content when Home is clicked
        menuContainer.innerHTML = landingPageContent;
        toggleCompleteOrderButton(false); // Hide the button on the Home page
        toggleOrderSummaryDisplay(false); // Additional function to control order summary visibility

      } else{
        // For other types, filter and display menu items as before
        renderMenuByType(type);
        // toggleCompleteOrderButton(true);
        toggleCompleteOrderButton(orderArray.length > 0); // Show the Complete button on each page that an item/items is added
        toggleOrderSummaryDisplay(true); // Show the order summary on each page that an item/items is added
      }
    }
  });

  // Assuming "section-summary" is the container for order summary
  document.getElementById("section-summary").addEventListener("click", function(event) {
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

 // Toggle navbar on hamburger icon click
  const toggleButton = document.querySelector('.toggle-button');
  toggleButton.addEventListener('click', function() {
    navbarLinks.classList.toggle('active')
  })

  // Close navbar when a link is clicked

  navbarLinks.addEventListener("click", (event) => {
    if(event.target.tagName === "A"){
      navbarLinks.classList.remove("active");
    }
  })
  
    // // Close button functionality
    // const closeBtn = document.querySelector(".close-btn");
    // closeBtn.addEventListener('click', () => {
    //   navbarLinks.classList.remove('active');
    // });


  // Close button functionality
  const closeBtn = document.getElementById("close-btn");
  closeBtn.addEventListener('click', () => {
    navbarLinks.classList.remove('active');
  })

  // Optional: Close navbar if clicked outside 
  document.addEventListener('click', function(event) {
    // Check if the click happened outside the navbarLinks and if the menu is active
    if (!navbarLinks.contains(event.target) && !toggleButton.contains(event.target) && navbarLinks.classList.contains('active')) {
      navbarLinks.classList.remove('active');
    }
  });

});




function toggleOrderSummaryDisplay(show) {
  const orderSummaryContainer = document.getElementById("section-summary");
  orderSummaryContainer.style.display = show ? "block" : "none";
}


// function toggleCompleteOrderButton(isRequired) {
//   const completeOrderButton= document.getElementById('complete-order-button') || createCompleteOrderButton();
//   completeOrderButton.style.display = isRequired ? "block" : "none";
// }

function toggleCompleteOrderButton(isRequired) {
  let completeOrderButton = document.getElementById('complete-order-button');
  if (!completeOrderButton) {
    completeOrderButton = createCompleteOrderButton();
  }
  completeOrderButton.style.display = isRequired ? "block" : "none";
}

// completeOrderSection.style.display = ''; // Show the button by resetting the display property

function createCompleteOrderButton(){
  const btn = document.createElement('button');
  btn.id = "complete-order-button";
  btn.textContent = "Complete Order";
  btn.addEventListener('click', handleCompleteOrderClick);

  const displayCompleteOrderButton = document.getElementById('section-complete');
  displayCompleteOrderButton.appendChild(btn);
  return btn;
}


function handleCompleteOrderClick(){
  if(orderArray.length > 0){
    handleCheckout(orderArray).catch(error => console.error("Checkout failed", error));
  } else {
    alert("Please add items to your order before proceeding to payment.");
  }
}


function renderMenuByType(menuType) {
  // Filter menuArray based on the type
  const filteredMenu = menuArray.filter(item => item.type === menuType);
  renderMenu(filteredMenu);
}



function renderMenu(menu){
  const menuContainer = document.getElementById("section-menu");
  menuContainer.innerHTML = "";


  // For each items in the menuArray create a menu display on the DOM page
  menu.forEach(item => {
    const menuHtml = `
      <div class="menu-item">
        <img src="${item.emoji}" alt="${item.name} image" class="menu-item-image">

        <div class="menu-item-details">
          <h3>${item.name}</h3>
          <p>Ingredients: ${item.ingredients.join(", ")}</p>
          <p>Price: $${item.price}</p>
        </div>

        <div class="button-quantity-container" >
          <button class="circle" data-item-id="${item.id}">+</button>
          <div class="quantity-indicator" id="quantity-indicator-${item.id}">0</div>
        </div>
      </div>
    `
    menuContainer.innerHTML += menuHtml;
  });
} 

function addItem(itemId){
  // Check the clicked id matches the id of an existing item in the original menuArray
  const itemInMenuArray = menuArray.find(item => 
    item.id === Number(itemId)
  )
  // if the clicked id matches the id of an existing item in the original menuArray
  if(itemInMenuArray){
    // Check if there is an item by the same id as in menuArray present in the orderArray so that you can decrement or increment the count
    let itemInOrderArray = orderArray.find(order => 
      order.item.id === Number(itemId)
    )
    // if there exist the same item in the order Array
    if(itemInOrderArray){
      itemInOrderArray.quantity += 1;
    } else{
      orderArray.push({item : itemInMenuArray, quantity: 1});
    }
  }
  updateOrderSummary();

  // Show the button only if there are items in the order
  toggleCompleteOrderButton(true);
  // updateQuantityIndicators();
}

function updateQuantityIndicators() {
   // Reset all indicators to "0 item"
   document.querySelectorAll('.quantity-indicator').forEach(indicator => {
    indicator.textContent = '0 item';
  });

  orderArray.forEach((order) => {
    const quantityIndicator = document.getElementById(
      `quantity-indicator-${order.item.id}`
    );
    if (quantityIndicator) {
        const itemText = order.quantity > 1 ? 'items' : 'item'; // Handle pluralization
        quantityIndicator.textContent = `${order.quantity} ${itemText}`;
    }
  });
}

function removeAllItem(itemId){
  orderArray = orderArray.filter(order => 
    order.item.id !== Number(itemId)
  )
  updateOrderSummary();
}


function removeSingleItem(itemId){
    const indexToRemove = orderArray.findIndex(order => 
    order.item.id === Number(itemId)
  )

  if(indexToRemove !== -1 && orderArray[indexToRemove].quantity > 1){
    orderArray[indexToRemove].quantity -= 1;

    if(orderArray[indexToRemove].quantity <= 0){
      // Reduces the count by removing one item that has this index to remove
      orderArray.splice(indexToRemove, 1);
    }
  }
  updateOrderSummary()
}

function addSingleItem(itemId){
  addItem(itemId);
}

function updateOrderSummary(){
  const orderSummaryContainer = document.getElementById("section-summary");
  orderSummaryContainer.innerHTML = "";

  const receiptDate = new Date().toLocaleDateString('en-US',{
    month: 'long',
    year : 'numeric',
    day: 'numeric'

  })

  let summaryHtml = `
    <div class="receipt-header">Order Summary - (${receiptDate})</div>
    <div class="receipt-body">
      <div class="receipt-titles">
        <span>Item</span>
        <span>Quantity</span>
        <span>Price</span>
      </div>

      <div class="horizontal-divider-dashed"> </div>
  `

  orderArray.forEach(order => {
    // Calculate item total price, ensuring it's $0.00 if quantity is 0
    const removeSingleOrAll = order.quantity === 1 ? 'remove' : 'remove all';
    // const totalPrice = order.quantity > 0 ? (order.item.price * order.quantity).toFixed(2) : '0.00';
  
    summaryHtml += `
      <div class="receipt-item">
        <span class="order-item-name">${order.item.name}
            <span class="remove-all-item" data-item-id="${order.item.id}" role="button" tabindex="0">${removeSingleOrAll}</span>
        </span>
        <span class="order-item-quantity">
          ${order.quantity > 0 ? `<button class="remove-single-item" data-item-id="${order.item.id}">-</button>` : ''}
          ${order.quantity}
          <button class="add-single-item" data-item-id="${order.item.id}">+</button>
        </span>
        <span class="order-item-price">$${(order.item.price * order.quantity).toFixed(2)}</span>
      </div>
    `;
  });
  

  summaryHtml += `
    <div class="horizontal-divider"></div>

    </div>
  `

  const calculateTotalPrice = orderArray.reduce((acc, order) => acc + order.item.price * order.quantity, 0);

  // function calculateTotalPrice(orders) {
  //   return orders.reduce((acc, order) => acc + order.item.price * order.quantity, 0);
  // }

  summaryHtml += `
    <div class="receipt-footer">
      <span>Total price: </span>
      <span>$${calculateTotalPrice.toFixed(2)}</span>
    </div>
  `

  orderSummaryContainer.innerHTML = summaryHtml;

   // Call updateQuantityIndicators at the end to ensure quantity indicators are updated
   updateQuantityIndicators();
   toggleCompleteOrderButton();
}
