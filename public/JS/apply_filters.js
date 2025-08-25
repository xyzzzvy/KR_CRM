// DOM Referenzen
const tbody = document.getElementById('leadsTableBody');
const filterCampaign = document.getElementById('filterCampaign');
const filterPLZ = document.getElementById('filterPLZ');
const filterStatus = document.getElementById('Status');
const filterBL = document.getElementById('BL');
const applyFilterBtn = document.getElementById('applyFilter');
const remainingLeadsDisplay = document.getElementById('remainingLeads');
const saveHint = document.getElementById('saveHint');
const partnerGpnr = sessionStorage.getItem("pr");

const dateFilterSelect = document.getElementById("dateFilter");
const customStartInput = document.getElementById("customStart");
const customEndInput = document.getElementById("customEnd");

const terminisiertFilterSelect = document.getElementById("terminisiertFilter");
const customTerminStartInput = document.getElementById("customTerminStart");
const customTerminEndInput = document.getElementById("customTerminEnd");

const oben = document.getElementById('namenexplizit');

document.addEventListener('DOMContentLoaded', async () => {
    async function getUserName(gpnr) {
        try {
            const res = await fetch('/api/userdata', { credentials: 'include' });
            if (!res.ok) {
                console.warn(`User API Fehler für GPNR ${gpnr}: ${res.status}`);
                return 'Unbekannt';
            }
            const user = await res.json();

            oben.innerHTML = `Hallo, ${(user.nachname)} ${(user.vorname)} `
            return user;
        } catch (err) {
            console.error('Fehler beim Laden Username für GPNR', gpnr, err);
            return 'Unbekannt';
        }
    }

    await getUserName(partnerGpnr);
})

let leads = [];
var updatedLeads = [];

// Status, die mit Datum verknüpft sind
const statusWithDate = ["QC fixiert", "VG fixiert", "QC durchgeführt", "VG durchgeführt"];

const statusOptions = [
    "offen",
    "n.err",
    "erreicht",
    "QC fixiert",
    "VG fixiert",
    "QC durchgeführt",
    "VG durchgeführt",
    "Vg positiv erledigt",
    "Vg negativ erledigt"
];

// Aktuell ausgewählter Lead-Index für den Datepicker
let currentDateLeadIndex = null;

// Zeigt den Datepicker-Toast zum Setzen des Termins mit Uhrzeit
function showDatePickerToast(leadId, existingDateTime = "") {
    // Entferne alten Toast, falls vorhanden
    const oldToast = document.getElementById("datePickerToast");
    if (oldToast) oldToast.remove();

    // Extrahiere Datum und Uhrzeit aus existingDateTime
    const existingDate = existingDateTime ? existingDateTime.split('T')[0] : '';
    const existingTime = existingDateTime ? existingDateTime.split('T')[1].substring(0, 5) : '12:00';

    // Erstelle neuen Toast
    const toast = document.createElement('div');
    toast.id = "datePickerToast";
    toast.style.position = "fixed";
    toast.style.top = "50%";
    toast.style.left = "50%";
    toast.style.transform = "translate(-50%, -50%)";
    toast.style.background = "#fff";
    toast.style.padding = "15px 20px";
    toast.style.border = "1px solid #ccc";
    toast.style.borderRadius = "6px";
    toast.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
    toast.style.zIndex = "10001";

    toast.innerHTML = `
        <h4 style="margin-top:0;margin-bottom:10px;">Termin für Lead #${leadId} setzen</h4>
        <div style="margin-bottom:10px;">
            <label style="display:block;margin-bottom:5px;">Datum:</label>
            <input type="date" id="toastDateInput" value="${existingDate}" style="width:100%; padding:5px;">
        </div>
        <div style="margin-bottom:15px;">
            <label style="display:block;margin-bottom:5px;">Uhrzeit:</label>
            <input type="time" id="toastTimeInput" value="${existingTime}" style="width:100%; padding:5px;">
        </div>
        <div style="text-align:right;">
            <button id="toastCancelBtn">Abbrechen</button>
            <button id="toastSaveBtn" style="margin-left:5px;">Speichern</button>
        </div>
    `;
    document.body.appendChild(toast);

    const removeToast = () => {
        toast.style.animation = 'toastFadeOut 0.25s ease forwards';
        setTimeout(() => toast.remove(), 250);
    };

    document.getElementById("toastCancelBtn").addEventListener("click", () => {
        removeToast();
        currentDateLeadIndex = null;
    });

    document.getElementById("toastSaveBtn").addEventListener("click", () => {
        const dateVal = document.getElementById("toastDateInput").value;
        const timeVal = document.getElementById("toastTimeInput").value;

        if (!dateVal) {
            alert("Bitte ein Datum auswählen.");
            return;
        }

        // Kombiniere Datum und Uhrzeit zu einem ISO-String
        const dateTimeString = `${dateVal}T${timeVal}:00`;

        leads[currentDateLeadIndex].terminisiert = dateTimeString;
        const leadIdNum = leads[currentDateLeadIndex].id;
        const currentStatus = leads[currentDateLeadIndex].status;

        const idx = updatedLeads.findIndex(l => l.id === leadIdNum);
        if (idx !== -1) {
            updatedLeads[idx].terminisiert = dateTimeString;
            updatedLeads[idx].status = currentStatus;
        } else {
            updatedLeads.push({
                id: leadIdNum,
                status: currentStatus,
                terminisiert: dateTimeString
            });
        }

        if (updatedLeads.length > 0) saveHint.style.display = 'block';

        showToast(`Termin für Lead #${leadIdNum} gesetzt auf ${formatDateTime(dateTimeString)}`);
        removeToast();
        currentDateLeadIndex = null;
        applyFilter();
    });
}

