document.addEventListener("DOMContentLoaded", async function () {
    const currentUser = sessionStorage.getItem("loggedInUser") || "GUEST";
    
    // URL GOOGLE APPS SCRIPT & DYNAMIC SERVER URL
    const CASE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0Kd5FEaK0lFx1A5TdNfyCqtYH_GZgeKbGy9vuNi2S-WouNgDmWF7kFDmX06y3IwW_Sw/exec";
    let SERVER_URL = "http://localhost:5000"; // Fallback default

    // FUNGSI MENGAMBIL DYNAMIC SERVER URL DARI GSHEET
    async function initServerUrl() {
        try {
            const res = await fetch(`${CASE_SCRIPT_URL}?action=get_server_url`);
            const data = await res.json();
            if (data.status === "success" && data.server_url) {
                SERVER_URL = data.server_url;
                console.log("🌐 Sidebar Dynamic SERVER_URL Terhubung:", SERVER_URL);
            }
        } catch (err) {
            console.warn("⚠️ Sidebar gagal mengambil Dynamic SERVER_URL, memakai fallback.");
        }
    }

    // 1. OTOMATIS SUNTIKKAN CSS KE DALAM HALAMAN
    const styleID = "dynamic-sidebar-style";
    if (!document.getElementById(styleID)) {
        const styleElement = document.createElement("style");
        styleElement.id = styleID;
        styleElement.innerHTML = `
      .sidebar-brand {
          font-size: 14px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
          letter-spacing: 0.5px;
          padding: 0 12px 16px 12px;
          margin-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          white-space: nowrap;
      }
      .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
      }
      .nav-item {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          color: #94a3b8;
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.2s ease-in-out;
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
      }
      .nav-item:hover {
          background: rgba(30, 41, 59, 0.5);
          color: #f8fafc;
          border-color: rgba(71, 85, 105, 0.4);
      }
      .nav-item.active {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
          border-color: rgba(71, 85, 105, 0.6) !important;
          font-weight: 700;
      }
      .sidebar-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 10px;
          color: #64748b;
          text-align: center;
          line-height: 1.4;
          font-weight: 500;
          position: relative;
          z-index: 999;
          margin-bottom: 60px;
      }

      .user-box {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          position: relative;
          z-index: 1000;
      }
      .user-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
      }
      .btn-action {
          width: 100%;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
      }
      .btn-chpass {
          background: #334155;
          color: #f8fafc;
          border: 1px solid #475569;
      }
      .btn-chpass:hover { background: #475569; }
      .btn-logout { background: #ef4444; color: #ffffff; }
      .btn-logout:hover { background: #dc2626; }

      /* MODAL GANTI PASSWORD */
      .modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.7);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 9999;
      }
      .modal-box {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 24px;
          width: 320px;
          color: #fff;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      }
      .modal-box h3 { margin: 0 0 16px 0; font-size: 15px; color: #fbbf24; }
      .modal-box label { display: block; font-size: 11px; margin-bottom: 4px; color: #94a3b8; text-align: left; }
      .modal-box input { width: 100%; padding: 8px; margin-bottom: 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 12px; box-sizing: border-box; }
      .modal-btns { display: flex; gap: 8px; margin-top: 8px; }
      .modal-btn { flex: 1; padding: 8px; border-radius: 6px; font-weight: 700; border: none; cursor: pointer; font-size: 12px; }
    `;
        document.head.appendChild(styleElement);
    }

    // 2. STRUKTUR SIDEBAR
    const sidebarHTML = `
    <div class="sidebar-brand">SECRET WARS</div>
    <div class="nav-menu">
      <a href="index.html" class="nav-item" data-page="index.html">🏠 MAIN MENU</a>
      <a href="qrisperiodik.html" class="nav-item" data-page="qrisperiodik.html">QRIS PERIODIK</a>
      <a href="qriscb.html" class="nav-item" data-page="qriscb.html">QRIS CROSSBORDER H+1</a>
      <a href="qrisdomestik.html" class="nav-item" data-page="qrisdomestik.html">QRIS DOMESTIK H+1</a>
      <a href="qrismalam.html" class="nav-item" data-page="qrismalam.html">QRIS MALAM</a>
      <a href="casetransaksi.html" class="nav-item" data-page="casetransaksi.html">🔍 CASE TRANSAKSI</a>
      <a href="validasipulsa.html" class="nav-item" data-page="validasipulsa.html">📱 VALIDASI PULSA</a>
    </div>

    <div class="sidebar-footer">
        <div id="realtime-date">-</div>
        <div id="realtime-clock" style="font-weight: bold; margin-top: 4px;">-</div>

        <div class="user-box">
            <div class="user-actions">
                <button onclick="openChangePassModal()" class="btn-action btn-chpass">🔑 Ganti Pass</button>
                <button onclick="logoutUser()" class="btn-action btn-logout">🚪 Logout</button>
            </div>
        </div>
    </div>

    <div id="modalChPass" class="modal-overlay">
        <div class="modal-box">
            <h3>🔑 Ganti Password (${currentUser})</h3>
            <form onsubmit="handlePassChange(event)">
                <label>Password Lama</label>
                <input type="password" id="oldPass" required placeholder="Masukkan pass lama...">
                <label>Password Baru</label>
                <input type="password" id="newPass" required placeholder="Masukkan pass baru...">
                <div id="passMsg" style="font-size: 11px; margin-bottom: 10px; display: none;"></div>
                <div class="modal-btns">
                    <button type="button" onclick="closeChangePassModal()" class="modal-btn" style="background:#475569; color:#fff;">Batal</button>
                    <button type="submit" class="modal-btn" style="background:#1565c0; color:#fff;">Simpan</button>
                </div>
            </form>
        </div>
    </div>
  `;

    // 3. RENDER SIDEBAR & BOTTOM BAR
    const sidebarElement = document.querySelector(".sidebar");
    if (sidebarElement) {
        sidebarElement.innerHTML = sidebarHTML;

        let currentPath = window.location.pathname.split("/").pop();
        if (!currentPath || currentPath === "" || currentPath.indexOf(".") === -1) {
            currentPath = "index.html";
        }

        const activeItem = sidebarElement.querySelector(`[data-page="${currentPath}"]`);
        if (activeItem) {
            activeItem.classList.add("active");
        }
    }

    if (!document.getElementById("bottom-l-bar")) {
        const bottomBarHTML = `
            <div id="bottom-l-bar" class="bottom-l-bar">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div id="server-status-container">
                        <span id="server-status-badge" class="server-status-badge online">SERVER: ONLINE 🟢</span>
                    </div>
                    <div class="bottom-l-user">
                        <span>ACTIVE USERS:</span>
                        <div id="active-user-badges" class="user-badge-container">
                            <div class="user-badge me">
                                <span class="user-name-box">${currentUser}</span>
                                <span class="user-role-text">ADMIN</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="font-size: 10px; color: #64748b; font-weight: 600;">System Active</div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", bottomBarHTML);
    }

    // 4. AUTO INJEK NAMA PIC
    const picElement = document.getElementById("pic");
    if (picElement && currentUser !== "GUEST") {
        picElement.value = currentUser;
        if (typeof updateReportHeader === "function") {
            updateReportHeader();
        }
    }

    // 5. HEARTBEAT & SYNC USERS (WITH AUTO-RECONNECT)
    async function syncActiveUsers() {
        const serverBadge = document.getElementById("server-status-badge");

        try {
            const hbRes = await fetch(`${SERVER_URL}/api/heartbeat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: currentUser })
            });

            if (!hbRes.ok) throw new Error("Server Error");

            if (serverBadge) {
                serverBadge.className = "server-status-badge online";
                serverBadge.innerText = "SERVER: ONLINE 🟢";
            }

            if (currentUser !== "GUEST") {
                const res = await fetch(`${SERVER_URL}/api/active-users`);
                const data = await res.json();

                if (data.active_users && Array.isArray(data.active_users)) {
                    const container = document.getElementById("active-user-badges");
                    if (container) {
                        container.innerHTML = data.active_users.map(uObj => {
                            const uName = typeof uObj === 'object' ? uObj.username : uObj;
                            const uRole = (typeof uObj === 'object' ? uObj.role : "OPERATOR") || "OPERATOR";
                            const isMe = uName === currentUser;

                            return `
                                <div class="user-badge ${isMe ? 'me' : ''}">
                                    <span class="user-name-box">${uName}</span>
                                    <span class="user-role-text">${uRole}</span>
                                </div>
                            `;
                        }).join("");
                    }
                }
            }
        } catch (e) {
            if (serverBadge) {
                serverBadge.className = "server-status-badge offline";
                serverBadge.innerText = "CONNECTING... 🟡";
            }
            // AUTO-RECONNECT: Mencoba mengambil URL tunnel terbaru dari GSheet secara otomatis jika koneksi terputus
            console.warn("⚠️ Koneksi terputus. Mengambil URL tunnel terbaru dari GSheet...");
            await initServerUrl();
        }
    }

    // INITIALIZATION DYNAMIC URL & HEARTBEAT LOOP
    await initServerUrl(); 
    syncActiveUsers();     
    setInterval(syncActiveUsers, 5000); 

    window.logoutUser = async function () {
        try {
            await fetch(`${SERVER_URL}/api/logout-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: currentUser })
            });
        } catch (e) {}

        sessionStorage.removeItem("loggedInUser");
        window.location.href = "login.html";
    };

    // 6. GANTI PASSWORD MODAL
    window.openChangePassModal = function () {
        document.getElementById("modalChPass").style.display = "flex";
    };

    window.closeChangePassModal = function () {
        document.getElementById("modalChPass").style.display = "none";
        document.getElementById("oldPass").value = "";
        document.getElementById("newPass").value = "";
        document.getElementById("passMsg").style.display = "none";
    };

    window.handlePassChange = async function (e) {
        e.preventDefault();
        const oldPass = document.getElementById("oldPass").value;
        const newPass = document.getElementById("newPass").value;
        const msgEl = document.getElementById("passMsg");

        msgEl.innerText = "Memproses...";
        msgEl.style.color = "#fbbf24";
        msgEl.style.display = "block";

        try {
            const res = await fetch(`${SERVER_URL}/api/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: currentUser,
                    old_password: oldPass,
                    new_password: newPass
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                msgEl.innerText = "✅ " + data.message;
                msgEl.style.color = "#22c55e";
                setTimeout(() => closeChangePassModal(), 1500);
            } else {
                msgEl.innerText = "❌ " + (data.message || "Gagal mengubah password");
                msgEl.style.color = "#ef4444";
            }
        } catch (err) {
            msgEl.innerText = "❌ Server Offline / Gagal Terhubung";
            msgEl.style.color = "#ef4444";
        }
    };

    // 7. JAM REALTIME
    function updateFooterClock() {
        const now = new Date();
        const optionsDate = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const dateString = now.toLocaleDateString('id-ID', optionsDate);

        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const dateElement = document.getElementById('realtime-date');
        const clockElement = document.getElementById('realtime-clock');

        if (dateElement) dateElement.textContent = dateString;
        if (clockElement) clockElement.textContent = `${hours} : ${minutes} : ${seconds}`;
    }

    updateFooterClock();
    setInterval(updateFooterClock, 1000);
});