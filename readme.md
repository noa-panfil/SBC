# Seclin Basket Club (SBC) - Site Officiel 🏀

![SBC Banner](https://seclinbasketclub.fr/api/image/2026)

> **Bienvenue sur le dépôt officiel du Seclin Basket Club (SBC).**  
> 🌐 **Site accessible sur : [seclinbasketclub.fr](https://seclinbasketclub.fr)**  
>
> Ce site web est la vitrine numérique de notre club, offrant aux membres et aux fans un accès rapide aux actualités, résultats, équipes et événements du club.

---

## 📌 À Propos

Le **Seclin Basket Club** est une institution sportive historique située à Seclin (59113), dédiée à la formation, la passion et la compétition dans le basketball.

Ce projet vise à fournir une interface moderne, responsive et dynamique pour :
- Suivre les **derniers résultats** et classements.
- Consulter le **calendrier des matchs**.
- Découvrir nos **équipes** (de la jeunesse aux seniors).
- S'informer sur les **événements** à venir (lotos, tournois, fêtes).
- Mettre en avant nos précieux **partenaires**.

---

## 🚀 Fonctionnalités Clés

- **Accueil Dynamique** : Présentation visuelle impactante avec les dernières news.
- **Gestion des Équipes** : Pages détaillées pour chaque catégorie (U7 à Seniors).
- **Calendrier & Résultats** : Intégration des scores et des matchs à venir.
- **Événements** : Section dédiée aux manifestations du club.
- **Espace Partenaires** : Mise en valeur des sponsors qui nous soutiennent.
- **Design Responsive** : Optimisé pour mobile, tablette et desktop grâce à **Tailwind CSS**.

---

## 🛠️ Stack Technique

Ce projet est construit avec des technologies web standards, privilégiant la performance et la simplicité de maintenance.

| Technologie | Usage |
| :--- | :--- |
| ![HTML5](https://skillicons.dev/icons?i=html&theme=dark) | Structure sémantique des pages. |
| ![Tailwind CSS](https://skillicons.dev/icons?i=tailwind&theme=dark) | Framework CSS utilitaire pour le styling rapide et responsive. |
| ![JavaScript](https://skillicons.dev/icons?i=js&theme=dark) | Logique dynamique (slider, interactions, chargement de données). |
| ![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white) | Stockage léger des données (équipes, matchs). |

---

## 📂 Structure du Projet

```bash
SBC/
├── img/                # Images et assets graphiques (logos, photos équipes, partenaires)
├── js/                 # Scripts JavaScript
│   ├── layout.js       # Gestion du Header/Footer commun
│   ├── home.js         # Logique spécifique à la page d'accueil
│   ├── equipes.js      # Gestion des données des équipes
│   └── ...
├── json/               # Données statiques (si applicable)
├── index.html          # Page d'accueil
├── equipes.html        # Liste des équipes
├── detail-equipe.html  # Page de détail d'une équipe
├── event.html          # Page des événements
├── partenaires.html    # Page des partenaires
├── style.css           # Styles CSS personnalisés (complémentaire à Tailwind)
└── tailwind-config.js  # Configuration de Tailwind CSS
```

---

## 💻 Installation & Utilisation

Ce projet étant un site statique, aucune installation complexe côté serveur n'est requise.

### Pré-requis
- Un navigateur web moderne.
- Une connexion internet (pour le chargement de Tailwind via CDN).

### Lancer le projet localement

1.  **Cloner le dépôt :**
    ```bash
    git clone https://github.com/noa-panfil/SBC.git
    cd SBC
    ```

2.  **Ouvrir le site :**
    - Ouvrez simplement le fichier `index.html` dans votre navigateur.
    - OU utilisez une extension comme "Live Server" sur VS Code pour un rechargement automatique.

---

<div align="center">
  <sub>Fait avec ❤️ par le Web Master Noa Panfil </sub>
</div>
