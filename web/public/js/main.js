// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Auto-hide alerts
document.addEventListener('DOMContentLoaded', () => {
    const alerts = document.querySelectorAll('.alert[data-auto-dismiss]');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    });
});

// Loading state for forms
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.classList.contains('no-loading')) {
            submitBtn.disabled = true;
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Laden...';

            // Re-enable after 5 seconds as fallback
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 5000);
        }
    });
});

// Copy to clipboard function
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show temporary success message
        const message = document.createElement('div');
        message.className = 'alert alert-success';
        message.style.position = 'fixed';
        message.style.top = '20px';
        message.style.right = '20px';
        message.style.zIndex = '9999';
        message.textContent = '✓ Gekopieerd naar klembord!';
        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 2000);
    });
}

// Add copy buttons to code blocks
document.querySelectorAll('code').forEach(code => {
    if (code.textContent.length > 10) {
        code.style.position = 'relative';
        code.style.cursor = 'pointer';
        code.title = 'Klik om te kopiëren';

        code.addEventListener('click', function() {
            copyToClipboard(this.textContent);
        });
    }
});

console.log('Valknut Dashboard Loaded');
