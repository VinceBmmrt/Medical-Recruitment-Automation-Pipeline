# 🤖 Pipeline d'Automatisation Recrutement Médical

## 📌 Vue d'ensemble

Système d'automatisation pour la collecte et l'archivage de CVs médicaux, composé de 3 modules coordonnés via un script JavaScript principal.

## 🏗️ Architecture
```
recrutement-auto/
├── main.js                      # 🎛️ Contrôleur principal
├── scraper.js                   # 🔍 Module de scraping (Node.js)
├── uploadDrive_complete.js      # ☁️ Module d'upload Drive (Node.js)
├── package.json                 # 📦 Dépendances Node.js
├── credentials.json             # 🔐 Configuration Google OAuth
├── token.json                   # 🔑 Token d'accès (généré automatiquement)
├── .env                         # ⚙️ Variables d'environnement
├── cvs/                         # 📁 Dossier des CVs PDF (généré)
├── logs/                        # 📋 Logs d'exécution (généré)
└── README.md                    # 📖 Documentation
```

## 🎯 Fonctionnalités

### 1. **Scraping Intelligent** (`scraper.js`)
- Connexion automatique à Staff Agency
- Filtrage par métier (aide-soignant) et région (Île-de-France)
- Téléchargement batch des CVs en PDF
- Navigation paginée automatique
- Gestion d'erreurs avec screenshots

### 2. **Upload Cloud** (`uploadDrive_complete.js`)
- Authentification OAuth2 automatique
- Création de dossier daté sur Google Drive
- Upload sécurisé des PDFs
- Génération de lien partageable
- Logs détaillés de progression

### 3. **Orchestration** (`main.js`)
- Lancement séquentiel des modules
- Gestion des erreurs transverses
- Journalisation centralisée
- Interface ligne de commande

## 🚀 Installation Rapide

### 1. Prérequis système
```bash
# Vérifier les versions
node --version  # >= 16.x
```

### 2. Installation des dépendances
```bash
# Node.js
npm install

# Playwright
npx playwright install chromium
```

### 3. Configuration
```bash
# 1. Variables d'environnement (.env)
STAFF_EMAIL=votre.email@domaine.com
STAFF_PASSWORD=votre_mot_de_passe

# 2. Google OAuth (credentials.json)
# Télécharger depuis Google Cloud Console
# Placer à la racine du projet
```

## ⚙️ Configuration

### Fichier `.env`
```env
# Staff Agency
STAFF_EMAIL=recrutement@votre-entreprise.com
STAFF_PASSWORD=votre_mot_de_passe_secure

# Optionnel - Personnalisation
MAX_PAGES=9  # Nombre max de pages à scraper
HEADLESS=false  # true pour mode invisible
REGION="Île-de-France"  # Région cible
METIER="Aide soignant"  # Poste recherché
```

### Google Cloud Setup

1. Créer un projet sur [Google Cloud Console](https://console.cloud.google.com/)
2. Activer l'API Google Drive
3. Créer identifiants OAuth 2.0 → Application bureau
4. Ajouter URI de redirection : `http://localhost:3000/callback`
5. Télécharger `credentials.json`

## 🎮 Utilisation

### Lancement complet
```bash
node main.js --all
```

### Options disponibles
```bash
# Aide
node main.js --help

# Scraping uniquement
node main.js --scrape

# Upload uniquement
node main.js --upload

# Mode verbose
node main.js --all --verbose

# Spécifier un dossier de CVs
node main.js --upload --folder ./mon-dossier-cvs
```


## 📊 Flux d'exécution
```
Début main.js
    │
    ├── PHASE 1: SCRAPING
    │   ├── Connexion Staff Agency
    │   ├── Application filtres
    │   ├── Parcours pages (max 9)
    │   ├── Téléchargement PDFs
    │   └── Sauvegarde dans ./cvs/
    │
    ├── PHASE 2: UPLOAD
    │   ├── Vérification OAuth
    │   ├── Création dossier Drive daté
    │   ├── Upload batch des PDFs
    │   └── Génération lien Drive
    │
    └── PHASE 3: RAPPORT
        ├── Statistiques
        ├── Nettoyage (optionnel)
        └── Logs de fin
```

## 📁 Structure des fichiers générés

### Dossier `cvs/`
```
cvs/
├── Jean_Dupont_p1.pdf
├── Marie_Martin_p1.pdf
├── Paul_Bernard_p2.pdf
└── erreur_p1_cv3.png  # Screenshot en cas d'erreur
```

### Dossier `logs/`
```
logs/
├── execution_2024-03-15.log
├── scraper_2024-03-15.log
└── drive_2024-03-15.log
```

### Google Drive
```
Drive > CVs_AideSoignantes_2024-03-15/
    ├── Jean_Dupont_p1.pdf
    ├── Marie_Martin_p1.pdf
    └── ...
```

## 🛡️ Sécurité & Conformité






## 🐛 Dépannage

### Erreurs courantes

#### "Module non trouvé"
```bash
# Node.js modules
npm install

# Playwright
npx playwright install chromium
```

#### "Authentication failed" (Staff Agency)

- Vérifier `.env` et identifiants
- Tester la connexion manuelle
- Vérifier le compte recruteur actif

#### "OAuth consent screen" (Google)

- Vérifier `credentials.json` présent
- Ajouter `test@yourcompany.com` comme utilisateur test
- Compléter l'écran de consentement dans Google Cloud

#### "Port 3000 already in use"
```bash
# Option 1 : Fermer l'application utilisant le port
sudo lsof -ti:3000 | xargs kill -9

# Option 2 : Modifier le port dans uploadDrive_complete.js
const server = http.createServer(...).listen(3001);
```

### Logs de débogage
```bash
# Mode détaillé
node main.js --all --verbose

# Voir logs
tail -f logs/execution_*.log
```

