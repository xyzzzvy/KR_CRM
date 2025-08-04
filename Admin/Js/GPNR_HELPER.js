const beraterInput = document.getElementById('beraterName');
const suggestionsBox = document.getElementById('beraterSuggestions');

let usersCache = [];  // Cache der Nutzer zum Filtern, kann man auch direkt per API filtern

async function fetchUsers() {
    try {
        const response = await fetch('/api/users', { credentials: 'include' });
        if (!response.ok) throw new Error('Fehler beim Laden der Nutzer');
        const users = await response.json();
        usersCache = users; // speichere alle User im Cache
    } catch (error) {
        console.error(error);
    }
}

function clearSuggestions() {
    suggestionsBox.innerHTML = '';
    suggestionsBox.style.display = 'none';
}

function renderSuggestions(filteredUsers) {
    clearSuggestions();
    if (filteredUsers.length === 0) return;

    suggestionsBox.style.display = 'block';

    filteredUsers.forEach(user => {
        const div = document.createElement('div');
        div.textContent = `${user.gpnr} — ${user.vorname} ${user.nachname}`;
        div.style.cursor = 'pointer';

        div.addEventListener('click', () => {
            beraterInput.value = user.gpnr;
            clearSuggestions();
        });

        suggestionsBox.appendChild(div);
    });
}

// Filtern nur nach GPNR, die mit Eingabe beginnen
function filterUsers(query) {
    if (!query) {
        clearSuggestions();
        return;
    }

    const filtered = usersCache.filter(user =>
        user.gpnr.toString().startsWith(query)
    );

    renderSuggestions(filtered);
}

// Hole Nutzer beim Laden einmal
fetchUsers();

// Auf Input reagieren
beraterInput.addEventListener('input', (e) => {
    const query = e.target.value;
    filterUsers(query);
});

// Klick außerhalb schließt Vorschläge
document.addEventListener('click', (e) => {
    if (e.target !== beraterInput && e.target.parentNode !== suggestionsBox) {
        clearSuggestions();
    }
});
