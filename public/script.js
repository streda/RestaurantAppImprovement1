document.addEventListener('DOMContentLoaded', function() {
    const profileContainer = document.getElementById('profile-container');
    const userIsLoggedIn = localStorage.getItem('token'); 

    if (userIsLoggedIn) {
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
        const dropdownContainer = profileBtn.parentElement; 

        profileBtn.addEventListener('click', function(event) {
            event.stopPropagation(); 
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        dropdownContainer.addEventListener('mouseenter', function() {
            dropdown.style.display = 'block';
        });

        dropdownContainer.addEventListener('mouseleave', function() {
            dropdown.style.display = 'none';
        });

        document.addEventListener('click', function(event) {
            if (!dropdownContainer.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    } else {
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
    location.reload(); 
};
