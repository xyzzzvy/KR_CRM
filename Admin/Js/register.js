const form = document.getElementById('registrationForm');

// Toast erstellen (einmalig)
const toast = document.createElement('div');
toast.id = 'toast';
Object.assign(toast.style, {
    visibility: 'hidden',
    minWidth: '250px',
    backgroundColor: '#4CAF50',
    color: 'white',
    textAlign: 'center',
    borderRadius: '5px',
    padding: '16px',
    position: 'fixed',
    zIndex: '1000',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '17px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    transition: 'visibility 0s, opacity 0.5s linear',
    opacity: '0'
});
document.body.appendChild(toast);

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#f44336' : '#4CAF50'; // Rot bei Fehler
    toast.style.visibility = 'visible';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.style.visibility = 'hidden';
            toast.style.backgroundColor = '#4CAF50'; // zurück zu grün
        }, 500);
    }, 3000);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = {
        gpnr: form.gpnr.value.trim(),
        vorname: form.vorname.value.trim(),
        nachname: form.nachname.value.trim(),
        telefon: form.telefon.value.trim(),
        email: form.email.value.trim(),
        fuehrungskraft: form.fuehrungskraftGpnr.value.trim() || null,
        passwort: form.passwort.value,
        role: "User" // oder dynamisch setzen
    };

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(`Fehler: ${data.error}`, true);
            return;
        }

        showToast(`Registrierung erfolgreich für GPNR: ${data.gpnr}`);
        form.reset();

    } catch (err) {
        console.error('Fehler beim Registrieren:', err);
        showToast('Interner Fehler bei der Registrierung.', true);
    }
});
