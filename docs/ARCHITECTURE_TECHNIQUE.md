# Stratégie Technique : Architecture "Headless"

Ce document définit l'architecture technique choisie pour le projet de digitalisation MBC.

## 🏗️ Vue d'ensemble

Nous utilisons une architecture **Headless** qui sépare le Frontend du Backend pour tirer parti du meilleur des deux mondes, tout en restant compatible avec un hébergement mutualisé standard.

*   **Frontend (Visuel & Marketing) :** [Next.js](https://nextjs.org/)
    *   Généré en **HTML/CSS/JS Statique** (`output: 'export'`).
    *   Assure des performances maximales et un SEO parfait.
    *   Hébergé comme de simples fichiers dans le dossier public.
*   **Backend (Logique & Données) :** [Laravel](https://laravel.com/)
    *   Sert d'**API JSON** uniquement.
    *   Gère la base de données MySQL, l'authentification et l'administration complexe.
    *   Hébergé sur le serveur PHP existant.

---

## 📂 Structure du Déploiement (Hébergement)

Sur le serveur FTP, l'organisation recommandée est la suivante :

```text
/ (Racine Hébergement)
│
├── /mbc_api           <-- Code Source Laravel (Non accessible publiquement)
│   ├── .env           <-- Config BDD
│   ├── storage/
│   └── ...
│
└── /public_html       <-- Dossier Web (Racine du site)
    │
    ├── /api           <-- Point d'entrée de Laravel
    │   ├── index.php  <-- (Modifié pour pointer vers ../mbc_api)
    │   └── .htaccess
    │
    ├── _next/         <-- Assets JS/CSS (Générés par Next.js)
    ├── index.html     <-- Accueil (Généré par Next.js)
    ├── contact.html   <-- Page Contact
    └── ...
```

---

## ⚙️ Configuration Technique

### 1. Frontend (Next.js)

Le fichier `next.config.js` est configuré pour l'export statique :

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Nécessaire car pas de serveur Node.js pour redimensionner
  },
  // Si le site est la racine, pas de basePath. 
  // Si dans un sous-dossier, ajouter basePath: '/dossier'
};
module.exports = nextConfig;
```

**Commandes :**
*   Développement : `npm run dev` (API mockée ou locale)
*   Production : `npm run build` (Génère le dossier `out`)

### 2. Backend (Laravel)

*   **Rôle :** Fournisseur de données API.
*   **Routes :** Définies dans `routes/api.php`.
*   **Réponses :** Toujours au format JSON.
*   **CORS :** Doit autoriser le domaine du frontend.

---

## 🚀 Workflow de Développement

1.  **Backend (Laravel)**
    *   Développer les migrations, modèles et contrôleurs.
    *   Tester les endpoints API (via Postman ou navigateur).
2.  **Frontend (Next.js)**
    *   Créer les interfaces React.
    *   Connecter aux données via `fetch('https://mon-site.com/api/...')`.
3.  **Mise en Production**
    *   Lancer `npm run build` dans le dossier Next.js.
    *   Uploader le contenu du dossier `out` vers `public_html`.
    *   Mettre à jour l'API Laravel si nécessaire via FTP/Git.

---

## 📝 Schéma de Données (Rappel)

Le modèle de données (Chantiers, Phases, Matériel...) est géré par les **Migrations Laravel**.
Voir le document `docs/DATABASE_SCHEMA.md` pour les définitions conceptuelles, à traduire en classes PHP Laravel.
