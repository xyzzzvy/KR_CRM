//imports
//region
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

import {
    getAllLeads,
    getLeadsByPartner,
    getUserInfo,
    LoginInfoChecker,
    checkIfUserAlreadyExists,
    registerUser,
    updateLeadsStatus,
    assignLeads,
    getAllUsers,
    addLead,
    end
} from './database.js';
//endregion

//Settings raw
//region
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
//endregion

//Middelware & Settings
//region
const JWT_SECRET = "8f2c0a9b6d4f5e1a2c3b7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9";

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
//endregion

// ---API ROUTES UPDATE---
//region
app.post('/api/leads/update', authenticateToken, async (req, res) => {
    const updates = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'Keine Änderungen übermittelt' });
    }

    try {
        await updateLeadsStatus(updates);
        res.json({ success: true, updatedCount: updates.length });
    } catch (err) {
        console.error('Datenbankfehler beim Update:', err.message);
        res.status(500).json({ error: 'Fehler beim Aktualisieren der Leads' });
    }
});



//asing leads
app.post('/assign-leads', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { leadIds, partner } = req.body;
        let partner1=Number.parseInt(partner);
        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'Keine Lead-IDs angegeben' });
        }
        if (!partner1 || typeof partner1 !== 'number') {
            return res.status(400).json({ error: 'Kein gültiger Partner (Berater-ID)' });
        }

        const modifiedCount = await assignLeads(leadIds, partner);

        res.json({ success: true, assignedCount: modifiedCount });
    } catch (error) {
        console.error('Fehler bei Lead-Zuweisung:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

//endregion

//register
//region
app.post('/api/register', async (req, res) => {
    try {
        const { gpnr, vorname, nachname, role, telefon, email, fuehrungskraft, passwort } = req.body;

        if (!gpnr || !vorname || !nachname || !role || !telefon || !email || !passwort) {
            return res.status(400).json({ error: 'Alle Pflichtfelder müssen ausgefüllt werden' });
        }

        const exists = await checkIfUserAlreadyExists(gpnr);
        if (exists) {
            return res.status(409).json({ error: 'User existiert bereits' });
        }

        await registerUser(gpnr, vorname, nachname, role, telefon, email, fuehrungskraft, passwort);
        res.status(201).json({ success: true, gpnr });
    } catch (err) {
        console.error('Fehler bei der Registrierung:', err.message);
        res.status(500).json({ error: 'Fehler bei der Registrierung' });
    }
});
//endregion

//TOKENS
//region
// JWT Middleware - liest Token aus Header oder Cookie
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.split(' ')[1];
    const tokenFromCookie = req.cookies.jwt;
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) return res.status(401).json({ error: 'Token fehlt' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token ungültig' });
        req.user = user; // user enthält gpnr und role
        next();
    });
}

function authorizeAdmin(req, res, next) {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Nur für Admins erlaubt' });
    }
    next();
}
//endregion

// --- API ROUTES ---
//region
app.get('/api/leads', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const leads = await getAllLeads();
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: 'Fehler beim Laden der Leads' });
    }
});

//alle user
app.get('/api/users', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const users = await getAllUsers();
        if (!users) {
            return res.status(404).json({ error: 'Keine Nutzer gefunden' });
        }
        res.json(users);
    } catch (err) {
        console.error('Fehler beim Laden der Nutzer:', err);
        res.status(500).json({ error: 'Fehler beim Laden der Nutzer' });
    }
});

app.get('/api/leads/partner/:partner', authenticateToken, async (req, res) => {
    try {
        const partner = req.params.partner;
        const leads = await getLeadsByPartner(partner);
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: 'Fehler beim Laden der Partner-Leads' });
    }
});

