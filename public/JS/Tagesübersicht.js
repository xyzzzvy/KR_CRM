document.addEventListener('DOMContentLoaded', async function () {
    // DOM Referenzen
    const mitarbeiterFilter = document.getElementById('mitarbeiterFilter');
    const einzelnerMitarbeiterGroup = document.getElementById('einzelnerMitarbeiterGroup');
    const mitarbeiterListe = document.getElementById('mitarbeiterListe');
    const filterStart = document.getElementById('filterStart');
    const filterApply = document.getElementById('filterApply');

    // Zähler-Elemente
    const heuteQCCount = document.getElementById('heuteQCCount');
    const heuteVGCount = document.getElementById('heuteVGCount');
    const wocheQCCount = document.getElementById('wocheQCCount');
    const wocheVGCount = document.getElementById('wocheVGCount');
    const monatQCCount = document.getElementById('monatQCCount');
    const monatVGCount = document.getElementById('monatVGCount');

    // Globale Variablen
    let alleLeads = []; // Hauptarray für alle Leads
    let gefilterteLeads = []; // Aktuell gefilterte Leads
    let mitarbeiterData = [];
    const currentUserGpnr = parseInt(sessionStorage.getItem('pr') || '');

    await init();

    async function init() {
        console.log('Initialisiere Termine-Übersicht...');
        try {
            await fetchMitarbeiter();
            setupEventListeners();
            await ladeAlleTerminierteLeads();
            await applyFilters(); // Initialfilter anwenden
        } catch (error) {
            console.error('Fehler bei der Initialisierung:', error);
            console.log('Fehler beim Start: ' + error.message);
        }
    }

    // Lädt alle terminierte Leads (eigene + Mitarbeiter)
    async function ladeAlleTerminierteLeads() {
        try {
            alleLeads = [];

            // 1. Eigene Leads laden
            const eigeneLeads = await fetchTerminierteLeads('/api/leads/partner');
            alleLeads = alleLeads.concat(eigeneLeads);

            // 2. Leads aller Mitarbeiter laden
            if (mitarbeiterData && mitarbeiterData.length > 0) {
                for (const mitarbeiter of mitarbeiterData) {
                    if (mitarbeiter.gpnr && mitarbeiter.gpnr !== currentUserGpnr) {
                        const mitarbeiterLeads = await fetchTerminierteLeads(`/api/leads/partnerFK/${mitarbeiter.gpnr}`);
                        alleLeads = alleLeads.concat(mitarbeiterLeads);
                    }
                }
            }

            console.log(`Insgesamt ${alleLeads.length} terminierte Leads geladen`);
        } catch (error) {
            console.error('Fehler beim Laden aller Leads:', error);
        }
    }

    // Generische Funktion zum Laden terminierter Leads
    async function fetchTerminierteLeads(endpoint) {
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) throw new Error(`Fehler beim Laden von ${endpoint}`);
            const leads = await response.json();
            return leads.filter(lead =>
                (lead.status === "QC fixiert" || lead.status === "VG fixiert" || lead.status === "QC durchgeführt" || lead.status === "VG durchgeführt") &&
                lead.terminisiert
            );
        } catch (error) {
            console.error(`Fehler beim Laden von ${endpoint}:`, error);
            return [];
        }
    }

    // Mitarbeiterdaten laden
    async function fetchMitarbeiter() {
        try {
            const response = await fetch('/api/users/by-gpnr', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Fehler: ${response.status} - ${errorText}`);
            }

            mitarbeiterData = await response.json();
            populateMitarbeiterDropdown();
        } catch (error) {
            console.log('Fehler beim Laden der Mitarbeiter:', error);
            console.log('Fehler beim Laden der Mitarbeiterliste');
            mitarbeiterListe.innerHTML = '<option value="">Fehler beim Laden</option>';
        }
    }

    // Mitarbeiter-Dropdown befüllen
    function populateMitarbeiterDropdown() {
        mitarbeiterListe.innerHTML = '';

        if (!mitarbeiterData || mitarbeiterData.length === 0) {
            mitarbeiterListe.innerHTML = '<option value="">Keine Mitarbeiter gefunden</option>';
            return;
        }

        mitarbeiterData.forEach(mitarbeiter => {
            if (mitarbeiter.gpnr) {
                const option = document.createElement('option');
                option.value = mitarbeiter.gpnr;
                option.textContent = `${mitarbeiter.vorname} ${mitarbeiter.nachname} (${mitarbeiter.gpnr})`;
                mitarbeiterListe.appendChild(option);
            }
        });
    }

    // Event Listener einrichten
    function setupEventListeners() {
        mitarbeiterFilter.addEventListener('change', async function () {
            einzelnerMitarbeiterGroup.style.display = this.value === 'einzelner' ? 'block' : 'none';
            await applyFilters();
        });

        mitarbeiterListe.addEventListener('change', async function () {
            if (mitarbeiterFilter.value === 'einzelner') {
                await applyFilters();
            }
        });

        filterApply.addEventListener('click', async function (e) {
            e.preventDefault();
            await applyFilters();
        });
    }

    // Filter anwenden
    async function applyFilters() {
        let filteredData = [...alleLeads];
        const filterOption = mitarbeiterFilter.value;

        // Mitarbeiterfilter
        if (filterOption === 'ich') {
            filteredData = filteredData.filter(lead => lead.partner === currentUserGpnr);
        } else if (filterOption === 'einzelner') {
            const selectedGpnr = parseInt(mitarbeiterListe.value);
            if (selectedGpnr) {
                filteredData = filteredData.filter(lead => lead.partner === selectedGpnr);
            }
        }

        // Datumsfilter basierend auf ausgewähltem Startdatum
        if (filterStart.value) {
            const start = new Date(filterStart.value);
            const end = new Date(start);
            end.setDate(start.getDate() + 30); // 30 Tage später

            filteredData = filteredData.filter(lead => {
                const terminDatum = new Date(lead.terminisiert);
                return terminDatum >= start && terminDatum <= end;
            });
        }

        gefilterteLeads = filteredData;
        await updateTermineAnzeige();
    }

    // Termine anzeigen und Zähler aktualisieren
    async function updateTermineAnzeige() {
        // Basis-Datum bestimmen
        const basisDatum = filterStart.value ? new Date(filterStart.value) : new Date();
        basisDatum.setHours(0, 0, 0, 0);

        // Datumsberechnungen
        const heute = new Date(basisDatum);

        // Woche: 7 Tage ab dem ausgewählten Datum
        const wocheEnde = new Date(basisDatum);
        wocheEnde.setDate(basisDatum.getDate() + 6);

        // Monat: 30 Tage ab dem ausgewählten Datum
        const monatEnde = new Date(basisDatum);
        monatEnde.setDate(basisDatum.getDate() + 29);

        // Formatierte Datumsstrings mit Uhrzeit
        const heuteDatumStr = formatDatumKurz(heute);
        const wocheStartStr = formatDatumKurz(basisDatum);
        const wocheEndeStr = formatDatumKurz(wocheEnde);
        const monatStartStr = formatDatumKurz(basisDatum);
        const monatEndeStr = formatDatumKurz(monatEnde);

        // Überschriften aktualisieren
        document.querySelector('.termine-section:nth-child(1) h2').textContent = `Heute (${heuteDatumStr})`;
        document.querySelector('.termine-section:nth-child(2) h2').textContent = `Diese Woche (${wocheStartStr} - ${wocheEndeStr})`;
        document.querySelector('.termine-section:nth-child(3) h2').textContent = `Diesen Monat (${monatStartStr} - ${monatEndeStr})`;

        // Termine berechnen
        const heuteTermine = filterTermineByDate(heute, heute);
        const wocheTermine = filterTermineByDate(basisDatum, wocheEnde);
        const monatTermine = filterTermineByDate(basisDatum, monatEnde);

        const heuteQC = filterTermineByType(heuteTermine, 'QC');
        const heuteVG = filterTermineByType(heuteTermine, 'VG');
        const wocheQC = filterTermineByType(wocheTermine, 'QC');
        const wocheVG = filterTermineByType(wocheTermine, 'VG');
        const monatQC = filterTermineByType(monatTermine, 'QC');
        const monatVG = filterTermineByType(monatTermine, 'VG');

        heuteQCCount.textContent = heuteQC.length;
        heuteVGCount.textContent = heuteVG.length;
        wocheQCCount.textContent = wocheQC.length;
        wocheVGCount.textContent = wocheVG.length;
        monatQCCount.textContent = monatQC.length;
        monatVGCount.textContent = monatVG.length;

        await fillTermineSection('heuteQC', heuteQC);
        await fillTermineSection('heuteVG', heuteVG);
        await fillTermineSection('wocheQC', wocheQC);
        await fillTermineSection('wocheVG', wocheVG);
        await fillTermineSection('monatQC', monatQC);
        await fillTermineSection('monatVG', monatVG);
    }

    function filterTermineByDate(startDate, endDate) {
        return gefilterteLeads.filter(termin => {
            const terminDatum = new Date(termin.terminisiert);
            return terminDatum >= startDate && terminDatum <= endDate;
        });
    }

    function filterTermineByType(termine, type) {
        return termine.filter(termin => termin.status === `${type} fixiert` || termin.status === `${type} durchgeführt`);
    }

    async function fillTermineSection(sectionId, termine) {
        const section = document.getElementById(sectionId);
        section.innerHTML = '';

        if (termine.length === 0) {
            section.innerHTML = '<p class="no-termine">Keine Termine</p>';
            return;
        }

        // Termine nach Uhrzeit sortieren
        termine.sort((a, b) => {
            const dateA = new Date(a.terminisiert);
            const dateB = new Date(b.terminisiert);
            return dateA - dateB;
        });

        for (const termin of termine) {
            const element = await createTerminElement(termin);
            section.appendChild(element);
        }
    }

    async function getUserName(gpnr) {
        try {
            const res = await fetch('/api/userdata', { credentials: 'include' });
            if (!res.ok) {
                console.warn(`User API Fehler für GPNR ${gpnr}: ${res.status}`);
                return 'Unbekannt';
            }
            const user = await res.json();
            return `${user.nachname} ${user.vorname}`;
        } catch (err) {
            console.error('Fehler beim Laden Username für GPNR', gpnr, err);
            return 'Unbekannt';
        }
    }

    async function createTerminElement(termin) {
        const element = document.createElement('div');
        element.className = 'termin-card';

        const datum = formatTerminDatum(termin.terminisiert);
        const uhrzeit = formatTerminUhrzeit(termin.terminisiert);
        const statusClass = termin.status.includes('QC') ? 'status-qc' : 'status-vg';
        const partnerName = await getUserName(termin.partner);

        element.innerHTML = `
            <div class="termin-header">
                <span class="termin-datum">${datum}</span>
                <span class="termin-uhrzeit">${uhrzeit}</span>
                <span class="termin-status ${statusClass}">${termin.status}</span>
            </div>
            <div class="termin-details">
                <p><strong>${termin.name || 'Kein Name'}</strong></p>
                <p>${termin.strasse || ''} ${termin.hausnummer || ''}</p>
                <p>${termin.plz || ''} ${termin.ort || ''}</p>
                <p>Tel: ${termin.telefon || 'Keine Telefonnummer'}</p>
                <p>Partner: ${partnerName} (${termin.partner})</p>
            </div>
        `;

        return element;
    }

    function formatTerminDatum(datumString) {
        try {
            const datum = new Date(datumString);
            return datum.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            console.error('Ungültiges Datum:', datumString);
            return datumString;
        }
    }

    function formatTerminUhrzeit(datumString) {
        try {
            const datum = new Date(datumString);
            return datum.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error('Ungültige Uhrzeit:', datumString);
            return '';
        }
    }

    function formatDatumKurz(datum) {
        // Sicherstellen, dass es ein Date-Objekt ist
        const dateObj = new Date(datum);

        return dateObj.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    window.editTermin = function (terminId) {
        console.log('Bearbeite Termin:', terminId);
        window.location.href = `/termin-bearbeiten.html?id=${terminId}`;
    };
});