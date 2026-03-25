# Schéma de Base de Données (Proposition)

Ce schéma est conçu pour supporter les fonctionnalités avancées de BTP : Suivi de chantier, Matériel, Incidents, Facturation progressive.

## Entités Principales

### 1. Utilisateurs & Rôles (User)
Gère les accès (Admin, Chef de Chantier, Client, Ouvrier).
- `User`: id, email, password, role, name, phone, avatar.

### 2. Chantiers (Project)
Le cœur du système.
- `Project`: id, name, description, address, gpsCoordinates (lat/lng), status (PLANNING, IN_PROGRESS, COMPLETED, ON_HOLD), startDate, expectedEndDate.
- Relations: `Client` (User), `Manager` (User), `Phases`, `Documents`, `Incidents`.

### 3. Phases de Chantier (ProjectPhase)
Pour le suivi visuel "Timeline".
- `ProjectPhase`: id, projectId, name (ex: "Terrassement"), status (PENDING, IN_PROGRESS, DONE), startDate, endDate.

### 4. Journal de Chantier & Photos (SiteUpdate / Media)
Le suivi "Avant/Pendant/Après".
- `DailyLog`: id, projectId, authorId, date, notes (météo, avancement).
- `Media`: id, logId, url, type (IMAGE_BEFORE, IMAGE_DURING, IMAGE_AFTER, DOCUMENT), uploadedAt.

### 5. Matériel (Equipment)
Gestion des actifs.
- `Equipment`: id, name, serialNumber, status (AVAILABLE, IN_USE, MAINTENANCE, BROKEN), currentProjectId.
- `MaintenanceLog`: Historique des pannes/réparations.

### 6. Sécurité & Incidents (SafetyIncident)
Pour la conformité.
- `SafetyIncident`: id, projectId, reporterId, date, severity (LOW, MEDIUM, HIGH, CRITICAL), description, status (OPEN, RESOLVED), photos.

### 7. Facturation & Devis (Finance)
Gestion financière progressive.
- `Quote` (Devis): id, projectId, totalAmount, status (DRAFT, SENT, ACCEPTED, REJECTED), validUntil.
- `Invoice` (Facture): id, quoteId, amount, type (DEPOSIT, PROGRESS, FINAL), status (PENDING, PAID, OVERDUE).

### 8. Formation (CMS Training - existant)
- `Course`, `UserProgress`, `Certification`.

---

## Modèle Relationnel (Pseudo-code Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  role          Role      @default(CLIENT) // ADMIN, MANAGER, WORKER, CLIENT
  name          String?
  projects      Project[] @relation("ProjectClient")
  managedSites  Project[] @relation("ProjectManager")
  dailyLogs     DailyLog[]
  incidents     SafetyIncident[]
}

model Project {
  id            String    @id @default(cuid())
  name          String
  address       String
  latitude      Float?
  longitude     Float?
  status        ProjectStatus @default(PLANNING)
  
  clientId      String
  client        User      @relation("ProjectClient", fields: [clientId], references: [id])
  
  managerId     String?
  manager       User?     @relation("ProjectManager", fields: [managerId], references: [id])

  phases        ProjectPhase[]
  dailyLogs     DailyLog[]
  equipment     Equipment[]
  incidents     SafetyIncident[]
  quotes        Quote[]
}

model ProjectPhase {
  id          String   @id @default(cuid())
  name        String   // "Terrassement", "Fondation"
  status      PhaseStatus @default(PENDING)
  project     Project  @relation(fields: [projectId], references: [id])
  projectId   String
}

model DailyLog {
  id          String   @id @default(cuid())
  date        DateTime @default(now())
  notes       String?  // Météo, problèmes rencontrés
  photos      Media[]
  project     Project  @relation(fields: [projectId], references: [id])
  projectId   String
  author      User     @relation(fields: [authorId], references: [id])
  authorId    String
}

model Media {
  id          String   @id @default(cuid())
  url         String
  type        MediaType // BEFORE, DURING, AFTER, DOC
  log         DailyLog? @relation(fields: [logId], references: [id])
  logId       String?
}

model Equipment {
  id            String   @id @default(cuid())
  name          String
  status        EquipmentStatus // AVAILABLE, IN_USE, MAINTENANCE
  currentProject Project? @relation(fields: [currentProjectId], references: [id])
  currentProjectId String?
}

model SafetyIncident {
  id          String   @id @default(cuid())
  severity    Severity // LOW, CRITICAL
  description String
  project     Project  @relation(fields: [projectId], references: [id])
  projectId   String
}
```
