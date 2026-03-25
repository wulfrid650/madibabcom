const fs = require('fs');
const path = require('path');

const lockPath = path.join(process.cwd(), '.next', 'dev', 'lock');

function log(message) {
  process.stdout.write(`[predev] ${message}\n`);
}

if (!fs.existsSync(lockPath)) {
  process.exit(0);
}

let fd;
try {
  // If this succeeds, the lock is stale and we can remove it safely.
  fd = fs.openSync(lockPath, 'r+');
  fs.closeSync(fd);
  fs.unlinkSync(lockPath);
  log(`lock stale supprimé: ${lockPath}`);
  process.exit(0);
} catch (error) {
  const code = error && typeof error === 'object' ? error.code : '';
  if (code === 'EBUSY' || code === 'EPERM') {
    log('une instance Next.js est déjà active (lock en cours d\'utilisation).');
    log('arrêtez l\'instance existante puis relancez `npm run dev`.');
    process.exit(1);
  }

  process.stderr.write(`[predev] impossible de gérer le lock: ${error?.message || 'erreur inconnue'}\n`);
  process.exit(1);
}
