// Admin-only Firebase access: Auth, full CRUD, uploads and seeding. Loaded only by admin.html.
// Real authorisation is enforced by firestore.rules / storage.rules; the checks here are for UX.
import {
  getFirestore, collection, collectionGroup, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  writeBatch, serverTimestamp,
} from 'firebase/firestore';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider,
  signOut, sendEmailVerification,
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app, firebaseReady, adminEmail } from './app.js';
import { buildSeed } from '../data/seed.js';

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

// ── Messages & comments ─────────────────────────────────────
export const setMessageRead = (id, read) => updateDoc(doc(db(), 'contact_messages', id), { read });
export const listComments = async () => rows(await getDocs(collectionGroup(db(), 'comments')));
export const removeComment = (path) => deleteDoc(doc(db(), path));

// ── Uploads (Firebase Storage) ──────────────────────────────
const MAX_UPLOAD = 5 * 1024 * 1024;

export async function uploadImage(file, folder = 'blog') {
  if (!file.type.startsWith('image/')) throw new Error('Only image files can be uploaded.');
  if (file.size > MAX_UPLOAD) throw new Error('Images must be 5 MB or smaller.');
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const path = `${folder}/${Date.now()}-${safe}`;
  const snapshot = await uploadBytes(ref(getStorage(app), path), file, { contentType: file.type });
  return getDownloadURL(snapshot.ref);
}

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
