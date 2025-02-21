document.addEventListener('DOMContentLoaded', function() {
    const profileContainer = document.getElementById('profile-container');
    const userIsLoggedIn = localStorage.getItem('token'); // Assume token presence means logged in

    if (userIsLoggedIn) {
        // User is logged in, show profile button and dropdown with only Logout
        profileContainer.innerHTML = `
            <li>
                <button class="navbar-link button" onclick="toggleDropdown()">Profile</button>
                <div class="dropdown-content" id="dropdown">
                    <a href="#" onclick="logout()">Logout</a>
                </div>
            </li>
        `;
    } else {
        // User is not logged in, determine if login or sign-up page is displayed
        const currentPage = window.location.pathname;

        if(currentPage.endsWith('login.html')){
            profileContainer.innerHTML = '<li><a href="/signUp.html" class="navbar-links">Sign Up</a></li>';
        } else if (currentPage.endsWith('signUp.html')){
            profileContainer.innerHTML = `<li><a href="/login.html" class="navbar-links">Login</a></li>`
        } else{
            profileContainer.innerHTML = `<li><a href="/login.html" class="navbar-links">Login</a></li>`
        }
    }
});

window.toggleDropdown = function() {
    const dropdown = document.getElementById('dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
};

window.logout = function() {
    localStorage.removeItem('token');
    location.reload(); // Reload to update UI
};


// document.addEventListener('DOMContentLoaded', function() {
//     const profileContainer = document.getElementById('profile-container');
//     const userIsLoggedIn = localStorage.getItem('token'); // Assume token presence means logged in

//     if (userIsLoggedIn) {
//         // User is logged in, show profile button and dropdown
//         profileContainer.innerHTML = `
//             <li><button class="navbar-link button" onclick="toggleDropdown()">Profile</button>
//             <div class="dropdown-content" id="dropdown">
//                 // <a href="#">Cart</a>
//                 <a href="#" onclick="logout()">Logout</a>
//             </div></li>
//         `;
//     } else {
//         // User is not logged in, determine if login or sign-up page is displayed

//         const currentPage = window.location.pathname;

//         if(currentPage.endsWith('login.html')){
//             profileContainer.innerHTML = '<li><a href="/signUp.html" class="navbar-links">Sign Up</a></li>';
//         } else if (currentPage.endsWith('signUp.html')){
//             profileContainer.innerHTML = `<li><a href="/login.html" class="navbar-links">Login</a></li>`
//         } else{
//             profileContainer.innerHTML = `<li><a href="/login.html" class="navbar-links">Login</a></li>`
//         }
//     }
// });


// window.toggleDropdown = function() {
//     const dropdown = document.getElementById('dropdown');
//     dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
// };

// window.logout = function() {
//     localStorage.removeItem('token');
//     location.reload(); // Reload to update UI
// };

// function toggleDropdown() {
//     const dropdown = document.getElementById('dropdown');
//     dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
// }

// function logout() {
//     localStorage.removeItem('token');
//     location.reload(); // Reload to update UI
// }
