import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { app } from './app';
import { config } from './config';

const BACKUP_DIR = path.join(__dirname, '../firestore-data');
const MAX_BACKUPS = 3;

function pruneBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;
  const entries = fs
    .readdirSync(BACKUP_DIR)
    .filter(e => e.startsWith('firestore_export'))
    .sort()
    .reverse();
  for (const entry of entries.slice(MAX_BACKUPS)) {
    fs.rmSync(path.join(BACKUP_DIR, entry), {recursive: true, force: true});
  }
}

function startBackup() {
  const INTERVAL_MS = 30_000;
  const [hostname, port] = config.firestore.emulatorHost!.split(':');
  const PAYLOAD = JSON.stringify({
    database: `projects/${config.firestore.projectId}/databases/(default)`,
    exportDirectory: '/data',
  });

  const run = () => {
    const req = http.request(
      {
        hostname,
        port: Number(port),
        path: `/emulator/v1/projects/${config.firestore.projectId}:export`,
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
      },
      res => {
        if (res.statusCode !== 200) {
          let body = '';
          res.on('data', chunk => (body += chunk));
          res.on('end', () =>
            console.error(`Firestore backup failed: ${res.statusCode} ${body}`)
          );
        } else {
          console.log(`[${new Date().toISOString()}] Firestore backup OK`);
          res.resume();
          pruneBackups();
        }
      }
    );
    req.on('error', err =>
      console.error(`Firestore backup error: ${err.message}`)
    );
    req.end(PAYLOAD);
  };

  run();
  setInterval(run, INTERVAL_MS);
}

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Conduit server listening on port ${config.port}...`);
  if (config.firestore.emulatorHost) startBackup();
});
