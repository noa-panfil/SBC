<div align="center">
  <img src="https://seclinbasketclub.fr/logo.png" width="120" alt="SBC Logo" />
  <h1>Seclin Basket Club (SBC)</h1>
  <p><strong>Plateforme Officielle - Performance, Passion, Compétition</strong></p>

  <p>
    <a href="https://seclinbasketclub.fr"><img src="https://img.shields.io/badge/Site-Web-14532d?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Website" /></a>
    <img src="https://img.shields.io/badge/Status-Production-success?style=for-the-badge" alt="Status" />
    <img src="https://img.shields.io/badge/Stack-Next.js%2016-black?style=for-the-badge&logo=next.js" alt="Stack" />
  </p>
</div>

---

### 🌐 Présentation
Le **Seclin Basket Club**, institution sportive de Seclin (59113), se dote d'une nouvelle infrastructure numérique.
Ce projet, propulsé par **Next.js 16**, offre une expérience fluide aux licenciés tout en proposant une interface d'administration robuste pour la gestion du club au quotidien.

---

### 🚀 Fonctionnalités Clés

#### 🛡️ Administration (Sécurisée)
- **Tableau de Bord** : Statistiques en temps réel (nombre de joueurs, coachs).
- **Gestion des personnes** : une fiche unique avec plusieurs fonctions cumulables.
- **Saisons et équipes** : création d'une saison, copie de la structure et affectations historisées.
- **Calendrier** : matchs domicile et extérieur réunis dans une seule table et une seule interface.
- **Images métier** : stockage séparé pour les personnes, équipes, partenaires, événements et réglages.

#### 📅 Événements & Inscriptions
- **Système d'Inscription** : Formulaires dynamiques adaptés au type d'événement (Public, Joueurs, Bénévoles).
- **Gestion des Inscrits** : Visualisation et export des listes d'inscriptions pour l'organisation.

---

### 📂 Structure du projet
```bash
SBC/
├── src/
│   ├── app/              # Routes Next.js (Admin, API, Pages publiques)
│   ├── components/       # Composants UI (Header, Footer, Client components)
│   └── lib/              # Connexion DB & Logique métier
└── public/               # Favicon & Assets statiques
```

---

### 💻 Installation Locale
1. **Dépôt** : `git clone https://github.com/noa-panfil/SBC.git`
2. **Dépendances** : `npm install`
3. **Base principale** : importer `sbc-dtb-v2.sql` (les partenaires et leurs images sont inclus).
4. **Configuration** : créer un `.env.local` avec vos identifiants SQL.
5. **Lancement** : `npm run dev`

---

<div align="center">
  <p>Fait avec ❤️ pour le <strong>Seclin Basket Club</strong></p>
</div>
