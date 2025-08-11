-- Mitarbeiter-Tabelle
DROP DATABASE IF EXISTS sol;
CREATE DATABASE sol;
USE sol;


CREATE TABLE mitarbeiter (
                             gpnr INT PRIMARY KEY,
                             vorname VARCHAR(100) NOT NULL,
                             nachname VARCHAR(100) NOT NULL,
                             role VARCHAR(100) NOT NULL,
                             telefon VARCHAR(50),
                             email VARCHAR(150) UNIQUE,
                             fuehrungskraft INT,
                             passwort VARCHAR(255) NOT NULL,
                             FOREIGN KEY (fuehrungskraft) REFERENCES mitarbeiter(gpnr)
);

CREATE INDEX idx_mitarbeiter_fuehrungskraft ON mitarbeiter(fuehrungskraft);


-- Lead Orders-Tabelle
CREATE TABLE lead_orders (
                             id INT AUTO_INCREMENT PRIMARY KEY,
                             gpnr INT NOT NULL,
                             anzahl INT NOT NULL,
                             bl VARCHAR(100) NOT NULL,
                             plzrange VARCHAR(9) NOT NULL,
                             kampagne VARCHAR(255) NOT NULL,
                             note TEXT,
                             status VARCHAR(50) NOT NULL DEFAULT 'offen',
                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                             FOREIGN KEY (gpnr) REFERENCES mitarbeiter(gpnr)
);

CREATE INDEX idx_lead_orders_gpnr ON lead_orders(gpnr);
CREATE INDEX idx_lead_orders_kampagne ON lead_orders(kampagne);


-- Kampagnen-Tabelle
CREATE TABLE kamp (
                      nr INT AUTO_INCREMENT PRIMARY KEY,
                      name VARCHAR(100) NOT NULL UNIQUE
);


-- Leads-Tabelle
CREATE TABLE leads (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       datum DATE NOT NULL,
                       kampagne VARCHAR(100),
                       name VARCHAR(255),
                       telefon VARCHAR(50),
                       bl VARCHAR(10),
                       plz VARCHAR(10),
                       partner INT,
                       status VARCHAR(50),
                       adresse VARCHAR(255),
                       FOREIGN KEY (partner) REFERENCES mitarbeiter(gpnr),
                       FOREIGN KEY (kampagne) REFERENCES kamp(name)
);

CREATE INDEX idx_leads_partner ON leads(partner);
CREATE INDEX idx_leads_kampagne ON leads(kampagne);


-- INSERTs für Kampagnen
INSERT INTO kamp(name)
VALUES
    ('BK'),
    ('Flughafen'),
    ('BK-KR'),
    ('BK-Niklas'),
    ('BK-Marvin'),
    ('SK'),
    ('BK-Nina');


-- INSERTs für Mitarbeiter
INSERT INTO mitarbeiter (gpnr, vorname, nachname, role, telefon, email, fuehrungskraft, passwort) VALUES
                                                                                                      (0,'System','SYSTEM','Admin','+4300','nomail@gmai.com',null,'ASDFGHJKLÄASDASD!§§S:DS!§=1231232SDQDADASrestrdzufjdghstrzehdgDA0'),
                                                                                                      (62804, 'Hashim', 'Soliman', 'Admin', '+4369911122233', 'hashim.soliman@example.com', 0, '1'),
                                                                                                      (1002, 'Sabine', 'Huber', 'Berater', '+436641234567', 'sabine.huber@example.com', 62804, '1');



-- INSERTs für Lead Orders
INSERT INTO lead_orders (gpnr, anzahl, bl, plzrange, kampagne, note, status, created_at) VALUES
                                                                                             (1002, 10, 'Niederösterreich', '1220-1220', 'BK', 'Te', 'offen', '2025-08-04 17:03:31'),
                                                                                             (1002, 5, 'Wien', '1010-1010', 'BK', 'Eilige Lieferung', 'offen', '2025-07-15 09:45:00'),
                                                                                             (1002, 20, 'Oberösterreich', '4020-4030', 'BK', NULL, 'offen', '2025-06-20 14:30:00'),
                                                                                             (1002, 15, 'Steiermark', '8010-8010', 'BK', 'offen', 'offen', '2025-08-01 12:00:00'),
                                                                                             (1002, 8, 'Salzburg', '5020-5020', 'BK', NULL, 'offen', '2025-05-10 10:15:00');


-- INSERTs für Leads
INSERT INTO leads (datum, kampagne, name, telefon, bl, plz, partner, status, adresse) VALUES
                                                                                          ('2025-07-19', 'BK', 'Anna Schmidt', '+436771234567', 'W', '1020', 1002, 'offen', 'Graben 1, 1020 Wien'),
                                                                                          ('2025-07-20', 'BK', 'Max Mustermann', '+43676111222', 'NÖ', '3100', 1002, 'offen', 'Hauptstraße 12, 3100 St. Pölten'),
                                                                                          ('2025-07-21', 'BK', 'Julia Schwarz', '+436651234567', 'OÖ', '4020', 1002, 'offen', 'Landstraße 33, 4020 Linz'),
                                                                                          ('2025-07-21', 'BK', 'Julia Schwarz', '+436651234567', 'OÖ', '4020', 0, 'offen', 'Landstraße 33, 4020 Linz');
