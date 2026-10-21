# Sabrikom — Marketplace de pièces automobiles

Plateforme bilingue (Arabe / Français) de recherche et vente de pièces automobiles neuves et d'occasion, ciblant le Maghreb (Algérie, Maroc, Tunisie).

## Stack

| Couche | Technologie |
|---|---|
| Frontend | Angular 17 + SSR (Angular Universal) |
| Backend | ASP.NET Core 8 Web API |
| Base de données | MySQL 8 |
| ORM | Entity Framework Core 8 |
| Auth | JWT + Refresh Tokens |
| i18n | ngx-translate (AR/FR, RTL/LTR) |

## Structure

```
Sabrikom/
├── backend/          # ASP.NET Core 8 API
│   ├── Controllers/  # Auth, Listings, Catalog, Messages
│   ├── Models/       # AppUser, Listing, Category, Brand, Message, ...
│   ├── Data/         # AppDbContext + migrations EF Core
│   ├── Services/     # TokenService, PhotoService
│   └── DTOs/         # Objets de transfert
├── frontend/         # Angular 17
│   └── src/app/
│       ├── core/     # Services, guards, interceptors, models
│       ├── shared/   # Navbar, Footer
│       └── features/ # Home, Search, ListingDetail, Auth, Dashboard, Messages, Admin
└── docker-compose.yml
```

## Démarrage rapide

### Avec Docker Compose

```bash
docker-compose up -d
```

- Frontend : http://localhost:4200
- API : http://localhost:5000
- Swagger : http://localhost:5000/swagger

### Développement local

**Backend** (nécessite MySQL en local) :
```bash
cd backend
dotnet run
```

**Frontend** :
```bash
cd frontend
npm install
ng serve
```

## Fonctionnalités

- **Recherche** : par marque/modèle/année + référence OEM + mot-clé libre
- **Filtres** : catégorie, état (neuf/occasion), pays, ville, fourchette de prix
- **Annonces** : jusqu'à 10 photos, workflow de validation admin
- **Contact** : téléphone masqué + messagerie interne
- **Rôles** : Visiteur, Acheteur, Vendeur, Admin
- **i18n** : Arabe (RTL) / Français (LTR), bascule dynamique

## Variables d'environnement

| Variable | Description |
|---|---|
| `ConnectionStrings__DefaultConnection` | Chaîne de connexion MySQL |
| `Jwt__Key` | Clé secrète JWT (min 32 chars) |
| `App__BaseUrl` | URL de base de l'API |
| `App__FrontendUrl` | URL du frontend (CORS) |

## Tests backend

```bash
dotnet test tests/Sabrikom.API.Tests/Sabrikom.API.Tests.csproj
```

Les tests ciblent la rotation/révocation des refresh tokens, la visibilité et les
droits de modification des annonces, ainsi que l’isolation des conversations et
les compteurs de messages non lus. Chaque test utilise une base SQLite en mémoire
isolée, sans serveur MySQL. Ils exercent les contrôleurs et la persistance EF Core,
pas le pipeline HTTP/JWT ni les spécificités du fournisseur MySQL.
