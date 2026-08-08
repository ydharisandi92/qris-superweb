document.addEventListener("DOMContentLoaded", async function () {
    const currentUser = sessionStorage.getItem("loggedInUser") || "GUEST";
    
    // URL GOOGLE APPS SCRIPT
    const CASE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0Kd5FEaK0lFx1A5TdNfyCqtYH_GZgeKbGy9vuNi2S-WouNgDmWF7kFDmX06y3IwW_Sw/exec";
    const SCHEDULE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8izv-omq1Nn5oP1zzXLXqvfJ2sYlNN5of7TzPAJoJew9kmVpmqOESsdjlHjfaNGM_/exec";
    
    let SERVER_URL = "http://localhost:5000"; // Fallback default

    let rawSchedules = [];
    let directPicString = "";
    let lastFetchedOpDate = null;

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

    // FUNGSI MENGHITUNG TANGGAL OPERASIONAL SHIFT
    function getOperationalDateStr(now = new Date()) {
        const d = new Date(now);
        // Jika jam antara 00:00 - 05:59 WIB, jadwal shift malam masih merujuk ke H-1 (hari kemarin)
        if (d.getHours() < 6) {
            d.setDate(d.getDate() - 1);
        }
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

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

    // 1. INJEKSI CSS STYLING SIDEBAR (CYBER GLASSMORPHISM EDITION)
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
          font-size: 15px !important;
          font-weight: 900 !important;
          color: #ffffff !important;
          letter-spacing: 2px;
          padding: 0 12px 14px 12px;
          margin-bottom: 8px;
          border-bottom: 1px solid rgba(0, 240, 255, 0.25);
          white-space: nowrap;
          text-shadow: 0 0 12px rgba(0, 240, 255, 0.6);
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
          font-weight: 700;
          text-decoration: none;
          color: #94a3b8;
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
      }
      .nav-item:hover {
          background: rgba(0, 240, 255, 0.1);
          color: #ffffff;
          border-color: rgba(0, 240, 255, 0.3);
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.15);
      }
      .nav-item.active {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(13, 89, 184, 0.25) 100%) !important;
          color: #00f0ff !important;
          border: 1px solid rgba(0, 240, 255, 0.5) !important;
          font-weight: 800;
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.25);
      }

      /* DROPDOWN MENU STYLING */
      .dropdown-btn {
          width: 100%;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 800;
          color: #cbd5e1;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.25s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
      }
      .dropdown-btn:hover {
          background: rgba(0, 240, 255, 0.1);
          color: #ffffff;
          border-color: rgba(0, 240, 255, 0.3);
      }
      .dropdown-btn.active { 
          color: #00f0ff; 
          text-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
      }
      .dropdown-container {
          display: none; flex-direction: column; gap: 3px;
          padding-left: 10px; margin-top: 2px; margin-bottom: 4px;
          border-left: 2px solid rgba(0, 240, 255, 0.25); margin-left: 10px;
      }
      .dropdown-container.show { display: flex; }
      .dropdown-arrow { font-size: 9px; transition: transform 0.2s ease; }
      .dropdown-btn.active .dropdown-arrow { transform: rotate(180deg); }

      /* WIDGET PIC ON DUTY BAWAH */
      .sidebar-pic-box {
          margin-top: auto !important;
          margin-bottom: 8px;
          padding: 10px 12px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(15, 23, 42, 0.6) 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.4);
      }
      .sidebar-pic-title {
          font-size: 9.5px;
          font-weight: 800;
          color: #00f0ff;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid rgba(0, 240, 255, 0.15);
          padding-bottom: 4px;
      }
      .sidebar-pic-value {
          font-size: 10.5px;
          font-weight: 600;
          color: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 4px;
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
          padding: 8px 4px; 
          border-radius: 6px;
          font-size: 10px; 
          font-weight: 800; 
          border: 1px solid rgba(0, 240, 255, 0.3); 
          cursor: pointer;
          white-space: nowrap; 
          transition: all 0.25s ease;
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 4px;
          letter-spacing: 0.5px;
      }
      .btn-chpass { background: rgba(15, 23, 42, 0.7); color: #f8fafc; }
      .btn-chpass:hover { background: rgba(0, 240, 255, 0.2); border-color: #00f0ff; color: #00f0ff; }
      .btn-logout { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.5); color: #ef4444; }
      .btn-logout:hover { background: #dc2626; color: #ffffff; border-color: #dc2626; box-shadow: 0 0 10px rgba(220, 38, 38, 0.5); }

      /* MODAL GLASSMORPHISM */
      .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(5, 11, 20, 0.85); backdrop-filter: blur(10px); display: none;
          align-items: center; justify-content: center; z-index: 9999;
      }
      .modal-box {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 240, 255, 0.35); border-top: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px; padding: 24px; width: 320px; color: #fff;
          box-shadow: 0 20px 40px rgba(0,0,0,0.7), 0 0 20px rgba(0, 240, 255, 0.15);
      }
      .modal-box h3 { margin: 0 0 16px 0; font-size: 15px; color: #00f0ff; text-transform: uppercase; letter-spacing: 1px; text-shadow: 0 0 10px rgba(0, 240, 255, 0.5); }
      .modal-box label { display: block; font-size: 10px; font-weight: 800; margin-bottom: 4px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
      .modal-box input { width: 100%; padding: 10px; margin-bottom: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 8px; color: #fff; font-size: 12px; outline: none; box-sizing: border-box; transition: all 0.25s ease; }
      .modal-box input:focus { border-color: #00f0ff; box-shadow: 0 0 10px rgba(0, 240, 255, 0.3); }
      .modal-btns { display: flex; gap: 8px; margin-top: 8px; }
      .modal-btn { flex: 1; padding: 10px; border-radius: 8px; font-weight: 800; border: none; cursor: pointer; font-size: 12px; letter-spacing: 0.5px; transition: all 0.25s ease; }
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

      <!-- DROPLIST 3: WA-BOT -->
      <div class="nav-dropdown">
        <button type="button" class="dropdown-btn" onclick="toggleDropdown('wabotDropdown')">
          <span>🤖 WA-BOT</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div id="wabotDropdown" class="dropdown-container">
          <a href="wabot.html" class="nav-item" data-page="wabot.html">🚧 STATUS &amp; SETTING</a>
        </div>
      </div>
    </div>

    <!-- WIDGET PIC ON DUTY BAWAH -->
    <div class="sidebar-pic-box">
        <div class="sidebar-pic-title">
            <span style="height:6px; width:6px; background:#00ff66; border-radius:50%; display:inline-block; box-shadow:0 0 8px #00ff66;"></span>
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
                    <button type="button" onclick="closeChangePassModal()" class="modal-btn" style="background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.2);">Batal</button>
                    <button type="submit" class="modal-btn" style="background:linear-gradient(135deg, #0d59b8 0%, #0099ff 100%); color:#fff; border:1px solid rgba(0,240,255,0.5);">Simpan</button>
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
                    <span style="color: rgba(0,240,255,0.3);">|</span>
                    <span id="bottom-realtime-clock" style="color: #00f0ff;">-</span>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", bottomBarHTML);
    }

    // 5. AUTO INJEK NAMA USER LOGGED IN KE INPUT PIC LAPORAN
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
                <div style="display:flex; justify-content:space-between; align-items:center; padding:2px 0; border-bottom:1px dashed rgba(0,240,255,0.15);">
                    <span style="font-weight:700; color:#f8fafc; font-size:10px;">${item.nama}</span>
                    <span style="font-size:9px; font-weight:800; color:#00f0ff; background:rgba(0,240,255,0.12); padding:1px 4px; border-radius:3px; margin-left:4px;">${item.shift}</span>
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
            const now = new Date();
            const opDateStr = getOperationalDateStr(now);

            // Mengirim tanggal operasional (H-1 jika 00:00 - 05:59)
            const response = await fetch(`${SCHEDULE_SCRIPT_URL}?date=${opDateStr}&cacheBust=${Date.now()}`, {
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
            lastFetchedOpDate = opDateStr;

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

        // Mengecek apakah sudah masuk tanggal operasional berikutnya
        const currentOpDate = getOperationalDateStr(now);
        if (lastFetchedOpDate !== null && currentOpDate !== lastFetchedOpDate) {
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
    setTimeout(autoInjectPicName, 300);
    
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
        msgEl.style.color = "#00f0ff";
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
                msgEl.style.color = "#00ff66";
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