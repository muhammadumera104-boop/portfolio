// Admin-only Firebase access: Auth, full CRUD, uploads, email replies and seeding. Loaded only by admin.html.
// Real authorisation is enforced by firestore.rules and by the Vercel functions (they verify the login
// token); the checks here are for UX.
import {
  getFirestore, collection, collectionGroup, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  writeBatch, serverTimestamp, arrayUnion,
} from 'firebase/firestore';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider,
  signOut, sendEmailVerification,
} from 'firebase/auth';
import { app, firebaseReady, adminEmail } from './app.js';
import { buildSeed } from '../data/seed.js';
import { uploadToCloudinary } from '../shared/cloudinary.js';

const db = () => getFirestore(app);
const auth = () => getAuth(app);
const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data(), _path: d.ref.path }));

export { firebaseReady, adminEmail };

// ── Auth ────────────────────────────────────────────────────
export const watchAuth = (cb) => onAuthStateChanged(auth(), cb);
export const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth(), email, password);
export const loginWithGoogle = () => signInWithPopup(auth(), new GoogleAuthProvider());
export const logout = () => signOut(auth());
export const sendVerification = () => sendEmailVerification(auth().currentUser);

/** UX check only — the security rules are what actually protect the data. */
export const isAdminUser = (user) =>
  Boolean(user && user.email && user.email.toLowerCase() === adminEmail && user.emailVerified);

// ── Generic CRUD ────────────────────────────────────────────
export async function listAll(name) {
  return rows(await getDocs(collection(db(), name)));
}

/** Creates (id omitted) or updates a document. Returns its id. */
export async function saveDoc(name, id, data) {
  if (id) {
    await setDoc(doc(db(), name, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return id;
  }
  const created = await addDoc(collection(db(), name), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return created.id;
}

export const removeDoc = (name, id) => deleteDoc(doc(db(), name, id));

// ── Blog ────────────────────────────────────────────────────
export const savePost = (id, data) =>
  saveDoc('blog_posts', id, id ? data : { ...data, views: 0 });
export const setPublished = (id, published) => updateDoc(doc(db(), 'blog_posts', id), { published, updatedAt: serverTimestamp() });

// ── Server calls (Vercel functions in /api) ─────────────────
// These need the owner's login: the function verifies the Firebase ID token before doing anything.
async function callApi(path, body) {
  const user = auth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  let response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach the server. When running locally, start it with "vercel dev" so the /api functions exist.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `The server answered ${response.status}.`);
  return data;
}

// ── Messages & comments ─────────────────────────────────────
export const setMessageRead = (id, read) => updateDoc(doc(db(), 'contact_messages', id), { read });

/** Emails a reply to the visitor, then records it on the message so the thread stays visible in the dashboard. */
export async function replyToMessage(message, text) {
  await callApi('/api/reply', {
    to: message.email,
    name: message.name,
    subject: message.subject,
    message: text,
    original: message.message,
  });
  await updateDoc(doc(db(), 'contact_messages', message.id), {
    read: true,
    repliedAt: serverTimestamp(),
    replies: arrayUnion({ text, sentAt: new Date().toISOString() }),
  });
}

export const listComments = async () => rows(await getDocs(collectionGroup(db(), 'comments')));
export const removeComment = (path) => deleteDoc(doc(db(), path));

// ── Uploads (Cloudinary, signed by /api/cloudinary-sign) ────
const LIMITS = { image: 8 * 1024 * 1024, video: 100 * 1024 * 1024 };

async function upload(file, resourceType, folder) {
  if (!file.type.startsWith(`${resourceType}/`)) throw new Error(`Only ${resourceType} files can be uploaded here.`);
  if (file.size > LIMITS[resourceType]) throw new Error(`${resourceType === 'image' ? 'Images' : 'Videos'} must be ${LIMITS[resourceType] / 1024 / 1024} MB or smaller.`);
  const signed = await callApi('/api/cloudinary-sign', { folder: `portfolio/${folder}` });
  return uploadToCloudinary(file, signed, resourceType);
}

/** Uploads an image to Cloudinary and returns its https URL. */
export const uploadImage = (file, folder = 'blog') => upload(file, 'image', folder);
/** Uploads a video to Cloudinary and returns its https URL. */
export const uploadVideo = (file, folder = 'videos') => upload(file, 'video', folder);

// ── Seeding ─────────────────────────────────────────────────
/** Writes the portfolio content from content.js. Existing docs with the same id are overwritten. */
export async function seedDatabase() {
  const seed = buildSeed();
  const batch = writeBatch(db());
  let count = 0;
  for (const [name, items] of Object.entries(seed)) {
    for (const { id, data } of items) {
      const extra = name === 'blog_posts' ? { views: 0 } : {};
      batch.set(doc(db(), name, id), { ...data, ...extra, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      count += 1;
    }
  }
  await batch.commit();
  return count;
}