app.get('/api/user/:gpnr', authenticateToken, async (req, res) => {
    try {
        const gpnr = req.params.gpnr;
        if (req.user.gpnr !== gpnr && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Zugriff verweigert' });
        }
        const user = await getUserInfo(gpnr);
        if (!user) return res.status(404).json({ error: 'User nicht gefunden' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Userdaten' });
    }
});

// Login: setzt JWT als HttpOnly-Cookie
app.post('/api/login', async (req, res) => {
    try {
        const { gpnr, password } = req.body;
        if (!gpnr || !password) return res.status(400).json({ error: 'gpnr und password benötigt' });

        const valid = await LoginInfoChecker(gpnr, password);
        if (!valid) return res.status(401).json({ success: false, error: 'Ungültige Login-Daten' });

        const user = await getUserInfo(gpnr);
        if (!user) return res.status(404).json({ error: 'User nicht gefunden' });

        const payload = { gpnr: user.gpnr, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 2 * 60 * 60 * 1000 // 2 Stunden
        });

        res.json({ success: true, role: user.role });
    } catch (err) {
        res.status(500).json({ error: 'Fehler beim Login-Check' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { gpnr, vorname, nachname, role, telefon, email, fuehrungskraft, passwort } = req.body;
        if (!gpnr || !vorname || !nachname || !role || !telefon || !email || !fuehrungskraft || !passwort) {
            return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
        }

        const exists = await checkIfUserAlreadyExists(gpnr);
        if (exists) {
            return res.status(409).json({ error: 'User existiert bereits' });
        }

        await registerUser(gpnr, vorname, nachname, role, telefon, email, fuehrungskraft, passwort);
        res.status(201).json({ success: true, gpnr });
    } catch (err) {
        res.status(500).json({ error: 'Fehler bei der Registrierung' });
    }
});
//endregion

// Static routes
//region
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/HTML/indexpage.html'));
});

app.use('/Admin', authenticateToken, authorizeAdmin, express.static(path.join(__dirname, '../Admin')));
app.use('/html', express.static(path.join(__dirname, '../public/HTML')));
app.use('/Anmelden', express.static(path.join(__dirname, '../Anmelden')));

// Requestpage liefert basierend auf Token die Weiterleitungs-URL
app.get('/requestpage', authenticateToken, (req, res) => {
    if (req.user.role === 'Admin') {
        res.json({ page: '/Admin/AdminPanel.html' });
    } else {
        res.json({ page: '/html/User.html' });
    }
});

app.get("/anmelden", async (req, res) => {
    const gpnr = req.query.gpnr;

    if (!gpnr) {
        return res.sendFile(path.join(__dirname, '../Anmelden/Anmelden.html'));
    }

    try {
        const user = await getUserInfo(gpnr);

        if (user) {
            // User gefunden → HTML ausliefern (oder andere Logik)
            return res.sendFile(path.join(__dirname, '../Anmelden/Anmelden.html'));
        } else {
            // User nicht gefunden → 404 zurückgeben
            return res.status(404).send('Benutzer nicht gefunden');
        }
    } catch (err) {
        console.error('Fehler bei /anmelden:', err);
        return res.status(500).send('Serverfehler');
    }
});

//endregion


// ---API ADD LEADS---
//region
// Neuen Lead anlegen
// PLZ-Anfangsziffer zu Bundesland-Kürzel
const plzToBl = {
    "1": "W",    // Wien
    "2": "NÖ",   // Niederösterreich
    "3": "NÖ",   // Niederösterreich
    "4": "OÖ",   // Oberösterreich
    "5": "S",    // Salzburg
    "6": "T",    // Tirol
    "7": "V",    // Vorarlberg
    "8": "ST",   // Steiermark
    "9": "K"     // Kärnten
};

app.post('/api/leads/add', async (req, res) => {
    try {
        let {
            vorname,
            nachname,
            telefon,
            plz,
            ort,
            strasse,
            kampagne,
            partner,
            status
        } = req.body;

        // Pflichtfelder prüfen
        if (!vorname || !nachname || !telefon || !plz || !strasse) {
            return res.status(400).json({ error: 'Pflichtfelder fehlen' });
        }

        strasse+=" "+ort;


        // PLZ auf 4 Stellen formatieren
        const plzStr = String(plz).padStart(4, "0");

        // Ort durch BL ersetzen
        let bl= plzToBl[plzStr.charAt(0)] || "unbekannt";

        // Telefonnummer bereinigen
        const cleanTelefon = String(telefon).replace(/[^\d+]/g, '') || "0";

        const leadId = await addLead({
            vorname,
            nachname,
            telefon: cleanTelefon,
            plz: plzStr,
            ort:bl, // <- hier steht nun das Bundesland
            strasse,
            kampagne: kampagne || "BK",
            partner: partner || 0,
            status: status || "offen"
        });

        res.status(201).json({ success: true, leadId });
    } catch (err) {
        console.error('❌ Fehler beim Anlegen des Leads:', err.message);
        res.status(500).json({ error: 'Lead konnte nicht angelegt werden' });
    }
});

//endregion



// Server starten
app.listen(port, '0.0.0.0', () => {
    console.log(`Server läuft auf Port ${port}`);
});

// Sicherer Shutdown
process.on('SIGINT', async () => {
    console.log("Server wird beendet...");
    await end();
    process.exit(0);
});
