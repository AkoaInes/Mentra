const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();

// Middleware pour parser les données des formulaires
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Ajouté pour la robustesse, même si pas strictement nécessaire pour vos formulaires actuels

// Servir les fichiers statiques (HTML, CSS, JS, images)
// Puisque server.js est dans le dossier 'public',
// __dirname pointe déjà vers ce dossier 'public'.
// Donc, nous disons à Express de servir les fichiers statiques depuis CE répertoire.
app.use(express.static(__dirname)); // <<<---- C'EST LA LIGNE CLÉ MODIFIÉE

// 🔐 Middleware pour définir la politique de sécurité du contenu (CSP)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self';"
  );
  next();
});

// Connexion à la base de données MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'MentraConnection1.0',
    database: 'Mentra'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Erreur de connexion à MySQL : ' + err.stack);
        process.exit(1); // Arrête le processus Node.js en cas d'erreur critique de connexion
    }
    console.log('✅ Connecté à MySQL');
});

// Route par défaut : servir la page sign-in.html
// Cette ligne était déjà correcte pour votre structure, car sign-in.html est dans le même dossier que server.js
app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'sign-in.html'));
});

// Route d'inscription
app.post('/signup', (req, res) => {
    const { fullname, email, password, confirm_password } = req.body;

    if (!fullname || !email || !password || !confirm_password) {
        return res.status(400).send('Tous les champs sont obligatoires.');
    }

    if (password !== confirm_password) {
        return res.status(400).send('Les mots de passe ne correspondent pas.');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query(
        'INSERT INTO user_sign_in (fullname, email, password) VALUES (?, ?, ?)',
        [fullname, email, hashedPassword],
        (err, results) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.error('Tentative d\'inscription avec un email déjà utilisé:', email);
                    return res.status(400).send('Cet email est déjà utilisé.');
                }
                console.error('Erreur lors de l\'inscription :', err);
                return res.status(500).send('Erreur serveur lors de l\'inscription.');
            }
            console.log('Utilisateur inscrit avec succès:', fullname, email);
            res.status(200).send('Inscription réussie !');
        }
    );
});

// Route de connexion
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email et mot de passe requis.');
    }

    db.query(
        'SELECT * FROM user_sign_in WHERE email = ?',
        [email],
        (err, results) => {
            if (err) {
                console.error('Erreur SQL lors de la recherche de l\'utilisateur pour la connexion :', err);
                return res.status(500).send('Erreur serveur lors de la connexion.');
            }

            if (results.length === 0) {
                console.log('Tentative de connexion avec email inconnu:', email);
                return res.status(401).send('Email ou mot de passe incorrect.');
            }

            const user = results[0];
            const validPassword = bcrypt.compareSync(password, user.password);

            if (!validPassword) {
                console.log('Tentative de connexion avec mot de passe incorrect pour:', email);
                return res.status(401).send('Email ou mot de passe incorrect.');
            }

            console.log('Connexion réussie pour:', user.fullname);
            res.status(200).send('Connexion réussie ! Bienvenue ' + user.fullname);
        }
    );
});

// Lancer le serveur sur le port 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${PORT}`);
});