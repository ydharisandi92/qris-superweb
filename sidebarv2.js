document.addEventListener("DOMContentLoaded", async function () {
    const currentUser = sessionStorage.getItem("loggedInUser") || "GUEST";
    
    // URL GOOGLE APPS SCRIPT
    const CASE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0Kd5FEaK0lFx1A5TdNfyCqtYH_GZgeKbGy9vuNi2S-WouNgDmWF7kFDmX06y3IwW_Sw/exec";
    const SCHEDULE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8izv-omq1Nn5oP1zzXLXqvfJ2sYlNN5of7TzPAJoJew9kmVpmqOESsdjlHjfaNGM_/exec";
    
    let SERVER_URL = "http://localhost:5000"; // Fallback default

    let rawSchedules = [];
    let directPicString = "";
    let lastFetchedDate = null;

    const SHIFT_HOURS = {
        'CSHP':  { start: '06:00', end: '14:00' },
        'CSHS':  { start: '14:00', end: '22:00' },
        'CSHM':  { start: '22:00', end: '06:00' },
        'CSHLP': { start: '06:00', end: '18:00' },
        'CSHLM': { start: '18:00', end: '06:00' },
        'CSP':   { start: '08:00', end: '14:30' },
        'CSS':   { start: '14:30', end: '21:00' },
        'CSF':   { start: '08:00', end: '21:00' }
    };

    async function initServerUrl() {
        try {
            const res = await fetch(`${CASE_SCRIPT_URL}?action=get_server_url`);
            const data = await res.json();
            if (data.status === "success" && data.server_url) {
                SERVER_URL = data.server_url;
                window.SERVER_URL = data.server_url;
                console.log("🌐 Sidebar Dynamic SERVER_URL Terhubung:", SERVER_URL);
            }
        } catch (err) {
            console.warn("⚠️ Sidebar gagal mengambil Dynamic SERVER_URL, memakai fallback.");
        }
    }

    // 1. INJEKSI CSS STYLING SIDEBAR
    const styleID = "dynamic-sidebar-style";
    if (!document.getElementById(styleID)) {
        const styleElement = document.createElement("style");
        styleElement.id = styleID;
        styleElement.innerHTML = `
      .sidebar {
          display: flex !important;
          flex-direction: column !important;
          height: 100vh !important;
          box-sizing: border-box !important;
          padding-bottom: 50px !important;
      }
      .sidebar-brand {
          font-size: 14px !important;
          font-weight: 700 !important;
          color: #ffffff !important;
          letter-spacing: 0.5px;
          padding: 0 12px 14px 12px;
          margin-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          white-space: nowrap;
      }
      .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
      }
      .nav-item {
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 11.5px;
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

      /* DROPDOWN MENU STYLING */
      .dropdown-btn {
          width: 100%;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 700;
          color: #cbd5e1;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s ease-in-out;
          text-transform: uppercase;
      }
      .dropdown-btn:hover {
          background: rgba(30, 41, 59, 0.5);
          color: #f8fafc;
          border-color: rgba(71, 85, 105, 0.4);
      }
      .dropdown-btn.active { color: #fbbf24; }
      .dropdown-container {
          display: none; flex-direction: column; gap: 3px;
          padding-left: 10px; margin-top: 2px; margin-bottom: 4px;
          border-left: 2px solid rgba(255, 255, 255, 0.1); margin-left: 10px;
      }
      .dropdown-container.show { display: flex; }
      .dropdown-arrow { font-size: 9px; transition: transform 0.2s ease; }
      .dropdown-btn.active .dropdown-arrow { transform: rotate(180deg); }

      /* WIDGET PIC ON DUTY BAWAH */
      .sidebar-pic-box {
          margin-top: auto !important;
          margin-bottom: 8px;
          padding: 8px 10px;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      .sidebar-pic-title {
          font-size: 9.5px;
          font-weight: 800;
          color: #fbbf24;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 3px;
      }
      .sidebar-pic-value {
          font-size: 10.5px;
          font-weight: 600;
          color: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 3px;
      }

      .sidebar-footer {
          padding-top: 4px;
          font-size: 10px;
          color: #64748b;
          text-align: center;
          position: relative;
          z-index: 999;
          margin-bottom: 0;
      }
      .user-box { text-align: center; position: relative; z-index: 1000; }
      
      .user-actions { 
          display: flex; 
          flex-direction: row !important;
          gap: 6px; 
          width: 100%; 
      }
      .btn-action {
          flex: 1;
          padding: 7px 4px; 
          border-radius: 6px;
          font-size: 10px; 
          font-weight: 700; 
          border: none; 
          cursor: pointer;
          white-space: nowrap; 
          transition: background 0.2s ease;
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 4px;
      }
      .btn-chpass { background: #334155; color: #f8fafc; border: 1px solid #475569; }
      .btn-chpass:hover { background: #475569; }
      .btn-logout { background: #ef4444; color: #ffffff; }
      .btn-logout:hover { background: #dc2626; }

      .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.7); display: none;
          align-items: center; justify-content: center; z-index: 9999;
      }
      .modal-box {
          background: #1e293b; border: 1px solid #334155; border-radius: 12px;
          padding: 24px; width: 320px; color: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
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
    <div class="sidebar-brand">DOOMSDAY</div>
    <div class="nav-menu">
      <a href="index.html" class="nav-item" data-page="index.html">🏠 MAIN MENU</a>

      <!-- DROPLIST 1: REPORT QRIS -->
      <div class="nav-dropdown">
        <button type="button" class="dropdown-btn" onclick="toggleDropdown('qrisDropdown')">
          <span>📊 REPORT QRIS</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div id="qrisDropdown" class="dropdown-container">
          <a href="qrisperiodik.html" class="nav-item" data-page="qrisperiodik.html">QRIS PERIODIK</a>
          <a href="qriscb.html" class="nav-item" data-page="qriscb.html">QRIS CROSSBORDER H+1</a>
          <a href="qrisdomestik.html" class="nav-item" data-page="qrisdomestik.html">QRIS DOMESTIK H+1</a>
          <a href="qrismalam.html" class="nav-item" data-page="qrismalam.html">QRIS MALAM</a>
        </div>
      </div>

      <!-- DROPLIST 2: TOOLS CS H2H -->
      <div class="nav-dropdown">
        <button type="button" class="dropdown-btn" onclick="toggleDropdown('toolsDropdown')">
          <span>🛠️ TOOLS CS H2H</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div id="toolsDropdown" class="dropdown-container">
          <a href="casetransaksi.html" class="nav-item" data-page="casetransaksi.html">🔍 CASE TRANSAKSI</a>
          <a href="validasipulsa.html" class="nav-item" data-page="validasipulsa.html">📱 VALIDASI PULSA</a>
        </div>
      </div>
    </div>

    <!-- WIDGET PIC ON DUTY BAWAH -->
    <div class="sidebar-pic-box">
        <div class="sidebar-pic-title">
            <span style="height:6px; width:6px; background:#10b981; border-radius:50%; display:inline-block;"></span>
            <span>PIC ON DUTY</span>
        </div>
        <div id="sidebarPicDutyText" class="sidebar-pic-value">
            <span style="color:#94a3b8; font-size:10px;">Memuat...</span>
        </div>
    </div>

    <div class="sidebar-footer">
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

    // 3. RENDER SIDEBAR & AUTO OPEN DROPDOWN
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
            const parentContainer = activeItem.closest(".dropdown-container");
            if (parentContainer) {
                parentContainer.classList.add("show");
                const btn = parentContainer.previousElementSibling;
                if (btn) btn.classList.add("active");
            }
        }
    }

    window.toggleDropdown = function(id) {
        const container = document.getElementById(id);
        if (container) {
            container.classList.toggle("show");
            const btn = container.previousElementSibling;
            if (btn) btn.classList.toggle("active");
        }
    };

    // 4. BOTTOM BAR (JAM & TANGGAL REALTIME)
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

                <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700;">
                    <span id="bottom-realtime-date" style="color: #94a3b8;">-</span>
                    <span style="color: #334155;">|</span>
                    <span id="bottom-realtime-clock" style="color: #fbbf24;">-</span>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", bottomBarHTML);
    }

    // 5. AUTO INJEK NAMA USER LOGGED IN KE INPUT PIC LAPORAN (PENTING!)
    function autoInjectPicName() {
        const picElement = document.getElementById("pic");
        if (picElement && currentUser && currentUser !== "GUEST") {
            picElement.value = currentUser;
            if (typeof updateReportHeader === "function") {
                updateReportHeader();
            }
        }
    }

    // 6. LOGIKA ENGINE PIC ON DUTY SIDEBAR
    function isShiftActive(shiftCode, now) {
        const cleanCode = String(shiftCode || '').toUpperCase().replace(/\s+/g, '');
        let matchedKey = null;
        for (let key in SHIFT_HOURS) {
            if (cleanCode.includes(key)) {
                matchedKey = key;
                break;
            }
        }

        if (!matchedKey) return true;

        const hours = SHIFT_HOURS[matchedKey];
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = hours.start.split(':').map(Number);
        const startMinutes = startH * 60 + startM;

        const [endH, endM] = hours.end.split(':').map(Number);
        const endMinutes = endH * 60 + endM;

        if (startMinutes < endMinutes) {
            return currentMinutes >= startMinutes && currentMinutes < endMinutes;
        } else {
            return currentMinutes >= startMinutes || currentMinutes < endMinutes;
        }
    }

    function renderSidebarPicDuty() {
        const picEl = document.getElementById('sidebarPicDutyText');
        if (!picEl) return;

        if (directPicString) {
            picEl.innerText = directPicString.toUpperCase();
            return;
        }

        if (!rawSchedules || rawSchedules.length === 0) {
            picEl.innerHTML = "<span style='color:#94a3b8;'>OFF / TIDAK ADA JADWAL</span>";
            return;
        }

        const now = new Date();
        const activeDuty = rawSchedules.filter(item => isShiftActive(item.shift, now));

        if (activeDuty.length > 0) {
            picEl.innerHTML = activeDuty.map(item => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:1px 0; border-bottom:1px dashed rgba(255,255,255,0.08);">
                    <span style="font-weight:700; color:#f8fafc; font-size:10px;">${item.nama}</span>
                    <span style="font-size:9px; font-weight:800; color:#38bdf8; background:rgba(56,189,248,0.12); padding:1px 4px; border-radius:3px; margin-left:4px;">${item.shift}</span>
                </div>
            `).join('');
        } else {
            picEl.innerHTML = "<span style='color:#ef4444;'>TIDAK ADA PIC AKTIF</span>";
        }
    }

    function loadInstantlyFromCache() {
        const cachedData = localStorage.getItem("LOCAL_PIC_DUTY_CACHE_V3");
        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                if (parsed.schedules && Array.isArray(parsed.schedules)) {
                    rawSchedules = parsed.schedules;
                } else if (parsed.pic) {
                    directPicString = parsed.pic;
                }
                renderSidebarPicDuty();
            } catch (e) {}
        }
    }

    async function fetchSidebarJadwalDuty() {
        try {
            const response = await fetch(`${SCHEDULE_SCRIPT_URL}?cacheBust=${Date.now()}`, {
                method: 'GET',
                redirect: 'follow'
            });

            if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);

            const data = await response.json();
            localStorage.setItem("LOCAL_PIC_DUTY_CACHE_V3", JSON.stringify(data));

            if (data.schedules && Array.isArray(data.schedules) && data.schedules.length > 0) {
                rawSchedules = data.schedules;
                directPicString = "";
            } else if (data.pic) {
                directPicString = data.pic;
            }

            renderSidebarPicDuty();
            lastFetchedDate = new Date().getDate();

        } catch (err) {
            console.error("❌ Gagal memperbarui jadwal sidebar:", err);
        }
    }

    // 7. JAM REALTIME & HEARTBEAT
    function updateFooterClock() {
        const now = new Date();
        const optionsDate = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const dateString = now.toLocaleDateString('id-ID', optionsDate);

        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const dateElement = document.getElementById('bottom-realtime-date');
        const clockElement = document.getElementById('bottom-realtime-clock');

        if (dateElement) dateElement.textContent = dateString;
        if (clockElement) clockElement.textContent = `${hours}:${minutes}:${seconds}`;

        renderSidebarPicDuty();

        if (lastFetchedDate !== null && now.getDate() !== lastFetchedDate) {
            fetchSidebarJadwalDuty();
        }
    }

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
            await initServerUrl();
        }
    }

    // INITIALIZATION
    autoInjectPicName();
    setTimeout(autoInjectPicName, 300); // Retry delay untuk memastikan input #pic di HTML siap
    
    loadInstantlyFromCache();
    await initServerUrl(); 
    syncActiveUsers();     
    fetchSidebarJadwalDuty();

    setInterval(syncActiveUsers, 5000); 
    setInterval(updateFooterClock, 1000);
    updateFooterClock();

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

    window.openChangePassModal = function () { document.getElementById("modalChPass").style.display = "flex"; };
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
});