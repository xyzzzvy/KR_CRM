document.addEventListener('DOMContentLoaded', function () {
    const tageInput = document.getElementById('tageFilter');
    const tageApply = document.getElementById('tageApply');

    // Counter Elemente
    const tageQCCount = document.getElementById('tageQCCount');
    const tageQCCountdurchgeführt = document.getElementById('tageQCCountdurchgeführt');
    const tageVGCount = document.getElementById('tageVGCount');
    const tageVGCountdurchgeführt = document.getElementById('tageVGCountdurchgeführt');

    tageApply.addEventListener('click', function (e) {
        e.preventDefault();
        const tage = parseInt(tageInput.value);
        if (!tage || tage <= 0) {
            alert("Bitte eine gültige Anzahl an Tagen eingeben!");
            return;
        }
        updateTageAnzeige(tage);
    });

    function updateTageAnzeige(tage) {
        if (!window.gefilterteLeads || window.gefilterteLeads.length === 0) {
            console.warn("Keine Leads vorhanden");
            alert("Keine Daten vorhanden. Bitte zuerst die Hauptfilter anwenden.");
            return;
        }

        const jetzt = new Date();
        const startDatum = new Date();
        startDatum.setDate(startDatum.getDate() - tage);
        startDatum.setHours(0, 0, 0, 0); // Auf Tagesanfang setzen

        const termine = window.gefilterteLeads.filter(lead => {
            if (!lead.terminisiert) return false;

            const terminDatum = new Date(lead.terminisiert);
            return terminDatum >= startDatum && terminDatum <= jetzt;
        });

        // Status filtern
        const qcFixiert = termine.filter(t => t.status === "QC fixiert");
        const qcDurchgeführt = termine.filter(t => t.status === "QC durchgeführt");
        const vgFixiert = termine.filter(t => t.status === "VG fixiert");
        const vgDurchgeführt = termine.filter(t => t.status === "VG durchgeführt");

        // Zähler setzen
        tageQCCount.textContent = qcFixiert.length;
        tageQCCountdurchgeführt.textContent = qcDurchgeführt.length;
        tageVGCount.textContent = vgFixiert.length;
        tageVGCountdurchgeführt.textContent = vgDurchgeführt.length;

        console.log(`Tage-Filter: ${tage} Tage, ${termine.length} Termine gefunden`);
    }
});