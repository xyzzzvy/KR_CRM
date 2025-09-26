//imports
//region
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import fs from 'fs';
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
    getAllKampagnes,
    insertLeadOrder,
    getAllLeadOrders,
    updateOrderStatus,
    getAllUntergebene,
    getAllLeadOrdersBy,
    end
} from './database2.js';


import {
     StartWebSocket, StopWebSocket
} from './websocket2.js';

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
        let partner1 = Number.parseInt(partner);

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'Keine Lead-IDs angegeben' });
        }
        if (!partner1 || typeof partner1 !== 'number') {
            return res.status(400).json({ error: 'Kein gültiger Partner (Berater-ID)' });
        }

        const modifiedCount = await assignLeads(leadIds, partner);

        // Loggen der Zuweisung
        const logMessage = `${new Date().toISOString()} - ${modifiedCount} Leads wurden an Partner ${partner1} zugewiesen.\n`;
        const logFilePath = path.join(__dirname, 'log.txt');
        fs.appendFile(logFilePath, logMessage, (err) => {
            if (err) {
                console.error('Fehler beim Schreiben in die Log-Datei:', err.message);
            }
        });

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

// Route, um User-Daten basierend auf dem eingeloggten User (gpnr) zurückzugeben
app.get('/api/userdata', authenticateToken, async (req, res) => {
    try {
        const gpnr = req.user.gpnr; // aus JWT
        const user = await getUserInfo(gpnr);
        if (!user) {
            return res.status(404).json({ error: 'User nicht gefunden' });
        }
        res.json(user);
    } catch (err) {
        console.error('Fehler beim Abrufen der Userdaten:', err);
        res.status(500).json({ error: 'Serverfehler' });
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

app.get('/api/kamps', authenticateToken, async (req, res) => {
    try {
        const users = await getAllKampagnes();
        if (!users) {
            return res.status(404).json({ error: 'Keine Nutzer gefunden' });
        }
        res.json(users);
    } catch (err) {
        console.error('Fehler beim Laden der Nutzer:', err);
        res.status(500).json({ error: 'Fehler beim Laden der Nutzer' });
    }
});


app.get('/api/leads/partner', authenticateToken, async (req, res) => {
    try {
        const gpnr = req.user.gpnr; // aus JWT
        if(!gpnr){
            res.status(403).json({ error: 'Zugriff verweigert' });
        }

        const leads = await getLeadsByPartner(gpnr);
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: 'Fehler beim Laden der Partner-Leads' });
    }
});


app.get('/api/leads/partnerFK/:partner', authenticateToken, async (req, res) => {
    try {
        const partner = req.params.partner;
        const FK = req.user.gpnr; // aus JWT

        const untergebene = await getAllUntergebene(FK); // z.B. [ { gpnr: '1234' }, { gpnr: '5678' } ]

        const gpnrList = untergebene.map(user => String(user.gpnr));

        if (gpnrList.includes(String(partner))) {
            const leads = await getLeadsByPartner(partner);
            res.json(leads);
        } else {
            res.status(403).json({ error: 'Zugriff verweigert' });
        }
    } catch (err) {
        console.error('Fehler beim Abrufen der Leads nach Partner:', err.message);
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


// Wichtig: führenden / nicht vergessen!
app.post('/api/user/getnameonly', authenticateToken ,async (req, res) => {
    try {
        const { gpnr } = req.body;   // <-- jetzt aus body
        if (!gpnr) {
            return res.status(400).json({ error: 'GPNR fehlt' });
        }

        const user = await getUserInfo(gpnr);
        if (!user) {
            return res.status(404).json({ error: 'User nicht gefunden' });
        }
        const name = `${user.nachname} ${user.vorname}`;
        res.json({ name });
    } catch (err) {
        console.error('Fehler beim Abrufen der Userdaten:', err);
        res.status(500).json({ error: 'Fehler beim Abrufen der Userdaten' });
    }
});



// Login: setzt JWT als HttpOnly-Cookie
app.post('/api/login', async (req, res) => {
    try {

        const { gpnr, password } = req.body;
        const user1 = await getUserInfo(gpnr);
        if (!user1) {
            return res.status(404).json({ error: 'User nicht gefunden' });
        }
        const name1 = `${user1.nachname} ${user1.vorname}`;
        let logMessage = `${new Date().toISOString()} - User ${gpnr} ${name1} hat sich probiert einzuloggen.\n`;
        let logFilePath = path.join(__dirname, 'loglogin.txt');
        fs.appendFile(logFilePath, logMessage, (err) => {
            if (err) {
                console.error('Fehler beim Schreiben in die Log-Datei:', err.message);
            }
        });

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

        // Loggen des Login-Vorgangs
         logMessage = `${new Date().toISOString()} - User ${gpnr} (${user.role}) hat sich eingeloggt.\n`;
         logFilePath = path.join(__dirname, 'loglogin.txt');
        fs.appendFile(logFilePath, logMessage, (err) => {
            if (err) {
                console.error('Fehler beim Schreiben in die Log-Datei:', err.message);
            }
        });

        res.json({ success: true, role: user.role });
    } catch (err) {
        res.status(500).json({ error: 'Fehler beim Login-Check' });
    }
});

app.post('/api/register', authenticateToken,async (req, res) => {
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
        res.json({ page: '/Admin/HTML/AdminPanel.html' });
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

        //ok
        strasse+=""+" "+ort;


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

app.post('/api/leads/addnew', authenticateToken,async (req, res) => {
    try {


        let {
            vorname,
            nachname,
            telefon,
            plz,
            ort,
            strasse,
            kampagne,
            user,
            status
        } = req.body;



        //ok
        strasse+=""+" "+ort;
        const nutzer=req.user.gpnr;

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
            kampagne: "Empfehlung",
            partner: nutzer || 0,
            status: status || "offen"
        });

        res.status(201).json({ success: true, leadId });
    } catch (err) {
        console.error('❌ Fehler beim Anlegen des Leads:', err.message);
        res.status(500).json({ error: 'Lead konnte nicht angelegt werden' });
    }
});

app.post('/api/leads/addnewTerminisiert', authenticateToken,async (req, res) => {
    try {


        let {
            vorname,
            nachname,
            telefon,
            plz,
            ort,
            strasse,
            kampagne,
            user,
            status,
            terminisiert
        } = req.body;



        //ok
        strasse+=""+" "+ort;
        const nutzer=req.user.gpnr;

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
            kampagne: "Empfehlung",
            partner: nutzer || 0,
            status: status || "offen",
            terminisiert: terminisiert || null
        });

        res.status(201).json({ success: true, leadId });
    } catch (err) {
        console.error('❌ Fehler beim Anlegen des Leads:', err.message);
        res.status(500).json({ error: 'Lead konnte nicht angelegt werden' });
    }
});
//endregion

//-- ORDER--
//region

app.get('/api/leadorders', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const orders = await getAllLeadOrders();
        res.json(orders);
    } catch (err) {
        console.error('Fehler beim Laden der Bestellungen:', err);
        res.status(500).json({ error: 'Fehler beim Laden der Bestellungen' });
    }
});

