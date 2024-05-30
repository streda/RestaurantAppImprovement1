// services/orderService.js
import MenuItem from '../models/menuItemModel.js';


/* 
    Server-Side calculateTotalPrice: 
    On the server side, I need to fetch the latest prices from the database to ensure accuracy, especially if prices might change or if I need to validate the existence of the items in the database. This justifies having an asynchronous function that interacts with the database.
*/
export async function calculateTotalPrice(items) {
    let total = 0;
    for (let item of items) {
        const menuItem = await MenuItem.findById(item.menuItem);
        if (!menuItem) {
            throw new Error('Item not found');
        }
        total += menuItem.price * item.quantity;
    }
    return total;
}

// Other order-related services can be added here
