import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import {app} from './app';
import {config} from './config';

function startBackup() {
  const INTERVAL_MS = 30_000;
  const [hostname, port] = config.firestore.emulatorHost!.split(':');
  const backupDir = path.join(__dirname, '../firestore-data/latest');
  fs.mkdirSync(backupDir, {recursive: true});
  const PAYLOAD = JSON.stringify({
    database: `projects/${config.firestore.projectId}/databases/(default)`,
    exportDirectory: '/data/latest',
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
