# Sabrikom — Spécification Technique

## 1. Problème

Il n'existe pas de plateforme dédiée au Maghreb (Algérie, Maroc, Tunisie) permettant de rechercher et vendre des pièces automobiles neuves et d'occasion en arabe et en français. Sabrikom comble ce manque avec une marketplace bilingue RTL/LTR, performante et adaptée au marché local.

---

## 2. Stack Technique

| Couche | Technologie |
|---|---|
| Frontend | Angular 17+ (standalone components, SSR via Angular Universal) |
| Backend API | ASP.NET Core 8 (Web API REST) |
| Base de données | MySQL 8 |
| ORM | Entity Framework Core |
| Authentification | JWT + Refresh Tokens |
| Stockage fichiers | Système de fichiers local (uploads/) ou Azure Blob Storage |
| i18n | ngx-translate (AR + FR), direction RTL/LTR dynamique |

---

## 3. Fonctionnalités

### 3.1 Rôles utilisateurs

| Rôle | Description |
|---|---|
| **Visiteur** | Navigation, recherche, consultation des annonces |
| **Acheteur** | Inscription, messagerie, sauvegarde d'annonces |
| **Vendeur** | Inscription, publication d'annonces (soumises à validation), messagerie |
| **Admin** | Validation des annonces, gestion des utilisateurs, catégories, marques |

### 3.2 Catalogue & Recherche

- Recherche combinée :
  - Par **véhicule** : marque + modèle + année
  - Par **référence OEM** / numéro de pièce
  - Par **mot-clé** libre
- Filtres : catégorie, état (neuf / occasion), wilaya/région, fourchette de prix
- Tri : date, prix croissant/décroissant, pertinence
- Pagination des résultats

### 3.3 Catégories de pièces

Gérées par l'admin via le back-office. Exemples :
- Moteur & transmission
- Carrosserie & vitrerie
- Électrique & électronique
- Freinage & suspension
- Climatisation
- Intérieur & accessoires
- Autres

### 3.4 Annonces

- Chaque annonce contient :
  - Titre (AR + FR)
  - Description (AR + FR)
  - Catégorie
  - État : neuf / occasion
  - Compatibilité véhicule (marque, modèle, année)
  - Référence OEM (optionnel)
  - Prix (DZD / MAD / TND selon pays)
  - Localisation (pays + ville)
  - Jusqu'à **10 photos** (upload multiple)
  - Numéro de téléphone du vendeur
  - Statut : en attente / publiée / rejetée / expirée

- Workflow de publication :
  1. Vendeur soumet l'annonce
  2. Admin valide ou rejette (avec motif)
  3. Annonce publiée visible par tous

### 3.5 Contact & Messagerie

- **Téléphone** : numéro affiché sur l'annonce (masqué partiellement, révélé au clic)
- **Messagerie interne** : fil de conversation entre acheteur et vendeur, lié à une annonce

### 3.6 Espace Vendeur

- Tableau de bord : annonces actives, en attente, expirées
- Gestion des annonces (créer, modifier, supprimer)
- Historique des messages reçus

### 3.7 Espace Acheteur

- Annonces sauvegardées (favoris)
- Historique des messages envoyés
- Alertes de recherche (optionnel v2)

### 3.8 Back-office Admin

- Validation / rejet des annonces avec commentaire
- Gestion des utilisateurs (activer, suspendre, supprimer)
- Gestion des catégories et sous-catégories
- Gestion des marques et modèles de véhicules
- Tableau de bord statistiques (annonces, utilisateurs, messages)

---

## 4. Internationalisation (i18n)

- Deux langues : **Arabe (AR)** et **Français (FR)**
- Direction **RTL** pour l'arabe, **LTR** pour le français
- Sélecteur de langue dans le header
- Toutes les chaînes UI externalisées dans des fichiers de traduction
- Les contenus utilisateurs (titres, descriptions) saisis dans les deux langues

---

## 5. Performance & SEO

- Angular Universal (SSR) pour le rendu côté serveur
- Lazy loading des modules Angular
- Optimisation des images (compression à l'upload, formats WebP)
- Meta tags dynamiques par annonce (titre, description, image OG)
- URLs propres et lisibles : `/ar/annonces/moteur/123-titre-piece`

---

## 6. Sécurité

- Authentification JWT avec refresh token
- Validation des entrées côté API (ASP.NET Core FluentValidation)
- Protection CSRF
- Rate limiting sur les endpoints publics
- Rôles et autorisations via ASP.NET Core Identity

---

## 7. Critères d'Acceptation

| # | Critère |
|---|---|
| AC-01 | Un visiteur peut rechercher des pièces par marque/modèle/année et par référence OEM |
| AC-02 | Un visiteur peut filtrer les résultats par catégorie, état, localisation et prix |
| AC-03 | Un vendeur peut s'inscrire, créer une annonce avec jusqu'à 10 photos et la soumettre |
| AC-04 | L'annonce n'est visible publiquement qu'après validation par un admin |
| AC-05 | Un acheteur peut contacter un vendeur via messagerie interne ou voir son numéro |
| AC-06 | L'interface bascule correctement entre RTL (arabe) et LTR (français) |
| AC-07 | L'admin peut valider, rejeter, et gérer toutes les annonces et utilisateurs |
| AC-08 | Le site est accessible et fonctionnel sur mobile (responsive) |
| AC-09 | Les pages d'annonces ont des meta tags SEO dynamiques |
| AC-10 | Les temps de chargement des pages sont < 3s sur connexion standard |

---

## 8. Plan d'Implémentation

### Phase 1 — Infrastructure & Auth
1. Initialiser le projet ASP.NET Core 8 Web API avec Entity Framework Core + MySQL
2. Créer les modèles de données : User, Role, Annonce, Categorie, Marque, Modele, Message, Photo
3. Implémenter l'authentification JWT (inscription, connexion, refresh token)
4. Initialiser le projet Angular 17 avec Angular Universal (SSR)
5. Configurer ngx-translate (AR/FR) et le support RTL/LTR dynamique
6. Créer le layout principal : header (sélecteur langue, nav), footer

### Phase 2 — Catalogue & Recherche
7. API : endpoints de recherche (par véhicule, OEM, mot-clé) avec filtres et pagination
8. API : CRUD catégories, marques, modèles (admin)
9. Angular : page de recherche avec filtres latéraux et liste de résultats
10. Angular : page de détail d'une annonce (photos, infos, contact)

### Phase 3 — Annonces & Vendeurs
11. API : CRUD annonces avec upload de photos (jusqu'à 10)
12. API : workflow de validation (statuts : en_attente, publiée, rejetée)
13. Angular : formulaire de création/modification d'annonce
14. Angular : tableau de bord vendeur (mes annonces, statuts)

### Phase 4 — Messagerie & Contact
15. API : messagerie interne (conversations liées à une annonce)
16. Angular : interface de messagerie (liste conversations + fil de messages)
17. Affichage du numéro de téléphone (masqué / révélé au clic)

### Phase 5 — Back-office Admin
18. Angular : module admin (validation annonces, gestion utilisateurs)
19. Angular : gestion des catégories, marques, modèles
20. Angular : tableau de bord statistiques

### Phase 6 — Qualité & Déploiement
21. Tests unitaires API (xUnit) et Angular (Jasmine/Karma)
22. Optimisation SEO : meta tags dynamiques, sitemap XML
23. Optimisation performance : compression images, lazy loading
24. Configuration Docker (docker-compose : API + Angular + MySQL)
25. Documentation API (Swagger/OpenAPI)
