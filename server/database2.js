import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: '34.51.205.183',
    user: 'xyzzvy',
    password: 'Knecht2303!',
    database: 'sol',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
});


(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to DB via pool!');
        connection.release(); // Release immediately
    } catch (err) {
        console.error('Fehler beim Verbinden mit der Datenbank:', err.message);
    }
})();

//#region Leads

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
            adresse: row.adresse,
            terminisiert: row.terminisiert  // NEU: terminierte Spalte mitliefern
        }));
    } catch (err) {
        console.error('Fehler beim Abrufen der Leads:', err.message);
        throw err;
    }
}

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
            adresse: row.adresse,
            terminisiert: row.terminisiert  // NEU: terminierte Spalte mitliefern
        }));
    } catch (err) {
        console.error('Fehler beim Abrufen der Leads nach Partner:', err.message);
        throw err;
    }
}

async function toISODateTime(dateString) {
    // Erwartetes Format: DD.MM.YYYY, HH:MM:SS
    if (!dateString) return null;

    const [datePart, timePart] = dateString.split(', ');
    const [day, month, year] = datePart.split('.');
    const [hours, minutes, seconds] = timePart.split(':');

    const pad = n => n.toString().padStart(2, '0');

    return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export async function addLead({ vorname, nachname, telefon, plz, ort, strasse, kampagne = 'BK', partner = null, status = 'offen', terminisiert = null }) {
    const name = `${vorname} ${nachname}`.trim();
    const adresse = `${strasse}, ${plz} ${ort}`.trim();
    const datum = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const bl = getBundeslandFromPLZ(plz);

    const fixeddate=await toISODateTime(terminisiert);

    try {
        const [result] = await pool.query(
            `INSERT INTO leads 
            (datum, kampagne, name, telefon, bl, plz, partner, status, adresse, terminisiert)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [datum, kampagne, name, telefon, bl, plz, partner, status, adresse, fixeddate]
        );
        return result.insertId;
    } catch (err) {
        console.error('Fehler beim Einfügen des Leads:', err.message);
        throw err;
    }
}

// Hilfsfunktion Bundesland ermitteln (vereinfachte Version)
function getBundeslandFromPLZ(plz) {
    if (!plz) return '';
    if (plz.startsWith('1')) return 'W';                    // Wien
    if (plz.startsWith('2') || plz.startsWith('3')) return 'NÖ';  // Niederösterreich
    if (plz.startsWith('4')) return 'OÖ';                   // Oberösterreich
    if (plz.startsWith('5')) return 'S';                    // Salzburg
    if (plz.startsWith('6')) return 'T';                    // Tirol
    if (plz.startsWith('68') || plz.startsWith('69')) return 'V'; // Vorarlberg
    if (plz.startsWith('7')) return 'B';                    // Burgenland
    if (plz.startsWith('8')) return 'ST';                   // Steiermark
    if (plz.startsWith('9')) return 'K';                    // Kärnten
    return '';
}

export async function updateLeadsStatus(updates) {
    try {
        const updateQueries = updates.map(({ id, status, terminisiert }) => {
            if (terminisiert !== undefined) {
                return pool.query(
                    'UPDATE leads SET status = ?, terminisiert = ? WHERE id = ?',
                    [status, terminisiert, id]
                );
            } else {
                return pool.query(
                    'UPDATE leads SET status = ? WHERE id = ?',
                    [status, id]
                );
            }
        });
        await Promise.all(updateQueries);
    } catch (err) {
        console.error('Fehler beim Aktualisieren des Lead-Status:', err.message);
        throw err;
    }
}

export async function getLeadsByPartnerNext8DaysQC(gpnr) {
    try {
        const [results] = await pool.query(
            `SELECT * FROM leads
             WHERE partner = ?
               AND terminisiert >= NOW()
               AND terminisiert < DATE_ADD(NOW(), INTERVAL 8 DAY)
               AND status LIKE 'QC fixiert'
             ORDER BY datum ASC`,
            [gpnr]
        );

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
        console.error('Fehler beim Abrufen der Leads der nächsten 8 Tage:', err.message);
        throw err;
    }
}
export async function getLeadsByPartnerNext8DaysVG(gpnr) {
    try {
        const [results] = await pool.query(
            `SELECT * FROM leads
             WHERE partner = ?
               AND terminisiert >= NOW()
               AND terminisiert < DATE_ADD(NOW(), INTERVAL 8 DAY)
               AND status LIKE 'VG fixiert'
             ORDER BY datum ASC`,
            [gpnr]
        );

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
        console.error('Fehler beim Abrufen der Leads der nächsten 8 Tage:', err.message);
        throw err;
    }
}

export async function assignLeads(leadIds, gpnr) {
    if (!leadIds.length) return 0;
    const placeholders = leadIds.map(() => '?').join(',');
    try {
        const [result] = await pool.query(
            `UPDATE leads SET partner = ? WHERE id IN (${placeholders})`,
            [gpnr, ...leadIds]
        );
        return result.affectedRows;
    } catch (err) {
        console.error('Fehler beim Zuweisen der Leads:', err.message);
        throw err;
    }
}

//#endregion

//#region Mitarbeiter (Users)

export async function getAllUsers() {
    try {
        const [results] = await pool.query("SELECT gpnr, vorname, nachname, role, telefon, email, fuehrungskraft FROM mitarbeiter");
        return results.length ? results : null;
    } catch (err) {
        console.error('Fehler beim Abrufen der Mitarbeiter:', err.message);
        throw err;
    }
}

export async function getUserInfo(gpnr) {
    try {
        const [results] = await pool.query(
            "SELECT gpnr, vorname, nachname, role, telefon, email, fuehrungskraft FROM mitarbeiter WHERE gpnr = ?",
            [gpnr]
        );
        return results.length ? results[0] : null;
    } catch (err) {
        console.error('Fehler beim Abrufen der Mitarbeiter-Info:', err.message);
        throw err;
    }
}

export async function getAllUntergebene(fkGpnr) {
    const sql = `
        WITH RECURSIVE Untergebene AS (
            SELECT gpnr, vorname, nachname, role, telefon, email, fuehrungskraft
            FROM mitarbeiter
            WHERE fuehrungskraft = ?

            UNION ALL

            SELECT m.gpnr, m.vorname, m.nachname, m.role, m.telefon, m.email, m.fuehrungskraft
            FROM mitarbeiter m
            INNER JOIN Untergebene u ON m.fuehrungskraft = u.gpnr
        )
        SELECT * FROM Untergebene;
    `;
    try {
        const [results] = await pool.query(sql, [fkGpnr]);
        return results;
    } catch (err) {
        console.error('Fehler beim Abrufen der Untergebenen:', err.message);
        throw err;
    }
}

//#endregion

//#region Kampagnen

export async function getAllKampagnes() {
    try {
        const [results] = await pool.query("SELECT * FROM kamp");
        return results.length ? results : null;
    } catch (err) {
        console.error('Fehler beim Abrufen der Kampagnen:', err.message);
        throw err;
    }
}

//#endregion

//#region Lead Orders

export async function getAllLeadOrders() {
    try {
        const [rows] = await pool.query(`
            SELECT id, gpnr, anzahl, bl, plzrange, kampagne, note, status, created_at
            FROM lead_orders
            ORDER BY created_at DESC
        `);
        return rows;
    } catch (err) {
        console.error('Fehler beim Abrufen der lead_orders:', err.message);
        throw err;
    }
}

export async function getAllLeadOrdersBy(gpnr = null) {
    try {
        let query = `
            SELECT id, gpnr, anzahl, bl, plzrange, kampagne, note, status, created_at
            FROM lead_orders
        `;
        const params = [];

        if (gpnr !== null) {
            query += ` WHERE gpnr = ?`;
            params.push(gpnr);
        }

        query += ` ORDER BY created_at DESC`;

        const [rows] = await pool.query(query, params);
        return rows;
    } catch (err) {
        console.error('Fehler beim Abrufen der lead_orders:', err.message);
        throw err;
    }
}


export async function insertLeadOrder({ gpnr, anzahl, bl, plzrange, kampagne, note = '', status = 'offen' }) {
    try {
        const [result] = await pool.query(
            `INSERT INTO lead_orders (gpnr, anzahl, bl, plzrange, kampagne, note, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [gpnr, anzahl, bl, plzrange, kampagne, note, status]
        );
        return { success: true, insertId: result.insertId };
    } catch (err) {
        console.error('Fehler beim Einfügen in lead_orders:', err.message);
        return { success: false, error: err };
    }
}

export async function updateOrderStatus(id, newStatus) {
    try {
        const [result] = await pool.query("UPDATE lead_orders SET status = ? WHERE id = ?", [newStatus, id]);
        return result.affectedRows === 1;
    } catch (err) {
        console.error('Fehler beim Aktualisieren des Order-Status:', err.message);
        throw err;
    }
}

//#endregion

//#region Login & Registration

export async function LoginInfoChecker(gpnr, password) {
    try {
        const [results] = await pool.query("SELECT passwort FROM mitarbeiter WHERE gpnr = ?", [gpnr]);
        if (!results.length) return false;
        return results[0].passwort === password;
    } catch (err) {
        console.error('Fehler beim Login-Check:', err.message);
        throw err;
    }
}

export async function checkIfUserAlreadyExists(gpnr) {
    try {
        const [results] = await pool.query("SELECT COUNT(*) AS count FROM mitarbeiter WHERE gpnr = ?", [gpnr]);
        return results[0].count > 0;
    } catch (err) {
        console.error('Fehler bei Benutzerprüfung:', err.message);
        throw err;
    }
}

export async function registerUser(gpnr, vorname, nachname, role, telefon, email, fuehrungskraft, passwort) {
    const exists = await checkIfUserAlreadyExists(gpnr);
    if (exists) {
        console.log(`Benutzer mit gpnr ${gpnr} existiert bereits.`);
        return null;
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO mitarbeiter (gpnr, vorname, nachname, role, telefon, email, fuehrungskraft, passwort)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [gpnr, vorname, nachname, role, telefon, email, fuehrungskraft, passwort]
        );
        return gpnr;
    } catch (err) {
        console.error('Fehler beim Registrieren des Benutzers:', err.message);
        throw err;
    }
}

//#endregion

//#region Verbindung sauber schließen

export async function end() {
    try {
        await pool.end();
        console.log('Datenbankverbindung geschlossen.');
    } catch (err) {
        console.error('Fehler beim Schließen der Verbindung:', err.message);
    }
}

//#endregion
