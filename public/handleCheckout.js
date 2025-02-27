// export default async function handleCheckout(orderArray) {
//   const items = orderArray.map(({menuItem, quantity})=> ({
//     id: menuItem._id,
//     name: menuItem.name,
//     price: menuItem.price,
//     quantity: quantity,
//   }));

//   const response = await fetch('http://localhost:3000/create-checkout-session', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json',
//   },
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
