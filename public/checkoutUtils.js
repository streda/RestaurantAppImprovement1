import { orderArray } from "./index.js"; 

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


export async function handleCompleteOrderButtonClick() {
    if (orderArray.length > 0) {
        try {
            await handleCheckout(orderArray); // Wait for the promise to resolve or reject
            console.log("Checkout successful!");
        } catch (error) {
            console.error("Checkout failed", error);
        }
    } else {
        alert("Please add items to your order before proceeding to payment.");
    }
}
