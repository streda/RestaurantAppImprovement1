// services/orderService.js
import MenuItem from '../models/menuItemModel.js';

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
