import mysql from "mysql2/promise"; // Use the promise wrapper for convenience
//CONN
//region
// Create pool instead of single connection
const pool = mysql.createPool({
    host: '34.32.52.209',
    user: 'xyzzvy',
    password: 'Knecht2303',
    database: 'sol', // adjust this if the remote DB has a different name
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// No need to connect manually with pools, but let's check connection once
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to DB via pool!');
        connection.release(); // Release immediately
    } catch (err) {
        console.error('Fehler beim Verbinden mit der Datenbank:', err.message);
    }
})();
//endregion

//GETLEADS ETC
//region
// Leads holen & direkt passend formatieren
export async function getAllLeads() {
    try {
        const [results] = await pool.query("SELECT * FROM leads");
        return results.map(row => ({
            id: row.id,
            datum: row.datum,
            kampagne: row.kampagne,
            name: row.name,
            telefon: row.telefon,
            bl: row.bl,
            plz: row.plz,
            partner: row.partner,
            status: row.status,
            adresse: row.adresse
        }));
    } catch (err) {
        console.error('Fehler beim Ausführen der Abfrage:', err.message);
        throw err;
    }
}


// PARTNER Leads holen & direkt passend formatieren
export async function getLeadsByPartner(gpnr) {
    try {
        const [results] = await pool.query("SELECT * FROM leads WHERE partner = ?", [gpnr]);
        return results.map(row => ({
            id: row.id,
            datum: row.datum,
            kampagne: row.kampagne,
            name: row.name,
            telefon: row.telefon,
            bl: row.bl,
            plz: row.plz,
            partner: row.partner,
            status: row.status,
            adresse: row.adresse
        }));
    } catch (err) {
        console.error('Fehler beim Ausführen der Abfrage:', err.message);
        throw err;
    }
}
//endregion

// User Management
//region
// Userdaten rausholen
export async function getAllUsers() {
    try {
        const [results] = await pool.query(`SELECT * FROM mitarbeiter`);
        if (results.length === 0) return null;
        return results; // <-- hier das ganze Array zurückgeben
    } catch (err) {
        console.error('Fehler beim Abrufen der Nutzerinfo:', err.message);
        throw err;
    }
}

export async function getUserInfo(gpnr) {
    try {
        const [results] = await pool.query(
            `SELECT gpnr, vorname, nachname, role, telefon, email, fuehrungskraft 
             FROM mitarbeiter WHERE gpnr = ?`, [gpnr]);
        if (results.length === 0) return null;
        return results[0];
    } catch (err) {
        console.error('Fehler beim Abrufen der Nutzerinfo:', err.message);
        throw err;
    }
}
//logins &register
//region
// 🔐 Login-Check mit gpnr & Passwort
export async function LoginInfoChecker(gpnr, password) {
    try {
        const [results] = await pool.query("SELECT passwort FROM mitarbeiter WHERE gpnr = ?", [gpnr]);
        if (results.length === 0) return false;
        return results[0].passwort === password;
    } catch (err) {
        console.error('Fehler beim Ausführen der Abfrage:', err.message);
        throw err;
    }
}
// 👤 Existenz-Prüfung via gpnr
export async function checkIfUserAlreadyExists(gpnr) {
    try {
        const [results] = await pool.query("SELECT COUNT(*) AS count FROM mitarbeiter WHERE gpnr = ?", [gpnr]);
        return results[0].count > 0;
    } catch (err) {
        console.error('Fehler beim Ausführen der Abfrage:', err.message);
        throw err;
    }
}
// REGISTER
export async function registerUser(gpnr, vorname, nachname, role, telefon, email, fuehrungskraft, passwort) {
    // Await check if user already exists
    const exists = await checkIfUserAlreadyExists(gpnr);
    if (exists) {
        console.log(gpnr + " existiert bereits, kann nicht mehr angelegt werden");
        return;
    }

    try {
        const [results] = await pool.query(
            `INSERT INTO mitarbeiter 
            (gpnr, vorname, nachname, role, telefon, email, fuehrungskraft, passwort) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [gpnr, vorname, nachname, role, telefon, email, fuehrungskraft, passwort]
        );
        return gpnr; // gpnr is PK, so return it directly
    } catch (err) {
        console.error('Fehler beim Einfügen des neuen Mitarbeiters:', err.message);
        throw err;
    }
}
//endregion
//endregion


//Update Leads status
//region
export async function updateLeadsStatus(updates) {
    const updateQueries = updates.map(lead =>
        pool.query('UPDATE leads SET status = ? WHERE id = ?', [lead.status, lead.id])
    );
    await Promise.all(updateQueries);
}


//ADD Leads
function getBundeslandFromPLZ(plz) {
    if (!plz) return '';

    const plzNum = parseInt(plz, 10);
    if (isNaN(plzNum)) return '';

    if (plz.startsWith('1')) return 'Wien';
    if (plz.startsWith('2')) return 'Niederösterreich';
    if (plz.startsWith('3')) return 'Niederösterreich';
    if (plz.startsWith('4')) return 'Oberösterreich';
    if (plz.startsWith('5')) return 'Salzburg';
    if (plz.startsWith('6')) return 'Tirol';
    if (plz.startsWith('7')) return 'Vorarlberg';
    if (plz.startsWith('8')) return 'Steiermark';
    if (plz.startsWith('9')) return 'Kärnten';

    return '';
}


export async function addLead({vorname, nachname, telefon, plz, ort, strasse, kampagne = 'BK', partner = 0, status = 'offen'}) {
    const name = `${vorname} ${nachname}`.trim();
    const adresse = `${strasse}, ${plz} ${ort}`.trim();
    const datum = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const bl = ort; // oder '' wenn du es nicht brauchst

    try {
        const [result] = await pool.query(
            `INSERT INTO leads 
            (datum, kampagne, name, telefon, bl, plz, partner, status, adresse)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [datum, kampagne, name, telefon, bl, plz, partner, status, adresse]
        );

        return result.insertId;
    } catch (err) {
        console.error('❌ Fehler beim Einfügen des Leads:', err.message);
        throw err;
    }
}



//assign leads
export async function assignLeads(leadIds, beraterName) {
    if (leadIds.length === 0) return 0;

    // IDs als kommaseparierte Liste für SQL IN-Klausel
    const placeholders = leadIds.map(() => '?').join(',');

    // Query mit IN-Klausel und Update partner
    const [result] = await pool.query(
        `UPDATE leads SET partner = ? WHERE id IN (${placeholders})`,
        [beraterName, ...leadIds]
    );

    // result.affectedRows gibt die Anzahl der aktualisierten Zeilen zurück
    return result.affectedRows;
}

//endregion



// Verbindung sauber schließen
export async function end() {
    try {
        await pool.end();
        console.log('Datenbankverbindung geschlossen.');
    } catch (err) {
        console.error('Fehler beim Schließen der Verbindung:', err.message);
    }
}
