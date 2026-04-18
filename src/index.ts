import * as http from 'http';
import { app } from './app';
import { config } from './config';

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
          console.error(`Firestore backup failed: ${res.statusCode}`);
        } else {
          console.log(`[${new Date().toISOString()}] Firestore backup OK`);
        }
        res.resume();
      }
    );
    req.on('error', err => console.error(`Firestore backup error: ${err.message}`));
    req.end(PAYLOAD);
  };

  run();
  setInterval(run, INTERVAL_MS);
}

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Conduit server listening on port ${config.port}...`);
  if (config.firestore.emulatorHost) startBackup();
});
