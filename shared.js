// FORMAT MATA UANG RUPIAH
function formatCurrency(value) {
    let num = parseFloat(String(value || 0).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) num = 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(num);
}

// NOTIFIKASI TOAST
function showToast(message, isError = false) {
    const toast = document.getElementById("customToast");
    if (!toast) return;
    toast.innerText = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

// FUNGSI COPY, PREVIEW & MODAL UNTUK GAMBAR
async function openPreviewModal() {
    const modal = document.getElementById("previewModal");
    const container = document.getElementById("previewImageContainer");
    if(!modal || !container) return;
    
    container.innerHTML = `<span style="color: #38bdf8; font-size: 13px;">Sedang merender gambar laporan...</span>`;
    modal.style.display = "flex";

    if (!generatedCanvasBlob) await prepareCanvasBlob();

    if (generatedCanvasBlob) {
        const imageUrl = URL.createObjectURL(generatedCanvasBlob);
        container.innerHTML = `<img src="${imageUrl}" alt="Preview Laporan HD">`;
    } else {
        container.innerHTML = `<span style="color: #ef4444; font-size: 13px;">Gagal memuat preview gambar. Klik "Generate Report" terlebih dahulu.</span>`;
    }
}

function closePreviewModal() {
    const modal = document.getElementById("previewModal");
    if(modal) modal.style.display = "none";
}

async function copyImageFromModal() {
    await copyImage();
    closePreviewModal();
}

async function copyImage() {
    if (!generatedCanvasBlob) await prepareCanvasBlob();

    if (!generatedCanvasBlob) {
        showToast("❌ Belum ada data laporan yang dirender.", true);
        return;
    }

    try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": generatedCanvasBlob })]);
        showToast("✅ Gambar laporan format HD berhasil disalin ke clipboard!");
    } catch (err) {
        console.error(err);
        showToast("❌ Gagal menyalin gambar otomatis.", true);
    }
}