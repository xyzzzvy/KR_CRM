DROP DATABASE IF EXISTS sol;
CREATE DATABASE sol;
USE sol;

-- Mitarbeiter-Tabelle
CREATE TABLE mitarbeiter (
                             gpnr INT PRIMARY KEY,
                             vorname VARCHAR(100) NOT NULL,
                             nachname VARCHAR(100) NOT NULL,
                             role VARCHAR(100) NOT NULL,
                             telefon VARCHAR(50),
                             email VARCHAR(150) UNIQUE,
                             fuehrungskraft int,
                             passwort VARCHAR(255) NOT NULL
);


CREATE TABLE lead_orders (
                             id INT Primary key auto_increment,
                             GPNR INT,
                             anzahl INT NOT NULL,
                             bl VARCHAR(100) NOT NULL,
                             plzrange VARCHAR(9) NOT NULL,
                             kampagne VARCHAR(255) NOT NULL,
                             note TEXT,
                             status VARCHAR(50) NOT NULL DEFAULT 'offen',
                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO lead_orders (GPNR, anzahl, bl, plzrange, kampagne, note, status, created_at) VALUES
                                                                                             (1002, 10, 'Niederösterreich', '1220-1220', 'BK', 'Te', 'offen', '2025-08-04 17:03:31'),
                                                                                             (1002, 5, 'Wien', '1010-1010', 'Sommeraktion', 'Eilige Lieferung', 'offen', '2025-07-15 09:45:00'),
                                                                                             (1002, 20, 'Oberösterreich', '4020-4030', 'Winterkampagne', NULL, 'offen', '2025-06-20 14:30:00'),
                                                                                             (1002, 15, 'Steiermark', '8010-8010', 'Frühjahr', 'Kunde bevorzugt', 'offen', '2025-08-01 12:00:00'),
                                                                                             (1002, 8, 'Salzburg', '5020-5020', 'Sonderangebot', NULL, 'offen', '2025-05-10 10:15:00');


CREATE TABLE kamp (
                      nr INT AUTO_INCREMENT PRIMARY KEY ,
                      name varchar(100) not null unique
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
                       adresse VARCHAR(255)
);



INSERT into kamp(name)
VALUES
    ("BK"),
    ("Flughafen"),
    ("BK-KR"),
    ("BK-Niklas"),
    ("BK-Marvin"),
    ("SK"),
    ("BK-Nina");



-- Mitarbeiter einfügen
INSERT INTO mitarbeiter (
    gpnr, vorname, nachname, telefon, email, fuehrungskraft, passwort, role
) VALUES
      (62804, 'Hashim', 'Soliman', '+436701112223', 'max.mustermann@firma.at', 0000 , 'Test1234', 'Admin'),
      (1002, 'Sabine', 'Huber', '+436641112233', 'sabine.huber@firma.at', 62804, 'Geheim1234', 'Berater');

-- Leads einfügen (Partner korrekt auf gpnr 1001 oder 1002 gesetzt)
INSERT INTO leads (
    datum, kampagne, name, telefon, bl, plz, partner, status, adresse
) VALUES
      ('2025-07-19', 'BK', 'Anna Schmidt', '+436771234567', 'W', '1020', 0, 'offen', 'Graben 1, 1020 Wien'),
      ('2025-07-19', 'BK', 'Peter Müller', '+436778899001', 'NÖ', '3000', 0, 'offen', 'Bahnhofstraße 10, 3000 St. Pölten'),
      ('2025-07-19', 'SK', 'Laura Meier', '+436765432198', 'ST', '8020', 0, 'offen', 'Schillerplatz 5, 8020 Graz'),
      ('2025-07-19', 'Flughafen', 'Markus Huber', '+436770011223', 'OÖ', '4040', 0, 'offen', 'Landstraße 12, 4040 Linz'),
      ('2025-07-19', 'SK', 'Julia Lang', '+436766655544', 'W', '1030', 0, 'offen', 'Mariahilfer Straße 10, 1030 Wien'),
      ('2025-07-19', 'BK', 'Thomas Berger', '+436779988776', 'T', '6060', 0, 'offen', 'Innrain 20, 6060 Hall in Tirol'),
      ('2025-07-19', 'SK', 'Karin Fischer', '+436764433221', 'S', '5020', 0, 'offen', 'Mirabellplatz 6, 5020 Salzburg'),
      ('2025-07-19', 'Flughafen', 'Michael Wolf', '+436778877665', 'W', '1040', 0, 'offen', 'Währinger Straße 15, 1040 Wien'),
      ('2025-07-19', 'BK', 'Sandra Baumgartner', '+436763322110', 'K', '9020', 0, 'offen', 'Viktringer Ring 1, 9020 Klagenfurt'),
      ('2025-07-19', 'BK', 'Daniela Krüger', '+436762211009', 'NÖ', '2000', 0, 'offen', 'Landstraße 5, 2000 Stockerau'),
      ('2025-07-19', 'SK', 'Stefan Novak', '+436761100998', 'W', '1050', 0, 'offen', 'Favoritenstraße 70, 1050 Wien'),
      ('2025-07-19', 'Flughafen', 'Petra Sommer', '+436760099887', 'OÖ', '4050', 0, 'offen', 'Franz-Fritsch-Straße 8, 4050 Leonding'),
      ('2025-07-19', 'SK', 'Matthias Bauer', '+436759988776', 'T', '6020', 0, 'offen', 'Innrain 7, 6020 Innsbruck'),
      ('2025-07-19', 'BK', 'Nina Fischer', '+436758877665', 'ST', '8010', 0, 'offen', 'Hauptplatz 4, 8010 Graz'),
      ('2025-07-19', 'SK', 'Oliver Schwarz', '+436757766554', 'W', '1060', 0, 'offen', 'Mariahilfer Straße 25, 1060 Wien'),
      ('2025-07-19', 'Flughafen', 'Eva Meier', '+436756655443', 'S', '5020', 0, 'offen', 'Mozartstraße 7, 5020 Salzburg'),
      ('2025-07-20', 'BK', 'Lisa Meier', '+436701234567', 'W', '1010', 0, 'offen', 'Wollzeile 10, 1010 Wien'),
      ('2025-07-20', 'SK', 'Thomas Klein', '+436701234568', 'NÖ', '3100', 0, 'offen', 'Bahnhofstraße 5, 3100 St. Pölten'),
      ('2025-07-20', 'Flughafen', 'Sabine Müller', '+436701234569', 'ST', '8020', 0, 'offen', 'Hauptplatz 1, 8020 Graz'),
      ('2025-07-20', 'BK', 'Jan Schmidt', '+436701234570', 'OÖ', '4020', 0, 'offen', 'Landstraße 3, 4020 Linz'),
      ('2025-07-20', 'SK', 'Eva Wagner', '+436701234571', 'W', '1030', 0, 'offen', 'Neubaugasse 12, 1030 Wien'),
      ('2025-07-20', 'Flughafen', 'Markus Bauer', '+436701234572', 'T', '6060', 0, 'offen', 'Innrain 8, 6060 Hall in Tirol'),
      ('2025-07-20', 'BK', 'Anna Fischer', '+436701234573', 'S', '5020', 0, 'offen', 'Mirabellplatz 9, 5020 Salzburg'),
      ('2025-07-20', 'SK', 'David Schwarz', '+436701234574', 'W', '1010', 0, 'offen', 'Stephansplatz 6, 1010 Wien'),
      ('2025-07-20', 'Flughafen', 'Julia Hofmann', '+436701234575', 'NÖ', '2000', 0, 'offen', 'Landstraße 20, 2000 Stockerau'),
      ('2025-07-20', 'BK', 'Michael Maier', '+436701234576', 'ST', '8010', 0, 'offen', 'Hauptplatz 7, 8010 Graz'),
      ('2025-07-21', 'SK', 'Sandra Wolf', '+436701234577', 'W', '1020', 0, 'offen', 'Graben 15, 1020 Wien'),
      ('2025-07-21', 'Flughafen', 'Peter Berger', '+436701234578', 'NÖ', '3000', 0, 'offen', 'Bahnhofstraße 12, 3000 St. Pölten'),
      ('2025-07-21', 'BK', 'Karin Krüger', '+436701234579', 'ST', '8020', 0, 'offen', 'Schillerplatz 9, 8020 Graz'),
      ('2025-07-21', 'SK', 'Michael Novak', '+436701234580', 'OÖ', '4040', 0, 'offen', 'Landstraße 14, 4040 Linz'),
      ('2025-07-21', 'Flughafen', 'Daniela Sommer', '+436701234581', 'W', '1030', 0, 'offen', 'Mariahilfer Straße 13, 1030 Wien'),
      ('2025-07-21', 'BK', 'Oliver Fischer', '+436701234582', 'T', '6060', 0, 'offen', 'Innrain 21, 6060 Hall in Tirol'),
      ('2025-07-21', 'SK', 'Petra Meier', '+436701234583', 'S', '5020', 0, 'offen', 'Mirabellplatz 15, 5020 Salzburg'),
      ('2025-07-21', 'Flughafen', 'Stefan Bauer', '+436701234584', 'W', '1010', 0, 'offen', 'Stephansplatz 9, 1010 Wien'),
      ('2025-07-21', 'BK', 'Nina Schwarz', '+436701234585', 'NÖ', '2000', 0, 'offen', 'Landstraße 25, 2000 Stockerau'),
      ('2025-07-21', 'SK', 'Alexander Wolf', '+436701234586', 'ST', 8010, 0, 'offen', 'Hauptplatz 10, 8010 Graz'),
      ('2025-07-22', 'BK', 'Martin Lehner', '+436701234590', 'W', '1010', 0, 'offen', 'Lederergasse 5, 1010 Wien'),
      ('2025-07-22', 'SK', 'Sandra Reiter', '+436701234591', 'NÖ', '3100', 0, 'offen', 'Kirchengasse 3, 3100 St. Pölten'),
      ('2025-07-22', 'Flughafen', 'Robert Lang', '+436701234592', 'ST', '8020', 0, 'offen', 'Griesplatz 1, 8020 Graz'),
      ('2025-07-22', 'BK', 'Jessica Maier', '+436701234593', 'OÖ', '4020', 0, 'offen', 'Mozartstraße 12, 4020 Linz'),
      ('2025-07-22', 'SK', 'Thomas Weber', '+436701234594', 'W', '1020', 0, 'offen', 'Rotenturmstraße 7, 1020 Wien'),
      ('2025-07-22', 'Flughafen', 'Maria Berger', '+436701234595', 'T', '6060', 0, 'offen', 'Sillgasse 9, 6060 Hall in Tirol'),
      ('2025-07-22', 'BK', 'Felix Wagner', '+436701234596', 'S', '5020', 0, 'offen', 'Getreidegasse 20, 5020 Salzburg'),
      ('2025-07-22', 'SK', 'Anna Novak', '+436701234597', 'W', '1030', 0, 'offen', 'Gumpendorfer Straße 14, 1030 Wien'),
      ('2025-07-22', 'Flughafen', 'Michael Schwarz', '+436701234598', 'NÖ', '2000', 0, 'offen', 'Bahnhofstraße 11, 2000 Stockerau'),
      ('2025-07-22', 'BK', 'Claudia Hofmann', '+436701234599', 'ST', '8010', 0, 'offen', 'Jakominiplatz 6, 8010 Graz'),
      ('2025-07-23', 'SK', 'David Bauer', '+436701234600', 'W', '1010', 0, 'offen', 'Kärntner Straße 4, 1010 Wien'),
      ('2025-07-23', 'Flughafen', 'Lisa Krüger', '+436701234601', 'NÖ', '3100', 0, 'offen', 'Ringstraße 2, 3100 St. Pölten'),
      ('2025-07-23', 'BK', 'Alexander Meier', '+436701234602', 'OÖ', '4020', 0, 'offen', 'Hauptstraße 15, 4020 Linz'),
      ('2025-07-23', 'SK', 'Sophie Wagner', '+436701234603', 'W', '1040', 0, 'offen', 'Margaretenstraße 10, 1040 Wien'),
      ('2025-07-23', 'Flughafen', 'Christian Novak', '+436701234604', 'T', '6060', 0, 'offen', 'Maria-Theresien-Straße 8, 6060 Hall in Tirol'),
      ('2025-07-23', 'BK', 'Julia Fischer', '+436701234605', 'S', '5020', 0, 'offen', 'Residenzplatz 1, 5020 Salzburg'),
      ('2025-07-23', 'SK', 'Martin Huber', '+436701234606', 'W', '1050', 0, 'offen', 'Wiedner Hauptstraße 20, 1050 Wien'),
      ('2025-07-23', 'Flughafen', 'Petra Schmid', '+436701234607', 'ST', '8020', 0, 'offen', 'Annenstraße 4, 8020 Graz'),
      ('2025-07-23', 'BK', 'Andreas Wolf', '+436701234608', 'NÖ', '2000', 0, 'offen', 'Alte Landstraße 3, 2000 Stockerau'),
      ('2025-07-23', 'SK', 'Eva Lang', '+436701234609', 'W', '1010', 0, 'offen', 'Rathausplatz 7, 1010 Wien'),
      ('2025-07-23', 'Flughafen', 'Michael Berger', '+436701234610', 'OÖ', '4040', 0, 'offen', 'Schillerstraße 9, 4040 Linz'),
      ('2025-07-24', 'BK', 'Nina Maier', '+436701234611', 'W', '1020', 0, 'offen', 'Universitätsstraße 2, 1020 Wien'),
      ('2025-07-24', 'SK', 'Thomas Huber', '+436701234612', 'NÖ', '3100', 0, 'offen', 'Bahnhofplatz 5, 3100 St. Pölten'),
      ('2025-07-24', 'Flughafen', 'Sandra Novak', '+436701234613', 'ST', '8010', 0, 'offen', 'Griesplatz 3, 8010 Graz'),
      ('2025-07-24', 'BK', 'David Schwarz', '+436701234614', 'OÖ', '4020', 0, 'offen', 'Mozartstraße 15, 4020 Linz'),
      ('2025-07-24', 'SK', 'Petra Meier', '+436701234615', 'W', '1030', 0, 'offen', 'Mariahilfer Straße 18, 1030 Wien'),
      ('2025-07-24', 'Flughafen', 'Markus Bauer', '+436701234616', 'T', '6060', 0, 'offen', 'Innrain 11, 6060 Hall in Tirol'),
      ('2025-07-24', 'BK', 'Anna Fischer', '+436701234617', 'S', '5020', 0, 'offen', 'Mirabellplatz 10, 5020 Salzburg'),
      ('2025-07-24', 'SK', 'David Schwarz', '+436701234618', 'W', '1010', 0, 'offen', 'Stephansplatz 7, 1010 Wien'),
      ('2025-07-24', 'Flughafen', 'Julia Hofmann', '+436701234619', 'NÖ', '2000', 0, 'offen', 'Landstraße 22, 2000 Stockerau');

