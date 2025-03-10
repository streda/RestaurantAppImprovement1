export default async function handleCheckout(orderArray) {
    const token = localStorage.getItem("token");

    if (!token) {
        console.error("No auth token found, cannot proceed to checkout");
        alert("You must be logged in to complete your order.");
        return;
    }

    const items = orderArray.map(({ menuItem, quantity }) => ({
        id: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: quantity,
    }));

    const API_BASE_URL = window.location.origin;
    try {
        const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,  // ✅ Fix: Ensure token is included
            },
            body: JSON.stringify({ items }),
        });

        if (!response.ok) {
            throw new Error("Network response was not ok.");
        }

        const session = await response.json();
        window.location.href = session.url; // Redirect to Stripe Checkout
    } catch (error) {
        console.error("Checkout failed", error);
        alert("Something went wrong. Please try again.");
    }
}


  
// export function initializeCheckoutButton() {
//     const checkoutButton = document.getElementById("complete-order-button");
    
//     if (checkoutButton) {
//       checkoutButton.addEventListener("click", handleCompleteOrderButtonClick);
//     } else {
//       console.error("Checkout button not found");
//     }
//   }

//   export function toggleCompleteOrderButton(isRequired) {
//     let completeOrderButton = document.getElementById("complete-order-button");
//     if (!completeOrderButton) {
//       completeOrderButton = createCompleteOrderButton();
//     }
//     completeOrderButton.style.display = isRequired ? "block" : "none";
//   }
  
//   export function createCompleteOrderButton() {
//     const btn = document.createElement("button");
//     btn.id = "complete-order-button";
//     btn.textContent = "Complete Order";
//     btn.addEventListener("click", handleCompleteOrderButtonClick);
  
//     const displayCompleteOrderButton =
//       document.getElementById("section-complete");
//     if (displayCompleteOrderButton) {
//       displayCompleteOrderButton.appendChild(btn);
//     } else {
//       console.error("section-complete element is not available on this page.");
//     }
//     return btn;
//   }
  
//   export function handleCompleteOrderButtonClick() {
//     if (orderArray.length > 0) {
//       handleCheckout(orderArray).catch((error) =>
//         console.error("Checkout failed", error)
//       );
//     } else {
//       alert("Please add items to your order before proceeding to payment.");
//     }
//   }