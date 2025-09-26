document.addEventListener('DOMContentLoaded', async function () {
    // DOM Referenzen
    const mitarbeiterFilter = document.getElementById('mitarbeiterFilter');
    const einzelnerMitarbeiterGroup = document.getElementById('einzelnerMitarbeiterGroup');
    const mitarbeiterListe = document.getElementById('mitarbeiterListe');
    const filterStart = document.getElementById('filterStart');
    const filterApply = document.getElementById('filterApply');

    // Zähler-Elemente Heute
    const heuteQCCount = document.getElementById('heuteQCCount');
    const heuteQCCountdurchgeführt = document.getElementById('heuteQCCountdurchgeführt');
    const heuteVGCount = document.getElementById('heuteVGCount');
    const heuteVGCountdurchgeführt = document.getElementById('heuteVGCountdurchgeführt');

    // Zähler-Elemente Woche
    const wocheQCCount = document.getElementById('wocheQCCount');
    const wocheQCCountdurchgeführt = document.getElementById('wocheQCCountdurchgeführt');
    const wocheVGCount = document.getElementById('wocheVGCount');
    const wocheVGCountdurchgeführt = document.getElementById('wocheVGCountdurchgeführt');

    // Zähler-Elemente Monat
    const monatQCCount = document.getElementById('monatQCCount');
    const monatQCCountdurchgeführt = document.getElementById('monatQCCountdurchgeführt');
    const monatVGCount = document.getElementById('monatVGCount');
    const monatVGCountdurchgeführt = document.getElementById('monatVGCountdurchgeführt');

    // Globale Variablen
    window.alleLeads = []; // Hauptarray für alle Leads
    window.gefilterteLeads = []; // Aktuell gefilterte Leads
    window.mitarbeiterData = [];
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
                (lead.status === "QC fixiert" || lead.status === "VG fixiert" ||
                    lead.status === "QC durchgeführt" || lead.status === "VG durchgeführt") &&
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

        // Datumsfilter
        if (filterStart.value) {
            const start = new Date(filterStart.value);
            start.setHours(0, 0, 0, 0);

            const end = new Date(start);
            end.setDate(start.getDate() + 30); // 30 Tage später
            end.setHours(23, 59, 59, 999);

            filteredData = filteredData.filter(lead => {
                if (!lead.terminisiert) return false;

                // Termin-Datum mit Uhrzeit erstellen
                const terminDatum = new Date(lead.terminisiert);
                return terminDatum >= start && terminDatum <= end;
            });
        }

        gefilterteLeads = filteredData;
        await updateTermineAnzeige();
    }

    // Termine anzeigen und Zähler aktualisieren
    async function updateTermineAnzeige() {
        // Basis-Datum
        const basisDatum = filterStart.value ? new Date(filterStart.value) : new Date();
        basisDatum.setHours(0, 0, 0, 0);

        // Heute
        const heuteStart = new Date(basisDatum);
        heuteStart.setHours(0, 0, 0, 0);
        const heuteEnde = new Date(basisDatum);
        heuteEnde.setHours(23, 59, 59, 999);

        // Woche
        const wocheEnde = new Date(basisDatum);
        wocheEnde.setDate(basisDatum.getDate() + 6);
        wocheEnde.setHours(23, 59, 59, 999);

        // Monat
        const monatEnde = new Date(basisDatum);
        monatEnde.setDate(basisDatum.getDate() + 29);
        monatEnde.setHours(23, 59, 59, 999);

        // Überschriften aktualisieren
        document.querySelector('.termine-section:nth-child(1) h2').textContent = `Heute (${formatDatumKurz(heuteStart)})`;
        document.querySelector('.termine-section:nth-child(2) h2').textContent = `Diese Woche (${formatDatumKurz(basisDatum)} - ${formatDatumKurz(wocheEnde)})`;
        document.querySelector('.termine-section:nth-child(3) h2').textContent = `Diesen Monat (${formatDatumKurz(basisDatum)} - ${formatDatumKurz(monatEnde)})`;

        // Termine berechnen
        const heuteTermine = filterTermineByDate(heuteStart, heuteEnde);
        const wocheTermine = filterTermineByDate(basisDatum, wocheEnde);
        const monatTermine = filterTermineByDate(basisDatum, monatEnde);

        // Heute
        const heuteQC_fixiert = filterTermineByStatus(heuteTermine, "QC fixiert");
        const heuteQC_durchgeführt = filterTermineByStatus(heuteTermine, "QC durchgeführt");
        const heuteVG_fixiert = filterTermineByStatus(heuteTermine, "VG fixiert");
        const heuteVG_durchgeführt = filterTermineByStatus(heuteTermine, "VG durchgeführt");

        // Woche
        const wocheQC_fixiert = filterTermineByStatus(wocheTermine, "QC fixiert");
        const wocheQC_durchgeführt = filterTermineByStatus(wocheTermine, "QC durchgeführt");
        const wocheVG_fixiert = filterTermineByStatus(wocheTermine, "VG fixiert");
        const wocheVG_durchgeführt = filterTermineByStatus(wocheTermine, "VG durchgeführt");

        // Monat
        const monatQC_fixiert = filterTermineByStatus(monatTermine, "QC fixiert");
        const monatQC_durchgeführt = filterTermineByStatus(monatTermine, "QC durchgeführt");
        const monatVG_fixiert = filterTermineByStatus(monatTermine, "VG fixiert");
        const monatVG_durchgeführt = filterTermineByStatus(monatTermine, "VG durchgeführt");

        // Counter setzen
        heuteQCCount.textContent = heuteQC_fixiert.length;
        heuteQCCountdurchgeführt.textContent = heuteQC_durchgeführt.length;
        heuteVGCount.textContent = heuteVG_fixiert.length;
        heuteVGCountdurchgeführt.textContent = heuteVG_durchgeführt.length;

        wocheQCCount.textContent = wocheQC_fixiert.length;
        wocheQCCountdurchgeführt.textContent = wocheQC_durchgeführt.length;
        wocheVGCount.textContent = wocheVG_fixiert.length;
        wocheVGCountdurchgeführt.textContent = wocheVG_durchgeführt.length;

        monatQCCount.textContent = monatQC_fixiert.length;
        monatQCCountdurchgeführt.textContent = monatQC_durchgeführt.length;
        monatVGCount.textContent = monatVG_fixiert.length;
        monatVGCountdurchgeführt.textContent = monatVG_durchgeführt.length;

        // Listen füllen (fixiert + durchgeführt gemischt nach Uhrzeit)
        await fillTermineSection('heuteQC', [...heuteQC_fixiert, ...heuteQC_durchgeführt]);
        await fillTermineSection('heuteVG', [...heuteVG_fixiert, ...heuteVG_durchgeführt]);
        await fillTermineSection('wocheQC', [...wocheQC_fixiert, ...wocheQC_durchgeführt]);
        await fillTermineSection('wocheVG', [...wocheVG_fixiert, ...wocheVG_durchgeführt]);
        await fillTermineSection('monatQC', [...monatQC_fixiert, ...monatQC_durchgeführt]);
        await fillTermineSection('monatVG', [...monatVG_fixiert, ...monatVG_durchgeführt]);
    }

    function filterTermineByDate(startDate, endDate) {
        return gefilterteLeads.filter(termin => {
            if (!termin.terminisiert) return false;

            const terminDatum = new Date(termin.terminisiert);
            return terminDatum >= startDate && terminDatum <= endDate;
        });
    }

    function filterTermineByStatus(termine, status) {
        return termine.filter(termin => termin.status === status);
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
            const res = await fetch('/api/user/getnameonly', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ gpnr })
            });

            if (!res.ok) {
                console.warn(`User API Fehler für GPNR ${gpnr}: ${res.status}`);
                return 'Unbekannt';
            }

            const user = await res.json();
            return user.name;
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
            const dateObj = new Date(datumString);
            return dateObj.toLocaleDateString('de-DE', {
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
            const dateObj = new Date(datumString);
            return dateObj.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error('Ungültige Uhrzeit:', datumString);
            return '';
        }
    }

    function formatDatumKurz(datum) {
        const dateObj = new Date(datum);
        return dateObj.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    window.editTermin = function (terminId) {
        console.log('Bearbeite Termin:', terminId);
        window.location.href = `/termin-bearbeiten.html?id=${terminId}`;
    };
});