import { getFirebaseApp } from './firebase.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let authInstance;
let dbInstance;

function getAuthInstance() {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

function getDbInstance() {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
  }
  return dbInstance;
}

async function upsertUserProfile(user) {
  const db = getDbInstance();
  const ref = doc(db, 'users', user.uid);
  await setDoc(
    ref,
    {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      provider: user.providerData?.[0]?.providerId || 'google',
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function fetchUserProfile(uid) {
  const snapshot = await getDoc(doc(getDbInstance(), 'users', uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveUserProfile(uid, data) {
  await setDoc(
    doc(getDbInstance(), 'users', uid),
    {
      ...data,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export function getCurrentUser() {
  return getAuthInstance().currentUser;
}

export function initAuthUI({ loginButton, logoutButton, userInfoContainer }) {
  const auth = getAuthInstance();
  let loginInFlight = false;

  if (loginButton) {
    loginButton.addEventListener('click', async () => {
      if (loginInFlight) return;
      loginInFlight = true;
      loginButton.disabled = true;
      const originalText = loginButton.textContent;
      loginButton.textContent = '登录中…';
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        await upsertUserProfile(result.user);
      } catch (error) {
        console.error('Google 登录失败:', error.code, error.message, error);
        if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
          alert(`登录失败：${error.code || error.message || '未知错误'}`);
        }
      } finally {
        loginInFlight = false;
        loginButton.disabled = false;
        loginButton.textContent = originalText;
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('退出登录失败:', error);
        alert('退出失败，请稍后再试');
      }
    });
  }

  onAuthStateChanged(auth, (user) => {
    if (!userInfoContainer) return;

    if (user) {
      userInfoContainer.innerHTML = `
        <div class="flex items-center gap-3">
          <img src="${user.photoURL || 'https://via.placeholder.com/48'}" alt="头像" class="h-12 w-12 rounded-full border border-white/20" />
          <div>
            <p class="text-sm text-white/60">已登录</p>
            <p class="text-base font-semibold">${user.displayName || user.email}</p>
          </div>
        </div>
      `;
      if (loginButton) loginButton.classList.add('hidden');
      if (logoutButton) logoutButton.classList.remove('hidden');
    } else {
      userInfoContainer.innerHTML = '<p class="text-sm text-white/60">还未登录</p>';
      if (loginButton) loginButton.classList.remove('hidden');
      if (logoutButton) logoutButton.classList.add('hidden');
    }
  });
}

export function requireAuth(callback) {
  const auth = getAuthInstance();
  return onAuthStateChanged(auth, (user) => {
    callback(user || null);
  });
}
