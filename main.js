// main.js - Funzionalità globali del sito
document.addEventListener('DOMContentLoaded', function() {
    // 1. Gestione tema dark/light
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.setAttribute('aria-label', 'Cambia tema');
    themeToggle.setAttribute('title', 'Cambia tema chiaro/scuro');
    
    // Inserire il toggle nel header
    const headerContainer = document.querySelector('.main-header .container');
    if (headerContainer) {
        headerContainer.appendChild(themeToggle);
    }
    
    // Controlla tema salvato o preferenza sistema
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
    
    // 2. Menu hamburger per mobile
    const hamburger = document.querySelector('.hamburger');
    const mainNav = document.querySelector('.main-nav');
    
    if (hamburger && mainNav) {
        hamburger.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            mainNav.classList.toggle('active');
            
            // Animazione hamburger
            this.classList.toggle('active');
        });
        
        // Chiudi menu cliccando fuori
        document.addEventListener('click', function(event) {
            if (!hamburger.contains(event.target) && !mainNav.contains(event.target)) {
                hamburger.setAttribute('aria-expanded', 'false');
                mainNav.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    }
    
    // 3. Aggiorna anno corrente nel footer
    const currentYear = document.getElementById('current-year');
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }
    
    // 4. Genera QR code placeholder
    const qrPlaceholders = document.querySelectorAll('.qr-placeholder, .qr-code');
    qrPlaceholders.forEach(qr => {
        if (qr.innerHTML.trim() === '') {
            qr.innerHTML = `
                <div style="background: #f0f0f0; border-radius: 8px; padding: 10px; text-align: center;">
                    <i class="fas fa-qrcode" style="font-size: 48px; color: #666;"></i>
                    <p style="margin-top: 8px; font-size: 12px; color: #666;">QR Code generato dinamicamente</p>
                </div>
            `;
        }
    });
    
    // 5. Lazy loading per immagini
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
    }
    
    // 6. Aggiungi classe active al link corrente
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.main-nav a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html') ||
            (currentPage === 'index.html' && linkPage === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    console.log('Sito scientifico di Marco Di Ianni - Caricato con successo');
});
