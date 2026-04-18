process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8200';

import {Firestore} from '@google-cloud/firestore';

const firestore = new Firestore({projectId: 'conduit-dev'});

async function dump() {
  for (const name of ['users', 'articles', 'comments', 'follows']) {
    const snapshot = await firestore.collection(name).get();
    if (snapshot.empty) continue;
    console.log(`\n=== ${name} (${snapshot.size}) ===`);
    for (const doc of snapshot.docs) {
      console.log(JSON.stringify({id: doc.id, ...doc.data()}, null, 2));
    }
  }
}

dump().catch(console.error);
