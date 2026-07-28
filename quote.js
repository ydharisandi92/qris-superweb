function loadQuote() {
    fetch('quotes.json')
        .then(response => response.json())
        .then(quotes => {
            const randomIndex = Math.floor(Math.random() * quotes.length);
            const selectedQuote = quotes[randomIndex];
            const quoteElement = document.getElementById('quote-text');
            if (quoteElement) {
                quoteElement.innerText = selectedQuote;
            }
        })
        .catch(error => {
            console.error('Gagal memuat daftar kutipan:', error);
        });
}

document.addEventListener('DOMContentLoaded', function () {
    loadQuote();
    const refreshBtn = document.getElementById('refreshQuoteBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadQuote);
    }
});