app.get('/api/leadordersByGp', authenticateToken, async (req, res) => {
    try {
        const gp=req.user.gpnr;
        const orders = await getAllLeadOrdersBy(gp);
        res.json(orders);
    } catch (err) {
        console.error('Fehler beim Laden der Bestellungen:', err);
        res.status(500).json({ error: 'Fehler beim Laden der Bestellungen' });
    }
});

app.patch('/orders/:id', async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status fehlt' });
    }

    try {
        const success = await updateOrderStatus(id, status);
        if (!success) {
            return res.status(404).json({ error: 'Bestellung nicht gefunden' });
        }
        res.json({ message: 'Status erfolgreich aktualisiert' });
    } catch (err) {
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});



app.post('/api/leads/order', async (req, res) => {
    const { gpnr, anzahl, bundesland: bl, plzRange: plzrange, kampagne, note } = req.body;

    if (!gpnr || !anzahl || !bl || !plzrange || !kampagne) {
        return res.status(400).json({ error: 'Fehlende Felder' });
    }

    const result = await insertLeadOrder({ gpnr, anzahl, bl, plzrange, kampagne, note });

    if (result.success) {
        res.status(201).json({ message: 'Bestellung erfolgreich', insertId: result.insertId });
    } else {
        res.status(500).json({ error: 'Fehler beim Einfügen', details: result.error });
    }
});

//endregion


//-- Mitarbeiter--
//region
// API: Alle Nutzer zurückgeben, wenn gpnr Admin ist oder gleiche gpnr angefragt wird
app.get('/api/users/by-gpnr', authenticateToken, async (req, res) => {
    try {
        const requester = req.user; // kommt aus dem JWT (z.B. { gpnr, role })

        if (!requester || !requester.gpnr) {
            return res.status(401).json({ error: 'Ungültiger Token oder Benutzer nicht authentifiziert' });
        }

        const gpnr = requester.gpnr;

        // Admins dürfen alles sehen, andere nur ihre eigenen Untergebenen
        if (requester.role !== 'Admin' && req.query.gpnr && req.query.gpnr !== String(gpnr)) {
            return res.status(403).json({ error: 'Zugriff verweigert' });
        }

        const untergebene = await getAllUntergebene(gpnr);

        if (!untergebene || untergebene.length === 0) {
            return res.status(404).json({ error: 'Keine Untergebenen gefunden' });
        }

        res.json(untergebene);
    } catch (err) {
        console.error('Fehler beim Laden der Untergebenen:', err.message);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

//endregion


//--- WEBSOCKET---
//#region
app.post('/api/websocket/erstellen',authenticateToken, authorizeAdmin, async (req, res) => {
    try{
        const requester = req.user;

        if (!requester || !requester.gpnr) {
            return res.status(401).json({ error: 'Ungültiger Token oder Benutzer nicht authentifiziert' });
        }

        if (requester.role !== 'Admin') {
            return res.status(403).json({ error: 'Zugriff verweigert' });
        }
        await StartWebSocket();

        res.json({success:true, message:'Websocket erstellt'});

    }
    catch (err){
        console.error('Fehler beim Erstellen des Websockets:', err.message);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
})


app.post('/api/websocket/stoppen',authenticateToken, authorizeAdmin, async (req, res) => {
    try{
        const requester = req.user;

        if (!requester || !requester.gpnr) {
            return res.status(401).json({ error: 'Ungültiger Token oder Benutzer nicht authentifiziert' });
        }

        if (requester.role !== 'Admin') {
            return res.status(403).json({ error: 'Zugriff verweigert' });
        }
        await StopWebSocket();

        res.json({success:true, message:'Websocket geschlossen'});

    }
    catch (err){
        console.error('Fehler beim Erstellen des Websockets:', err.message);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
})

app.get('/api/websocket/credits',authenticateToken, async (req, res) => {
    try{
        const requester = req.user; // kommt aus dem JWT (z.B. { gpnr, role })

        if (!requester || !requester.gpnr) {
            return res.status(401).json({ error: 'Ungültiger Token oder Benutzer nicht authentifiziert' });
        }
        const user = await getUserInfo(requester.gpnr);
        const name = `${user.nachname} ${user.vorname}`;

        res.json({success:true, gpnr:requester.gpnr,name:name});

    }
    catch (err){
        console.error('Fehler beim Abfragen der Credits:', err.message);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
})
//#endregion





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
