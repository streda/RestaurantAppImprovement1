import { renderMenu, fetchMenuItems } from './index.js';

document.getElementById('login-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  console.log("Sending credentials:", { username, password });
  console.log('Current token:', localStorage.getItem('token'));

  fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    // console.log(response.json())
    return response.json();
  })
  .then(data => {
    if (data.success) {
      localStorage.setItem('token', data.token);
      console.log('Logged in successfully, token:', data.token);
      fetchMenuItems(true); 
    } else {
      throw new Error(data.message || 'Login failed');
    }
  })
  .catch(error => {
    console.error('Login error:', error);
    alert('Login failed: ' + error.message);
  });
});








// function fetchMenuItems() {
//   const token = localStorage.getItem('token');
//   if (!token) {
//     console.error('No token found in localStorage');
//     return;
//   }

//   fetch('http://localhost:3000/menu-items', {
//     headers: {
//       'Authorization': `Bearer ${token}`
//     }
//   })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error(`Failed to load menu items: ${response.statusText}`);
//     }
//     return response.json();
//   })
//   .then(data => {
//     renderMenu(data);
//     window.location.href = '/';
//   })
//   .catch(error => console.error('Failed to load menu items:', error));
// }



// import {renderMenu} from './index.js'
// import { menuArray } from './data.js';
// document.getElementById('login-form').addEventListener('submit', function(event) {
//   event.preventDefault();
//   const username = document.getElementById('username').value;
//   const password = document.getElementById('password').value;

//   console.log("Sending credentials:", { username, password });

//   console.log('Current token:', localStorage.getItem('token'));

//   fetch('http://localhost:3000/api/login', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ username, password })
//   })
//   .then(response => {
//       if (!response.ok) {
//           throw new Error(`Login failed: ${response.statusText}`);
//       }
//       return response.json();
//   })
//   .then(data => {
//       if (data.success) {
//           localStorage.setItem('token', data.token);
//           console.log('Logged in successfully, token:', data.token);
//           // window.location.href = '/'; // Redirect to home page or dashboard
//           // Fetch menu items right after logging in

//           let menuItemsArray = [];

//           fetch('http://localhost:3000/menu-items', {
//             headers: {
//                 'Authorization': `Bearer ${localStorage.getItem('token')}`
//             }
//         })
//         .then(response => response.json())
//         .then(data => {
//             menuItemsArray = data;
//             renderMenu(menuItemsArray);
//             window.location.href = '/'; // Redirect to home page or dashboard
//         })
//         .catch(error => console.error('Failed to load menu items:', error));

//       } else {
//           throw new Error(data.message || 'Login failed');
//       }
//   })
//   // .catch(error => {
//   //     console.error('Login error:', error);
//   //     alert('Login failed: ' + error.message);
//   // });
// });




// function fetchWithAuth(url, options = {}) {
//   const token = localStorage.getItem('token');
//   console.log('Sending request with token:', token); // Ensure token is logged
//   return fetch(url, {
//       ...options,
//       headers: {
//           ...options.headers,
//           Authorization: `Bearer ${token}`,
//       },
//   });
// }



// document.getElementById('login-form').addEventListener('submit', function(event) {
//   event.preventDefault();
//   const username = document.getElementById('username').value;
//   const password = document.getElementById('password').value;

//   fetch('/api/login', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ username, password })
//   })
//   .then(response => {
//       if (!response.ok) {
//           throw new Error('Login failed');
//       }
//       return response.json();
//   })
//   .then(data => {
//       if (data.success) {
//           localStorage.setItem('token', data.token);
//           console.log('Logged in successfully');
//           // Redirect or update UI
//       } else {
//           console.error('Login failed:', data.message);
//       }
//   })
//   .catch(error => {
//       console.error('Login error:', error);
//   });
// });



  // Example POST request to a login API endpoint
  // fetch('http://localhost:3000/api/login', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({ username, password })
  // })
  // .then(response  => {
  //     if(!response.ok){
  //         throw new Error("Network response was not ok ");
  //     }
  //     return response.json();
  // })
  // .then(data => {
  //   if (data.success) {
  //     // Redirect or save the session token
  //     localStorage.setItem('token', data.token); // Save token to localStorage
  //     window.location.href = 'http://localhost:3000/index.html'; // Redirect to login page
  //     // window.location.href = 'http://127.0.0.1:5500/backend/public/index.html'; // The correct frontend development server (live-reload server) URL

  //   } else {
  //     alert('Login failed: ' + data.message);
  //   }
  // })
  // .catch(error => {
  //     console.error('Error logging in:', error);
  //     alert("Login Failed: " + error.message)
  // });