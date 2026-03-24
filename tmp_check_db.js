
import * as admin from 'firebase-admin';

async function check() {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
    }
    const db = admin.firestore();
    const snapshot = await db.collection('ai_kocs').limit(1).get();
    if (snapshot.empty) {
        console.log('Collection ai_kocs is empty');
    } else {
        console.log('First doc:', snapshot.docs[0].data());
    }
}
check();
