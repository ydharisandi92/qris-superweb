(function () {
    const loggedInUser = sessionStorage.getItem("loggedInUser");
    
    // Jika belum login, lempar ke login.html
    if (!loggedInUser) {
        window.location.href = "login.html";
    }
})();

// Didaftarkan secara global ke window agar bisa dipanggil dari HTML manapun
window.logoutUser = function () {
    sessionStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
};