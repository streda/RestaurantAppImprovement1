document.addEventListener('DOMContentLoaded', function() {
    const profileContainer = document.getElementById('profile-container');
    const userIsLoggedIn = localStorage.getItem('token'); // token presence means logged in

    if (userIsLoggedIn) {
        // User is logged in, show profile button and dropdown with only Logout
        profileContainer.innerHTML = `
            <li class="dropdown">
                <button class="navbar-link button" id="profile-btn">Profile</button>
                <div class="dropdown-content" id="dropdown">
                    <a href="#" onclick="logout()">Logout</a>
                </div>
            </li>
        `;

        const profileBtn = document.getElementById('profile-btn');
        const dropdown = document.getElementById('dropdown');
        const dropdownContainer = profileBtn.parentElement; // The <li> element

        // Show dropdown when clicking the Profile button
        profileBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent click from closing it immediately
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        // Show dropdown when hovering over Profile
        dropdownContainer.addEventListener('mouseenter', function() {
            dropdown.style.display = 'block';
        });

        // Hide dropdown when the cursor leaves both the profile and the dropdown
        dropdownContainer.addEventListener('mouseleave', function() {
            dropdown.style.display = 'none';
        });

        // Hide dropdown when clicking outside of it
        document.addEventListener('click', function(event) {
            if (!dropdownContainer.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    } else {
        // User is not logged in, determine if login or sign-up page is displayed
        const currentPage = window.location.pathname;

        if (currentPage.endsWith('login.html')) {
            profileContainer.innerHTML = '<li><a href="/signUp.html" class="navbar-links">Sign Up</a></li>';
        } else if (currentPage.endsWith('signUp.html')) {
            profileContainer.innerHTML = `<li><a href="/login.html" class="navbar-links">Login</a></li>`;
        } else {
            profileContainer.innerHTML = `<li><a href="/login.html" class="navbar-links">Login</a></li>`;
        }
    }
});

window.logout = function() {
    localStorage.removeItem('token');
    location.reload(); // Reload to update UI
};
