import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve('./serviceAccountKey.local.json');

function loadServiceAccount() {
  try {
    const raw = fs.readFileSync(serviceAccountPath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to read Firebase service account. Did you configure FIREBASE_SERVICE_ACCOUNT_PATH?', error);
    throw error;
  }
}

const serviceAccount = loadServiceAccount();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

const STORY_COLLECTION = 'livestory';
const STORY_DOC = '泰坦尼克';

function mapStoryDocument(doc) {
  if (!doc.exists) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    Storyname: data.Storyname || data.storyname || data.display_fields?.Storyname || data.display_fields?.storyname || data.playname || doc.id,
    Storyimage: data.Storyimage || data.storyImage || data.display_fields?.Storyimage || null,
    raw: data
  };
}

app.get('/stories', async (_req, res) => {
  try {
    const snapshot = await db.collection(STORY_COLLECTION).get();
    const stories = snapshot.docs
      .map((doc) => mapStoryDocument(doc))
      .filter(Boolean)
      .map(({ raw, ...rest }) => rest);
    return res.json({ stories });
  } catch (error) {
    console.error('List stories error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/story/:id?', async (req, res) => {
  const docId = req.params.id || STORY_DOC;
  try {
    const doc = await db.collection(STORY_COLLECTION).doc(docId).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Story not found' });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Fetch story error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/decision', async (req, res) => {
  const { decisionId, optionId, playerId } = req.body || {};
  if (!decisionId || !optionId || !playerId) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const docRef = db.collection('decisions').doc(decisionId);
    await docRef.set({
      decisionId,
      optionId,
      playerId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: false });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Decision save error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/audience-vote', async (req, res) => {
  const { engagementId, optionId, viewerId } = req.body || {};
  if (!engagementId || !optionId || !viewerId) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const docRef = db.collection('audienceVotes').doc();
    await docRef.set({
      engagementId,
      optionId,
      viewerId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Audience vote error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
