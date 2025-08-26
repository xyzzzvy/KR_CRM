// DOM-Referenzen
const form = document.getElementById('beraterForm');
const openLeadsCountDisplay = document.getElementById('openLeadsCount');
const plzInput = document.getElementById('plz');
const kampagneInput = document.getElementById('filterCampaignSender');
const statusSelect = document.getElementById('leadStatus');
const blSelect = document.getElementById('BLzuweisen');
const anzahlLeadsInput = document.getElementById('anzahlLeads');
const kampagneSuggestionsBox = document.createElement('div');
kampagneSuggestionsBox.id = 'kampagneSuggestions';
Object.assign(kampagneSuggestionsBox.style, {
    border: '1px solid #ccc',
    maxHeight: '150px',
    overflowY: 'auto',
    position: 'absolute',
    background: 'white',
    zIndex: '1000',
    display: 'none'
});
kampagneInput.parentNode.appendChild(kampagneSuggestionsBox);

// Toast erstellen
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

function showToast(message) {
    toast.textContent = message;
    toast.style.visibility = 'visible';
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => (toast.style.visibility = 'hidden'), 500);
    }, 3000);
}

// Autocomplete für Kampagnen
let kampagnesCache = []; // Wird dynamisch aus den Leads befüllt
function updateKampagnesCache() {
    if (!window.leads) return;
    const allKamps = window.leads.map(l => l.kampagne).filter(Boolean);
    kampagnesCache = Array.from(new Set(allKamps));
}

function clearKampagneSuggestions() {
    kampagneSuggestionsBox.innerHTML = '';
    kampagneSuggestionsBox.style.display = 'none';
}

function renderKampagneSuggestions(filtered) {
    clearKampagneSuggestions();
    if (filtered.length === 0) return;

    kampagneSuggestionsBox.style.display = 'block';
    filtered.forEach(k => {
        const div = document.createElement('div');
        div.textContent = k;
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
            kampagneInput.value = k;
            clearKampagneSuggestions();
            updateOpenLeadsCount();
        });
        kampagneSuggestionsBox.appendChild(div);
    });
}

function filterKampagnes(query) {
    if (!query) return clearKampagneSuggestions();
    const filtered = kampagnesCache.filter(k => k.toLowerCase().startsWith(query.toLowerCase()));
    renderKampagneSuggestions(filtered);
}

// Events für Kampagnen-Input
kampagneInput.addEventListener('input', e => filterKampagnes(e.target.value));
document.addEventListener('click', e => {
    if (e.target !== kampagneInput && e.target.parentNode !== kampagneSuggestionsBox) {
        clearKampagneSuggestions();
    }
});

// Funktion: offene Leads nach Filter
function getFilteredOpenLeads() {
    let offeneLeads = window.leads.filter(lead => lead.partner === 0);

    const plzFilter = plzInput.value.trim();
    if (plzFilter) offeneLeads = offeneLeads.filter(lead => lead.plz.startsWith(plzFilter));

    const kampagneFilter = kampagneInput.value.trim().toLowerCase();
    if (kampagneFilter) offeneLeads = offeneLeads.filter(lead => lead.kampagne.toLowerCase().startsWith(kampagneFilter));

    const statusFilter = statusSelect.value;
    if (statusFilter && statusFilter !== 'alle') offeneLeads = offeneLeads.filter(lead => lead.status === statusFilter);

    const blFilter = blSelect.value;
    if (blFilter) offeneLeads = offeneLeads.filter(lead => lead.bl === blFilter);

    return offeneLeads;
}

// Update Lead-Zähler
function updateOpenLeadsCount() {
    updateKampagnesCache();
    const offeneLeads = getFilteredOpenLeads();
    openLeadsCountDisplay.textContent = offeneLeads.length;
}

// Limit für Eingabe der Anzahl
anzahlLeadsInput.addEventListener('input', () => {
    const offeneLeadsCount = getFilteredOpenLeads().length;
    let currentValue = parseInt(anzahlLeadsInput.value, 10);
    if (isNaN(currentValue) || currentValue <= 0) return;
    if (currentValue > offeneLeadsCount) anzahlLeadsInput.value = offeneLeadsCount;
});

// Update bei Änderungen
plzInput.addEventListener('input', updateOpenLeadsCount);
kampagneInput.addEventListener('input', updateOpenLeadsCount);
statusSelect.addEventListener('change', updateOpenLeadsCount);
blSelect.addEventListener('change', updateOpenLeadsCount);
document.addEventListener('leadsLoaded', () => updateOpenLeadsCount());

// Submit-Event
form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const beraterName = document.getElementById('beraterName').value;
    const anzahlLeads = parseInt(anzahlLeadsInput.value, 10);

    if (!beraterName || isNaN(anzahlLeads) || anzahlLeads <= 0) {
        alert('Bitte gib einen gültigen Namen und eine Anzahl an.');
        return;
    }

    const gefilterteLeads = getFilteredOpenLeads();
    const zuzuweisendeLeads = gefilterteLeads.slice(0, anzahlLeads);

    if (zuzuweisendeLeads.length === 0) {
        alert('Keine passenden Leads gefunden.');
        return;
    }

    const leadIds = zuzuweisendeLeads.map(lead => lead.id);

    try {
        const response = await fetch('/assign-leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ partner: beraterName, leadIds })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Server antwortete mit Status ${response.status}: ${text}`);
        }

        await response.json();
        showToast(`${zuzuweisendeLeads.length} Leads wurden ---${beraterName}--- zugewiesen.`);
        form.reset();
        setTimeout(() => window.location.reload(), 3500);

    } catch (error) {
        alert('Fehler bei der Zuweisung: ' + error.message);
    }
});
