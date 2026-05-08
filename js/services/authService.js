// ========== AUTH ==========
const DEFAULT_USER = 'admin';
const DEFAULT_PASS = '1844iasd';
const SESSION_KEY = 'ja_session_user';

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function randomSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashWithSalt(password, salt) {
  return sha256(salt + password);
}

function isValidFirebaseKey(key) {
  return !/[.#$\[\]/]/.test(key) && key.length > 0;
}

async function ensureDefaultUser() {
  const snap = await db.ref('ja_users').once('value');
  if (!snap.val()) {
    const salt = randomSalt();
    const hash = await hashWithSalt(DEFAULT_PASS, salt);
    await db.ref('ja_users').child(DEFAULT_USER).set({ password: hash, salt });
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';

  if (!isValidFirebaseKey(username)) {
    errorEl.textContent = '❌ El usuario contiene caracteres no permitidos.';
    return;
  }

  try {
    const snap = await db.ref('ja_users').child(username).once('value');
    const userData = snap.val();
    if (!userData) {
      errorEl.textContent = '❌ Usuario o contraseña incorrectos.';
      return;
    }
    const hash = await hashWithSalt(password, userData.salt || '');
    if (hash !== userData.password) {
      errorEl.textContent = '❌ Usuario o contraseña incorrectos.';
      return;
    }
    sessionStorage.setItem(SESSION_KEY, username);
    showApp();
    loadFromFirebase();
  } catch (err) {
    console.error('Error en login:', err);
    errorEl.textContent = '⚠️ Error al conectar. Verifica tu conexión.';
  }
}

function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').textContent = '';
  document.getElementById('app-root').classList.remove('visible');
  document.getElementById('login-screen').classList.remove('hidden');
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-root').classList.add('visible');
}

async function initAuth() {
  await ensureDefaultUser();
  const savedUser = sessionStorage.getItem(SESSION_KEY);
  if (savedUser) {
    const snap = await db.ref('ja_users').child(savedUser).once('value');
    if (snap.val()) {
      showApp();
      loadFromFirebase();
      return;
    }
    sessionStorage.removeItem(SESSION_KEY);
  }
}
