
let userData;

// User-Daten laden und anzeigen
async function loadUserData() {
    const container = document.getElementById('userDataContainer');
    try {
        const res = await fetch('/api/userdataAndPass', { credentials: 'include' });
        if (!res.ok) throw new Error('Fehler beim Laden der Benutzerdaten');
        userData = await res.json();

        let html = '<ul>';
        for (const [key, value] of Object.entries(userData)) {
            html += `<li><strong>${key}:</strong> ${value ?? '-'}</li>`;
        }
        html += '</ul>';

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p class="error">Benutzerdaten konnten nicht geladen werden.</p>`;
        console.error(err);
    }
}

window.onload = () => {
    loadUserData();
}

let form = document.getElementById("updateUserDataForm");
form.addEventListener("submit", (e) => {
    e.preventDefault();

    let data = getUpdatedUserData()
    updateUserData(data);
})

async function updateUserData(userData) {
    try {
        const response = await fetch('/api/userdataupdate', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(userData) // send it directly
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Updaten der Userdaten');
        }

        let result = await response.json();
        console.log(result);
    } catch (error) {
        console.error(error.message);
        throw error;
    }
}

function getUpdatedUserData() {
    const email = document.getElementById("email").value.trim();
    const confirmEmail = document.getElementById("confirm-email").value.trim();
    const telefon = document.getElementById("telefon").value.trim();
    const confirmTelefon = document.getElementById("confirm-telefon").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();
    const oldPassword = document.getElementById("password-old").value.trim();

    if (email && email !== confirmEmail) {
        window.alert("Die E-Mail-Adressen stimmen nicht überein.");
    }
    if (telefon && telefon !== confirmTelefon) {
        window.alert("Die Telefonnummern stimmen nicht überein.");
    }
    if (password && password !== confirmPassword) {
        window.alert("Die Passwörter stimmen nicht überein.");
    }
    if (userData.password !== oldPassword) {
        window.alert("Aktuelles Passwort wurde falsch eingegeben.")
    }

    return {
        vorname: userData.vorname,
        nachname: userData.nachname,
        role: userData.role,
        fuehrungskraft: userData.fuehrungskraft,
        email: email || userData.email,
        telefon: telefon || userData.telefon,
        passwort: password || userData.passwort
    };
}
