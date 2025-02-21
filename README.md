# 🍽️ Restaurant Ordering App

A **full-stack** restaurant ordering system that allows users to browse menus, add items to their cart, and complete checkout seamlessly. The app includes **real-time order tracking** and a **scalable backend** for managing restaurant operations.

## 🚀 Features

- 📋 **Menu Browsing** - View categories and available food items.
- 🛒 **Cart Management** - Add/remove items before checkout.
- ✅ **Order Processing** - Place orders and receive real-time updates.
- 🔐 **Authentication** - Secure login/signup using JWT authentication.
- 📡 **Real-Time Order Tracking** - Uses **WebSockets** for live order status updates.
- 🛠️ **Admin Dashboard** - Manage orders, menu items, and customers.
- ☁️ **Cloud Deployment** - Hosted on **Render** for easy access.

---

## 🏗️ **Tech Stack**
| **Technology** | **Usage** |
|--------------|----------------|
| **React.js** | Frontend UI |
| **Node.js & Express.js** | Backend API |
| **MongoDB** | Database (Mongoose ODM) |
| **Socket.io** | Real-time order updates |
| **Tailwind CSS** | UI Styling |
| **JWT & bcrypt.js** | Authentication & Security |
| **Render** | Deployment |

---

## 💻 **Getting Started**
### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/streda/RestaurantAppImprovement1.git
cd restaurant-app
```


### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Set Up Environmental Variables
Create your own .env file specified as in the example below

```MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
```

### 4️⃣ Start the Backend Server

```bash
npm run server
```

### 5️⃣ Start the Frontend
```bash
cd client
npm start
```