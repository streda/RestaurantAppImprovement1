import { orderArray } from "./index.js"; // Ensure this is imported properly

export async function handleCheckout(orderArray) {
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
        const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
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

export function initializeCheckoutButton() {
    const checkoutButton = document.getElementById("complete-order-button");

    if (checkoutButton) {
        checkoutButton.addEventListener("click", handleCompleteOrderButtonClick);
    } else {
        console.error("Checkout button not found");
    }
}

export function toggleCompleteOrderButton(isRequired) {
  let completeOrderButton = document.getElementById("complete-order-button");

  if (!completeOrderButton) {
    completeOrderButton = document.createElement("button");
    completeOrderButton.id = "complete-order-button";
    completeOrderButton.textContent = "Complete Order";
    completeOrderButton.classList.add("complete-order-btn");
    completeOrderButton.disabled = !isRequired;
    completeOrderButton.addEventListener("click", handleCompleteOrderButtonClick);

    // Attach inside the #section-summary div
    const orderSummaryContainer = document.getElementById("section-summary");
    if (orderSummaryContainer) {
      orderSummaryContainer.appendChild(completeOrderButton);
    }
  }

  completeOrderButton.style.display = isRequired ? "block" : "none";
}
export function createCompleteOrderButton() {
    const btn = document.createElement("button");
    btn.id = "complete-order-button";
    btn.textContent = "Complete Order";
    btn.classList.add("complete-order-btn");
    btn.disabled = true; // Initially disabled

    btn.addEventListener("click", handleCompleteOrderButtonClick);

    const orderSummaryContainer = document.getElementById("section-summary"); // Fix: Append inside #section-summary
    if (orderSummaryContainer) {
        orderSummaryContainer.appendChild(btn);
    } else {
        console.error("#section-summary is MISSING in the DOM!");
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

// import { getOrderArray } from "./index.js"; 

// export async function handleCheckout() {
//     const token = localStorage.getItem("token");

//     if (!token) {
//         console.error("No auth token found, cannot proceed to checkout");
//         alert("You must be logged in to complete your order.");
//         return;
//     }

//     const items = getOrderArray().map(({ menuItem, quantity }) => ({
//         id: menuItem._id,
//         name: menuItem.name,
//         price: menuItem.price,
//         quantity: quantity,
//     }));

//     const API_BASE_URL = window.location.origin;
//     try {
//         const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Authorization": `Bearer ${token}`,
//             },
//             body: JSON.stringify({ items }),
//         });

//         if (!response.ok) {
//             throw new Error("Network response was not ok.");
//         }

//         const session = await response.json();
//         window.location.href = session.url; // Redirect to Stripe Checkout
//     } catch (error) {
//         console.error("Checkout failed", error);
//         alert("Something went wrong. Please try again.");
//     }
// }

// export function initializeCheckoutButton() {
//     const checkoutButton = document.getElementById("complete-order-button");

//     if (checkoutButton) {
//         checkoutButton.addEventListener("click", handleCompleteOrderButtonClick);
//     } else {
//         console.error("Checkout button not found");
//     }
// }

// export function toggleCompleteOrderButton(isRequired) {
//     let completeOrderButton = document.getElementById("complete-order-button");

//     if (!completeOrderButton) {
//         completeOrderButton = document.createElement("button");
//         completeOrderButton.id = "complete-order-button";
//         completeOrderButton.textContent = "Complete Order";
//         completeOrderButton.classList.add("complete-order-btn");
//         completeOrderButton.disabled = !isRequired;
//         completeOrderButton.addEventListener("click", handleCompleteOrderButtonClick);

//         // Attach inside the #section-summary div
//         const orderSummaryContainer = document.getElementById("section-summary");
//         if (orderSummaryContainer) {
//             orderSummaryContainer.appendChild(completeOrderButton);
//         }
//     }

//     completeOrderButton.style.display = isRequired ? "block" : "none";
// }

// export function createCompleteOrderButton() {
//     const btn = document.createElement("button");
//     btn.id = "complete-order-button";
//     btn.textContent = "Complete Order";
//     btn.classList.add("complete-order-btn");
//     btn.disabled = true; // Initially disabled

//     btn.addEventListener("click", handleCompleteOrderButtonClick);

//     const orderSummaryContainer = document.getElementById("section-summary"); 
//     if (orderSummaryContainer) {
//         orderSummaryContainer.appendChild(btn);
//     } else {
//         console.error("#section-summary is MISSING in the DOM!");
//     }
//     return btn;
// }

// export function handleCompleteOrderButtonClick() {
//     if (getOrderArray().length > 0) {
//         handleCheckout().catch((error) =>
//             console.error("Checkout failed", error)
//         );
//     } else {
//         alert("Please add items to your order before proceeding to payment.");
//     }
// }