const admin = require('firebase-admin');
const serviceAccount = require('../firebasesecrets.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();
const FieldValue = admin.firestore.FieldValue;

module.exports = { db, auth, FieldValue, admin };