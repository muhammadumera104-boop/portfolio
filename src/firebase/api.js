// Public, read-mostly Firestore access used by the home page, blog and post pages.
// The admin dashboard has its own module (admin-api.js) so visitors never download Auth/Storage code.
import {
  getFirestore, collection, doc, getDocs, query, where, limit,
  addDoc, updateDoc, increment, serverTimestamp,
} from 'firebase/firestore';
import { app, firebaseReady } from './app.js';
import { newestFirst } from '../shared/utils.js';

const db = () => {
  if (!firebaseReady) throw new Error('Firebase is not configured. Check the VITE_FIREBASE_* values in .env.');
  return getFirestore(app);
};

// Firestore retries quietly when the database is unreachable or not created yet, so a plain
// promise can hang forever. Every call gets a deadline so the UI can show an error or a fallback.
const withTimeout = (promise, ms = 10000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore did not respond in time.')), ms)),
  ]);

const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const byOrder = (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0);

export const listProjects = async () => rows(await withTimeout(getDocs(collection(db(), 'projects')))).sort(byOrder);
export const listSkills = async () => rows(await withTimeout(getDocs(collection(db(), 'skills')))).sort(byOrder);
export const listExperiences = async () => rows(await withTimeout(getDocs(collection(db(), 'experiences')))).sort(byOrder);

// Equality filters only, so no composite index is needed; sorting happens in the browser.
export const listPublishedPosts = async () =>
  rows(await withTimeout(getDocs(query(collection(db(), 'blog_posts'), where('published', '==', true))))).sort(newestFirst);

export async function getPostBySlug(slug) {
  const snap = await withTimeout(getDocs(query(collection(db(), 'blog_posts'), where('slug', '==', slug), where('published', '==', true), limit(1))));
  return snap.empty ? null : rows(snap)[0];
}

/** Counts one view per browser tab session. Failures are ignored on purpose. */
export async function countView(postId) {
  const key = `viewed:${postId}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    await updateDoc(doc(db(), 'blog_posts', postId), { views: increment(1) });
    return true;
  } catch {
    return false;
  }
}

export async function listComments(postId) {
  const snap = await withTimeout(getDocs(collection(db(), 'blog_posts', postId, 'comments')));
  return rows(snap).sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
}

export const addComment = (postId, { name, content }) =>
  withTimeout(addDoc(collection(db(), 'blog_posts', postId, 'comments'), { name, content, createdAt: serverTimestamp() }));

export const sendContactMessage = ({ name, email, subject = '', message }) =>
  withTimeout(addDoc(collection(db(), 'contact_messages'), { name, email, subject, message, read: false, createdAt: serverTimestamp() }));