// Einfacher Toast für Statusmeldungen
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '8px 16px';
    toast.style.borderRadius = '4px';
    toast.style.opacity = '0.95';
    toast.style.zIndex = '10000';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// Lädt Leads vom Server
async function fetchLeads() {
    try {
        const response = await fetch(`/api/leads/partner`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Fehler beim Laden der Leads');
        }
        leads = await response.json();
        renderLeads(leads.map((lead, index) => ({ lead, originalIndex: index })), leads.length);
        updatedLeads = [];
        saveHint.style.display = 'none';
    } catch (error) {
        console.error('Fehler beim Laden der Leads:', error);
        tbody.innerHTML = '<tr><td colspan="9">Fehler beim Laden der Leads</td></tr>';
        remainingLeadsDisplay.textContent = '0';
        saveHint.style.display = 'none';
    }
}

// Rendert die Leads in die Tabelle
function renderLeads(data, totalCount = null) {
    tbody.innerHTML = '';

    const maxToRender = 1000;
    const limitedData = data.slice(0, maxToRender);

    limitedData.forEach(({ lead, originalIndex }) => {
        const optionsHtml = statusOptions.map(status =>
            `<option value="${status}" ${lead.status === status ? 'selected' : ''}>${status}</option>`
        ).join('');

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${lead.id}</td>
          <td>${formatDate(lead.datum)}</td>
          <td>${lead.kampagne}</td>
          <td><a href="#">${lead.name.replace(/\n/g, '<br>')}<br>${lead.telefon}</a></td>
          <td>${lead.bl}</td>
          <td>
            ${lead.plz}<br>
            <small style="color: gray; font-style: italic;">${lead.adresse ? lead.adresse : ''}</small>
          </td>
          <td>${lead.partner}</td>
          <td>
            <select class="status-select" data-index="${originalIndex}">
              ${optionsHtml}
            </select>
            ${statusWithDate.includes(lead.status) ? `
                <button class="set-date-btn" data-index="${originalIndex}" title="Termin setzen" style="margin-left:5px;">
                    <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                </button>
            ` : ''}
          </td>
          <td>${lead.terminisiert ? formatDateTime(lead.terminisiert) : 'kein Termin'}</td>
        `;
        tbody.appendChild(tr);
    });

    if (totalCount !== null && totalCount > maxToRender) {
        remainingLeadsDisplay.textContent = `${totalCount} (zeige ${maxToRender})`;
    } else {
        remainingLeadsDisplay.textContent = data.length;
    }

    // Eventlistener für Status-Selects
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function () {
            const originalIndex = parseInt(this.dataset.index);
            const newStatus = this.value;

            const dateBtn = tbody.querySelector(`button.set-date-btn[data-index="${originalIndex}"]`);
            if (statusWithDate.includes(newStatus)) {
                if (!dateBtn) {
                    // Button dynamisch hinzufügen, falls noch nicht vorhanden
                    const newBtn = document.createElement('button');
                    newBtn.className = 'set-date-btn';
                    newBtn.dataset.index = originalIndex;
                    newBtn.title = "Termin setzen";
                    newBtn.style.marginLeft = "5px";
                    newBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                    `;
                    this.parentNode.appendChild(newBtn);
                    newBtn.addEventListener('click', function () {
                        currentDateLeadIndex = parseInt(this.dataset.index);
                        showDatePickerToast(leads[currentDateLeadIndex].id, leads[currentDateLeadIndex].terminisiert);
                    });
                }
            } else {
                // Button entfernen, wenn Status nicht mehr datumspflichtig ist
                if (dateBtn) dateBtn.remove();

                // terminisiert nur löschen, wenn Status NICHT in statusWithDate ist
                leads[originalIndex].terminisiert = null;
            }

            leads[originalIndex].status = newStatus;

            const leadId = leads[originalIndex].id;
            const idx = updatedLeads.findIndex(l => l.id === leadId);

            const newTerminisiert = statusWithDate.includes(newStatus) ? leads[originalIndex].terminisiert : null;

            if (idx !== -1) {
                updatedLeads[idx].status = newStatus;
                updatedLeads[idx].terminisiert = newTerminisiert;
            } else {
                updatedLeads.push({
                    id: leadId,
                    status: newStatus,
                    terminisiert: newTerminisiert
                });
            }

            if (updatedLeads.length > 0) {
                saveHint.style.display = 'block';
            }
        });
    });

    // Eventlistener für Termin setzen Buttons
    document.querySelectorAll('.set-date-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            currentDateLeadIndex = parseInt(this.dataset.index);
            showDatePickerToast(leads[currentDateLeadIndex].id, leads[currentDateLeadIndex].terminisiert);
        });
    });
}

