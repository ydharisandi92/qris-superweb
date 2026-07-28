(function () {
    const loggedInUser = sessionStorage.getItem("loggedInUser");
    
    // Jika tidak ada data login, paksa ke halaman login
    if (!loggedInUser) {
        window.location.href = "login.html";
    }
})();

// Fungsi Logout Global
function logoutUser() {
    sessionStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
}