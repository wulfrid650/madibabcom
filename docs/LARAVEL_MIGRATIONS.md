# Scripts de Migration Laravel

Copiez ces blocs de code dans les fichiers de migration correspondants de votre projet Laravel (`database/migrations/...`).

## 1. Table `users` (Modification)
*Si la table existe déjà, créez une migration `add_fields_to_users_table`.*

```php
public function up()
{
    Schema::table('users', function (Blueprint $table) {
        // Ajout des colonnes spécifiques si elles n'existent pas
        if (!Schema::hasColumn('users', 'role')) {
            $table->enum('role', ['ADMIN', 'MANAGER', 'CLIENT', 'WORKER'])->default('CLIENT');
        }
        if (!Schema::hasColumn('users', 'phone')) {
            $table->string('phone')->nullable();
        }
        if (!Schema::hasColumn('users', 'avatar')) {
            $table->string('avatar')->nullable();
        }
    });
}
```

## 2. Table `projects`

```php
public function up()
{
    Schema::create('projects', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->text('description')->nullable();
        $table->string('address');
        
        // Coordonnées GPS pour la carte
        $table->decimal('latitude', 10, 8)->nullable();
        $table->decimal('longitude', 11, 8)->nullable();

        $table->string('status')->default('PLANNING'); // PLANNING, IN_PROGRESS, COMPLETED, ON_HOLD
        $table->date('start_date')->nullable();
        $table->date('expected_end_date')->nullable();

        // Clés étrangères
        $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
        $table->foreignId('manager_id')->nullable()->constrained('users')->onDelete('set null');
        
        $table->timestamps();
    });
}
```

## 3. Table `project_phases` (Timeline)

```php
public function up()
{
    Schema::create('project_phases', function (Blueprint $table) {
        $table->id();
        $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
        
        $table->string('name'); // ex: "Fondations", "Gros Œuvre"
        $table->string('status')->default('PENDING'); // PENDING, IN_PROGRESS, DONE
        $table->date('start_date')->nullable();
        $table->date('end_date')->nullable();
        
        $table->timestamps();
    });
}
```

## 4. Table `daily_logs` (Journal de Chantier)

```php
public function up()
{
    Schema::create('daily_logs', function (Blueprint $table) {
        $table->id();
        $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
        $table->foreignId('author_id')->constrained('users'); // L'auteur du rapport
        
        $table->date('date');
        $table->text('notes')->nullable(); // Météo, avancement, remarques
        
        $table->timestamps();
    });
}
```

## 5. Table `safety_incidents` (Sécurité)

```php
public function up()
{
    Schema::create('safety_incidents', function (Blueprint $table) {
        $table->id();
        $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
        $table->foreignId('reporter_id')->constrained('users');
        
        $table->date('date');
        $table->enum('severity', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])->default('LOW');
        $table->text('description');
        $table->string('status')->default('OPEN'); // OPEN, INVESTIGATING, CLOSED
        
        $table->timestamps();
    });
}
```

## 6. Table `media` (Photos & Documents)

```php
public function up()
{
    Schema::create('media', function (Blueprint $table) {
        $table->id();
        
        // Polymorphisme simplifié ou liens optionnels
        $table->foreignId('daily_log_id')->nullable()->constrained('daily_logs')->onDelete('cascade');
        $table->foreignId('safety_incident_id')->nullable()->constrained('safety_incidents')->onDelete('cascade');
        
        $table->string('url'); // Chemin du fichier stocké
        $table->enum('type', ['BEFORE', 'DURING', 'AFTER', 'DOCUMENT'])->default('DURING');
        
        $table->timestamps();
    });
}
```

## 7. Table `equipment` (Matériel)

```php
public function up()
{
    Schema::create('equipment', function (Blueprint $table) {
        $table->id();
        $table->string('name'); // ex: "Marteau Piqueur Hilti"
        $table->string('serial_number')->nullable();
        $table->enum('status', ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN'])->default('AVAILABLE');
        
        // Si assigné, lien vers le projet
        $table->foreignId('current_project_id')->nullable()->constrained('projects')->onDelete('set null');
        
        $table->timestamps();
    });
}
```