// Filtert die Leads basierend auf Filtereingaben
function applyFilter() {
    const kampagne = filterCampaign.value;
    const plz = filterPLZ.value.trim();
    const status = filterStatus.value;
    const bl = filterBL.value;
    const nameInput = document.getElementById('nameFilter');
    const name = nameInput ? nameInput.value.trim().toLowerCase() : '';

    const dateFilter = dateFilterSelect.value;
    const customStart = customStartInput.value;
    const customEnd = customEndInput.value;

    const terminFilter = terminisiertFilterSelect.value;
    const customTerminStart = customTerminStartInput.value;
    const customTerminEnd = customTerminEndInput.value;

    let startDate = null;
    let endDate = new Date();

    // Filter für Lead-Datum
    switch (dateFilter) {
        case "24h":
            startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            break;
        case "7d":
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
        case "14d":
            startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
            break;
        case "1m":
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case "custom":
            if (!customStart || !customEnd) {
                alert("Bitte sowohl Start- als auch Enddatum angeben.");
                return;
            }
            startDate = new Date(customStart);
            endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
            break;
    }

    // Filter für Termin-Datum
    let terminStartDate = null;
    let terminEndDate = new Date();

    switch (terminFilter) {
        case "24h":
            terminStartDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            break;
        case "7d":
            terminStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
        case "14d":
            terminStartDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
            break;
        case "1m":
            terminStartDate = new Date();
            terminStartDate.setMonth(terminStartDate.getMonth() - 1);
            break;
        case "custom":
            if (!customTerminStart || !customTerminEnd) {
                alert("Bitte sowohl Start- als auch Enddatum für Termin angeben.");
                return;
            }
            terminStartDate = new Date(customTerminStart);
            terminEndDate = new Date(customTerminEnd);
            terminEndDate.setHours(23, 59, 59, 999);
            break;
    }

    const filtered = leads
        .map((lead, index) => ({ lead, originalIndex: index }))
        .filter(({ lead }) => {
            const kampagneMatch = kampagne === 'alle' || lead.kampagne === kampagne;
            const plzMatch = plz === '' || lead.plz.startsWith(plz);
            const statusMatch = status === 'alle' || lead.status === status;
            const blMatch = bl === '' || lead.bl === bl;
            const nameMatch =
                name === '' ||
                lead.name.toLowerCase().includes(name) ||
                lead.telefon.replace(/\s+/g, '').includes(name);

            // Filter für Lead-Datum
            const dateMatch = (() => {
                if (!startDate) return true;
                const leadDate = new Date(lead.datum);
                return leadDate >= startDate && leadDate <= endDate;
            })();

            // Filter für Termin-Datum
            const terminMatch = (() => {
                if (!terminStartDate) return true;
                if (!lead.terminisiert) return false;
                const terminDate = new Date(lead.terminisiert);
                return terminDate >= terminStartDate && terminDate <= terminEndDate;
            })();

            return kampagneMatch && plzMatch && statusMatch && blMatch && nameMatch && dateMatch && terminMatch;
        });

    renderLeads(filtered, filtered.length);
}

// Hilfsfunktion: Datum formatieren (dd.mm.yyyy)
function formatDate(isoString) {
    const date = new Date(isoString);
    if (isNaN(date)) return isoString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Hilfsfunktion: Datum und Uhrzeit formatieren (dd.mm.yyyy HH:mm)
function formatDateTime(isoString) {
    const date = new Date(isoString);
    if (isNaN(date)) return isoString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Zeigt oder versteckt die Eingabefelder für benutzerdefinierten Zeitraum
function toggleCustomDateInputs() {
    const selected = dateFilterSelect.value;
    const customDateInputs = document.getElementById("customDateInputs");
    if (customDateInputs) {
        customDateInputs.style.display = selected === "custom" ? "block" : "none";
    }
}

// Zeigt oder versteckt die Eingabefelder für benutzerdefinierten Termin-Zeitraum
function toggleCustomTerminDateInputs() {
    const selected = terminisiertFilterSelect.value;
    const customTerminDateInputs = document.getElementById("customTerminDateInputs");
    if (customTerminDateInputs) {
        customTerminDateInputs.style.display = selected === "custom" ? "block" : "none";
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    fetchLeads();
    applyFilter();

    applyFilterBtn.addEventListener('click', applyFilter);

    dateFilterSelect.addEventListener('change', () => {
        toggleCustomDateInputs();
    });

    terminisiertFilterSelect.addEventListener('change', () => {
        toggleCustomTerminDateInputs();
    });
});