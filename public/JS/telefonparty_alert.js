document.addEventListener('DOMContentLoaded', () => {
    if(sessionStorage.getItem('telefonparty')) {
        function showPersistentToast() {
            const toast = document.createElement('div');
            toast.innerText ="Du bist gerade in der Telefonparty.";
            Object.assign(toast.style, {
                visibility: 'visible',
                position: 'fixed',
                top: '2rem',
                right: '2rem',
                backgroundColor: '#ff0000',
                color: '#fff',
                padding: '1rem 2rem',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)',
                opacity: '0',
                transition: 'opacity 0.4s ease',
                zIndex: '1000',
                fontFamily: 'Segoe UI, sans-serif'
            });

            document.body.appendChild(toast);
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
            });

            return toast;
        }
        const myToast = showPersistentToast();
        if(!sessionStorage.getItem('telefonparty')) {
            myToast.remove();
        }
    }
})



