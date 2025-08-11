// LeadsZuweisung.js
(function() {
    // DOM Referenzen
    const form = document.getElementById('beraterForm');
    const openLeadsCountDisplay = document.getElementById('openLeadsCount');
    const plzInput = document.getElementById('plz');
    const kampagneSelect = document.getElementById('filterCampaignSender');
    const statusSelect = document.getElementById('leadStatus');
    const blSelect = document.getElementById('BLzuweisen');
    const anzahlLeadsInput = document.getElementById('anzahlLeads');
    const beraterInput = document.getElementById('beraterName');
    const suggestionsBox = document.getElementById('beraterSuggestions');
    const gpnrInput = document.getElementById('GPNR');
    const nameFilter = document.getElementById('nameFilter');

    // Lade-Toast
    const loadingToast = document.createElement('div');
    loadingToast.id = 'loadingToast';
    Object.assign(loadingToast.style, {
        visibility: 'hidden',
        minWidth: '250px',
        backgroundColor: '#333',
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
        transition: 'visibility 0s, opacity 0.3s ease',
        opacity: '0'
    });
    document.body.appendChild(loadingToast);

    let leads = [];
    let usersCache = [];

    // Hilfsfunktionen
    function showLoadingToast(message = 'Bitte warten…') {
        loadingToast.textContent = message;
        loadingToast.style.visibility = 'visible';
        loadingToast.style.opacity = '1';
    }

    function hideLoadingToast() {
        loadingToast.style.opacity = '0';
        setTimeout(() => {
            loadingToast.style.visibility = 'hidden';
        }, 300);
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = '#4CAF50';
        toast.style.color = 'white';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '1000';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Kampagnen laden
    async function loadKampagnes() {
        try {
            const response = await fetch('/api/kamps', {
                credentials: "include"
            });

            if (!response.ok) throw new Error('Fehler beim Laden der Kampagnen');

            const kampagnes = await response.json();
            const selectIds = ['filterCampaign', 'filterCampaignSender'];

            for (const id of selectIds) {
                const select = document.getElementById(id);
                if (!select) continue;

                select.innerHTML = '<option value="alle">Alle</option>';

                kampagnes.forEach(k => {
                    const option = document.createElement('option');
                    option.value = k.name;
                    option.textContent = k.name;
                    select.appendChild(option);
                });
            }
        } catch (err) {
            console.error('Kampagnen konnten nicht geladen werden:', err);
            showToast('Fehler beim Laden der Kampagnen');
        }
    }

    // Autocomplete-Funktionen
    async function fetchUsers() {
        try {
            const response = await fetch('/api/users', {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Fehler beim Laden der Nutzer');
            usersCache = await response.json();
        } catch (error) {
            console.error(error);
            showToast('Fehler beim Laden der Beraterliste');
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
            div.style.padding = '8px';
            div.style.borderBottom = '1px solid #eee';

            div.addEventListener('click', () => {
                beraterInput.value = user.gpnr;
                clearSuggestions();
            });

            suggestionsBox.appendChild(div);
        });
    }

    function filterUsers(query) {
        if (!query) {
            clearSuggestions();
            return;
        }

        const filtered = usersCache.filter(user =>
            user.gpnr.toString().startsWith(query) ||
            `${user.vorname} ${user.nachname}`.toLowerCase().includes(query.toLowerCase())
        );

        renderSuggestions(filtered);
    }

    function setupAutocomplete() {
        beraterInput.addEventListener('input', (e) => {
            const query = e.target.value;
            filterUsers(query);
        });

        document.addEventListener('click', (e) => {
            if (e.target !== beraterInput && e.target.parentNode !== suggestionsBox) {
                clearSuggestions();
            }
        });
    }

    // Leads laden
    async function fetchLeads() {
        try {
            showLoadingToast('Leads werden geladen…');
            const response = await fetch('/api/leads', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Fehler beim Laden der Leads');
            }

            leads = await response.json();
            document.dispatchEvent(new Event('leadsLoaded'));
        } catch (error) {
            console.error('Fehler beim Laden der Leads:', error);
            showToast('Fehler beim Laden der Leads');
        } finally {
            hideLoadingToast();
        }
    }

    // Filterfunktionen
    function getFilteredOpenLeads() {
        // Nur Leads mit Partner = 0 berücksichtigen
        let filteredLeads = leads.filter(lead => lead.partner === 0 || lead.partner === "0");

        // Partner Filter (GPNR)
        const gpnr = gpnrInput ? gpnrInput.value.trim() : '';
        if (gpnr) {
            filteredLeads = filteredLeads.filter(lead =>
                lead.partner != null && lead.partner.toString().startsWith(gpnr)
            );
        }

        // PLZ Filter
        const plzFilter = plzInput.value.trim();
        if (plzFilter) {
            filteredLeads = filteredLeads.filter(lead => lead.plz.startsWith(plzFilter));
        }

        // Kampagnen Filter
        const kampagneFilter = kampagneSelect.value;
        if (kampagneFilter && kampagneFilter !== 'alle') {
            filteredLeads = filteredLeads.filter(lead => lead.kampagne === kampagneFilter);
        }

        // Status Filter
        const statusFilter = statusSelect.value;
        if (statusFilter && statusFilter !== 'alle') {
            filteredLeads = filteredLeads.filter(lead => lead.status === statusFilter);
        }

        // Bundesland Filter
        const blFilter = blSelect.value;
        if (blFilter) {
            filteredLeads = filteredLeads.filter(lead => lead.bl === blFilter);
        }

        // Name/Telefon Filter
        const name = nameFilter ? nameFilter.value.trim().toLowerCase() : '';
        if (name) {
            filteredLeads = filteredLeads.filter(lead =>
                lead.name.toLowerCase().includes(name) ||
                lead.telefon.replace(/\s+/g, '').includes(name)
            );
        }

        return filteredLeads;
    }

    // UI Updates
    function updateOpenLeadsCount() {
        const filteredLeads = getFilteredOpenLeads();
        const maxLeads = filteredLeads.length;
        openLeadsCountDisplay.textContent = maxLeads;

        anzahlLeadsInput.setAttribute('max', maxLeads);

        const currentValue = parseInt(anzahlLeadsInput.value);
        if (!isNaN(currentValue)) {
            if (currentValue > maxLeads) {
                anzahlLeadsInput.value = maxLeads;
                showToast(`Maximal ${maxLeads} Leads verfügbar`);
            } else if (currentValue < 1 && maxLeads > 0) {
                anzahlLeadsInput.value = 1;
            }
        }
    }

    // Leads zuweisen
    async function assignLeads() {
        const beraterName = beraterInput.value.trim();
        const anzahlLeads = parseInt(anzahlLeadsInput.value, 10);
        const maxAvailable = getFilteredOpenLeads().length;

        if (!beraterName || isNaN(anzahlLeads)) {
            alert('Bitte gib einen gültigen Namen und eine Anzahl an.');
            return;
        }

        if (anzahlLeads <= 0) {
            alert('Die Anzahl der Leads muss größer als 0 sein.');
            return;
        }

        if (anzahlLeads > maxAvailable) {
            alert(`Es sind nur ${maxAvailable} Leads verfügbar.`);
            anzahlLeadsInput.value = maxAvailable;
            return;
        }

        const leadsToAssign = getFilteredOpenLeads().slice(0, anzahlLeads);

        try {
            showLoadingToast('Leads werden zugewiesen…');
            const response = await fetch('/assign-leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    partner: beraterName,
                    leadIds: leadsToAssign.map(lead => lead.id)
                }),
            });

            if (!response.ok) {
                throw new Error(`Server antwortete mit Status ${response.status}`);
            }

            showToast(`${leadsToAssign.length} Leads wurden ${beraterName} zugewiesen`);
            form.reset();
            setTimeout(() => window.location.reload(), 3500);
        } catch (error) {
            console.error('Fehler bei der Zuweisung:', error);
            alert('Fehler bei der Zuweisung: ' + error.message);
        } finally {
            hideLoadingToast();
        }
    }

    // Initialisierung
    function initialize() {
        loadKampagnes();
        fetchUsers();
        fetchLeads();
        setupAutocomplete();

        // Event-Listener für Filter
        [plzInput, gpnrInput, nameFilter].forEach(input => {
            if (input) input.addEventListener('input', updateOpenLeadsCount);
        });

        [kampagneSelect, statusSelect, blSelect].forEach(select => {
            if (select) select.addEventListener('change', updateOpenLeadsCount);
        });

        anzahlLeadsInput.addEventListener('input', function() {
            const maxLeads = getFilteredOpenLeads().length;
            const enteredValue = parseInt(this.value);

            if (!isNaN(enteredValue)) {
                if (enteredValue > maxLeads) {
                    this.value = maxLeads;
                    showToast(`Maximal ${maxLeads} Leads verfügbar`);
                } else if (enteredValue < 1 && maxLeads > 0) {
                    this.value = 1;
                }
            }
            updateOpenLeadsCount();
        });

        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            await assignLeads();
        });

        document.addEventListener('leadsLoaded', updateOpenLeadsCount);
    }

    // Start
    initialize();
})();