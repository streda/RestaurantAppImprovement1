document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logout-button');

    if(logoutButton){
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('token');
            window.location.href = './index.html';
        });
    }
});
