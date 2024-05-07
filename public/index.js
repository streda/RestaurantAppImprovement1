import { menuArray } from "./data.js";
import  handleCheckout  from "./handleCheckout.js";

let orderArray = [];

// Initially display a landing page instead of the full menu
const landingPageContent = `
<div class="landing-page-content">
<h2>Welcome to Our Food Ordering App!</h2>
<p>Explore our menu to find your favorite sandwiches, desserts, and drinks. Please navigate to our menu bar at the top right to get started.</p>
<p>🥪 🍪 🍺</p>
</div>
`;

document.addEventListener("DOMContentLoaded", () => {
  // renderMenu(menuArray);

   const menuContainer = document.getElementById("section-menu");
   menuContainer.innerHTML = landingPageContent;
   toggleCompleteOrderButton(false); // Ensure Complete Order button is hidden initially
   
  // Event delegation for the menu items
  document.getElementById("section-menu").addEventListener("click", function(event) {

    // If the add button with the class "add-btn" is clicked Get the specific id for the clicked item then Use the specific item.id to add the specific item
    if (event.target.classList.contains("add-btn")) {
      const itemId = event.target.getAttribute("data-item-id");
      addItem(itemId);
      updateOrderSummary(); // Update the summary on the right whenever an item is added
    }
  });

  //*************************************** */
  const checkoutButton = document.getElementById('complete-order-button');
    if (checkoutButton) {
      checkoutButton.addEventListener('click', handleCompleteOrderButtonClick);
    }
    else {
        console.error('Checkout button not found');
    }

  //? Click event handlers for Navbar Links
  /*
  The data-* attributes in HTML are a way to store custom data on standard HTML elements. The data-* prefix is recognized globally by web browsers, and you do not need to declare it beforehand in your JavaScript or HTML other than using it directly in your markup.
  */
  const navbarLinks = document.querySelector(".navbar-links");
  navbarLinks.addEventListener("click", function(event) {
    const linkType = event.target.getAttribute("data-type");
    if (linkType) {
      event.preventDefault(); // Prevent the default anchor action
      if(linkType === "home"){
        // Render the overview content when Home is clicked
        menuContainer.innerHTML = landingPageContent;
        toggleCompleteOrderButton(false); // Hide the button on the Home page
        toggleOrderSummaryDisplay(false); // Additional function to control order summary visibility

      } else{
        // For other types, filter and display menu items as before
        renderMenuByType(linkType);
        // toggleCompleteOrderButton(true);
        toggleCompleteOrderButton(orderArray.length > 0); // Show the Complete button on each page that an item/items is added
        toggleOrderSummaryDisplay(true); // Show the order summary on each page that an item/items is added
      }
    }
  });

  //? EVENT LISTENERS FOR THE SECTION SUMMARY: "section-summary" is the container for order summary

  const sectionSummary = document.getElementById("section-summary");

  sectionSummary.addEventListener("click", function(event) {
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
    if(event.target.classList.contains("navbar-link")){
      navbarLinks.classList.remove("active");
    }
  })
  
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

function toggleCompleteOrderButton(isRequired) {
  let completeOrderButton = document.getElementById('complete-order-button');
  // If the complete Order button is not created or displayed 
  if (!completeOrderButton) {
    // then call the createCompleteOrderButton() to create it
    completeOrderButton = createCompleteOrderButton();
  }
  // Since the completeOrderButton is hidden initially, Show the button by resetting the display property
  completeOrderButton.style.display = isRequired ? "block" : "none";
}

// completeOrderSection.style.display = ''; // Show the button by resetting the display property

function createCompleteOrderButton(){
  const btn = document.createElement('button');
  btn.id = "complete-order-button";
  btn.textContent = "Complete Order";
  btn.addEventListener('click', handleCompleteOrderButtonClick);

  const displayCompleteOrderButton = document.getElementById('section-complete');
  displayCompleteOrderButton.appendChild(btn);
  return btn;
}


// Handle the checkout process
function handleCompleteOrderButtonClick(){
  if(orderArray.length > 0){
    handleCheckout(orderArray).catch(error => console.error("Checkout failed", error));
  } else {
    alert("Please add items to your order before proceeding to payment.");
  }
}


function renderMenuByType(menuType) {
  // Filters menuArray based on the type and returns an array with the values that pass the filter.
  const filteredMenu = menuArray.filter(item =>
    item.type === menuType
    );
  renderMenu(filteredMenu);
}


//! A FUNCTION THAT TAKES A DATA OF ITEMS AND DISPLAYS THE CONTENT ON THE DOM PAGE

function renderMenu(menuItems) {
  const menuContainer = document.getElementById("section-menu");
  menuContainer.innerHTML = ""; // Clear previous items

  menuItems.forEach(item => {
    const menuHtml = document.createElement('div');
    menuHtml.className = 'menu-item-container';
    menuHtml.innerHTML = `
      <img src="${item.emoji}" class="menu-item-image" alt="${item.name} image" >
      <div class="menu-item-details">
        <h3>${item.name}</h3>
        <p>Ingredients: ${item.ingredients.join(", ")}</p>
        <p>Price: $${item.price}</p>
      </div>
  
      <div class="button-quantity-container" >
        <button class="add-btn" data-item-id="${item.id}">Add to Cart</button>
         <div class="quantity-indicator" id="quantity-indicator-${item.id}">0 item</div>
      </div>
    `;
    menuContainer.appendChild(menuHtml);
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
      // order.item.id === itemInMenuArray.id
    )
    // if there exist the same item in the order Array
    if(itemInOrderArray){
      itemInOrderArray.quantity += 1;
    } else{
      // The item property holds a reference to an item object from menuArray, it means that the item object within each entry of orderArray directly points to an object that originally exists in the menuArray
      // By pushing to the orderArray, you are storing a reference to an item in menuArray object in orderArray. However, the quantity property only can be modified. The item object shouldn't because it would alter the object that it is referring to, which is the the entry in the menuArray object.
      orderArray.push({item : itemInMenuArray, quantity: 1});
    }
  }
  updateOrderSummary();

  // Show the button only if there are items in the order
  toggleCompleteOrderButton(orderArray.length > 0);
  // toggleCompleteOrderButton(true);
}

function updateQuantityIndicators() {
   // Reset all indicators to "0 item" or Reset all indicators to "" 
   document.querySelectorAll('.quantity-indicator').forEach(indicator => {
    indicator.textContent = '0 item';
    // indicator.textContent = '';
  });

  orderArray.forEach((order) => {
    const quantityCount = document.getElementById(
      `quantity-indicator-${order.item.id}`
    );
    if (quantityCount) {
        const itemText = order.quantity > 1 ? 'items' : 'item'; // Handle pluralization
        quantityCount.textContent = `${order.quantity} ${itemText}`;
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
  }
  updateOrderSummary()
}

function addSingleItem(itemId){
  addItem(itemId);
}

 function calculateTotalPrice(orders) {
  return orders.reduce((acc, order) => acc + order.item.price * order.quantity, 0);
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
    const removeSingleOrAll = order.quantity === 1 ? 'remove' : 'remove all';
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

  summaryHtml += `
    <div class="order-total-price">
      <span>Total price: </span>
      <span>$${calculateTotalPrice(orderArray).toFixed(2)}</span>
    </div>
  `

  orderSummaryContainer.innerHTML = summaryHtml;

   // Call updateQuantityIndicators at the end to ensure quantity indicators are updated
   updateQuantityIndicators();
   toggleCompleteOrderButton(orderArray.length > 0);
}


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