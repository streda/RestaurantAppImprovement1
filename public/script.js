document.addEventListener('DOMContentLoaded', function() {
    const profileContainer = document.getElementById('profile-container');
    const userIsLoggedIn = localStorage.getItem('token'); // Assume token presence means logged in

    if (userIsLoggedIn) {
        // User is logged in, show profile button and dropdown
        profileContainer.innerHTML = `
            <li><button class="navbar-link button" onclick="toggleDropdown()">Profile</button>
            <div class="dropdown-content" id="dropdown">
                <a href="#">Cart</a>
                <a href="#" onclick="logout()">Logout</a>
            </div></li>
        `;
    } else {
        // User is not logged in, show login button
        profileContainer.innerHTML = '<li><a href="/login.html" class="navbar-links">Login</a></li>';
    }
});

function toggleDropdown() {
    const dropdown = document.getElementById('dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function logout() {
    localStorage.removeItem('token');
    location.reload(); // Reload to update UI
}
