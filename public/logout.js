// document.getElementById('logout-button').addEventListener('click', function() {
//     localStorage.removeItem('token');  // Remove the stored token
//     window.location.href = '/login.html';  // Redirect to the login page
// });

document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logout-button');

    if(logoutButton){
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('token');
            window.location.href = './index.html';
        });
    }
});


//http://127.0.0.1:5500/backend/public/index.html