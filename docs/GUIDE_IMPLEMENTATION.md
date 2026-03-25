# Guide d'Implémentation : Next.js (Static) + Laravel (API)

Ce guide détaille les étapes techniques pour construire l'application.

## 🏁 Phase 1 : Backend Laravel (Priorité actuelle)

Tu es en train d'installer Laravel. Une fois installé (`composer create-project laravel/laravel api`), voici les commandes à lancer :

### 1.1 Préparer la Base de Données
Dans ton fichier `.env` Laravel :
```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mbc_digitization
DB_USERNAME=root
DB_PASSWORD=
```

### 1.2 Créer les Modèles & Migrations (Ordre logique)

Lance ces commandes dans ton terminal Laravel :

```bash
# 1. Utilisateurs (Déjà existant, mais à adapter pour ajouter les rôles)
php artisan make:migration add_fields_to_users_table

# 2. Projets (Chantiers)
php artisan make:model Project -m

# 3. Phases de Projets (Timeline)
php artisan make:model ProjectPhase -m

# 4. Logs Journaliers (Rapports) & Documents/Photos
php artisan make:model DailyLog -m
php artisan make:model Media -m
```

*Ensuite, remplis les fichiers créés dans `database/migrations/` avec le code PHP que je t'ai donné dans la conversation précédente (ou inspire-toi de `docs/DATABASE_SCHEMA.md`).*

Une fois le code collé :
```bash
php artisan migrate
```

### 1.3 Créer l'API Controller
```bash
php artisan make:controller Api/ProjectController
```

Dans `app/Http/Controllers/Api/ProjectController.php` :
```php
public function index() {
    return response()->json(\App\Models\Project::all());
}
```

Dans `routes/api.php` :
```php
use App\Http\Controllers\Api\ProjectController;
Route::get('/projects', [ProjectController::class, 'index']);
```

### 1.4 Configurer CORS (Indispensable)
Ouvre `config/cors.php` et assure-toi que :
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:3000', 'https://ton-site-prod.com'],
'supports_credentials' => true,
```

---

## 🔗 Phase 2 : Frontend Next.js

Une fois que `http://localhost:8000/api/projects` répond du JSON, passe ici.

### 2.1 Variables d'environnement
Crée `.env.local` à la racine de Next.js :
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 2.2 Créer le Service API
Crée `src/lib/api.ts` (ou `services/api.ts`) pour gérer les appels facilement.

```typescript
// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchAPI(endpoint: string, token?: string) {
  const headers: any = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { headers });
  
  if (!res.ok) {
    throw new Error('Erreur API');
  }
  
  return res.json();
}
```

---

## 🔐 Phase 3 : Authentification (JWT / Token)

Puisque le frontend est statique, on utilise un Token stocké dans le navigateur.

### Côté Laravel
Utilise **Laravel Sanctum**.
1. `php artisan install:api`
2. Route Login :
```php
Route::post('/login', function (Request $request) {
    $user = User::where('email', $request->email)->first();
    // ... vérification password ...
    $token = $user->createToken('auth_token')->plainTextToken;
    return response()->json(['token' => $token, 'user' => $user]);
});
```

### Côté Next.js
Lors du login, tu reçois le `token`.
Tu le stockes : `localStorage.setItem('auth_token', token);`
Et tu le réutilises ensuite dans tes appels API.

---

## ✅ Prochaines étapes immédiates pour toi

1.  Terminer l'installation Laravel.
2.  Créer la table `projects` et `users`.
3.  Me dire quand tu as ta première route API qui marche ! 👍
