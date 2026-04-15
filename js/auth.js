// User database management
let usersDB = [];
const USERS_STORAGE_KEY = 'senteYoCreditsUsers';
const LEGACY_USERS_STORAGE_KEY = 'premierBankUsers';
const CURRENT_USER_ID_KEY = 'currentUserId';
const SESSION_USER_CACHE_KEY = 'senteCurrentUserProfile';
const LAST_USER_ID_KEY = 'senteLastUserId';
const REMEMBER_EMAIL_KEY = 'senteRememberEmail';
const DEMO_USER_EMAIL = 'demo@bank.com';
const DEMO_USER_PASSWORD = 'demo123';
const DEMO_USER_ID = 'demo-local-user';

const firebaseServices = window.firebaseServices || null;
const firebaseAuth = firebaseServices && firebaseServices.auth ? firebaseServices.auth : null;
const firebaseDb = firebaseServices && firebaseServices.db ? firebaseServices.db : null;

function isFirebaseEnabled() {
    return Boolean(firebaseAuth && firebaseDb);
}

function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
}

function safeParse(jsonValue, fallbackValue) {
    try {
        return JSON.parse(jsonValue);
    } catch (error) {
        return fallbackValue;
    }
}

function createAccountNumber() {
    return 'UG-' + Math.floor(100000 + Math.random() * 900000);
}

function createDefaultUser(user) {
    const source = user || {};
    const profile = source.profile || {};

    return {
        id: String(source.id || Date.now()),
        name: (source.name || 'Sente Member').trim(),
        email: normalizeEmail(source.email || ''),
        password: source.password || '',
        phone: (source.phone || '').trim(),
        balance: Number(source.balance || 0),
        accountNumber: source.accountNumber || createAccountNumber(),
        createdAt: source.createdAt || new Date().toISOString(),
        transactions: Array.isArray(source.transactions) ? source.transactions : [],
        savingsBalance: Number(source.savingsBalance || 0),
        savingsHistory: Array.isArray(source.savingsHistory) ? source.savingsHistory : [],
        loans: Array.isArray(source.loans) ? source.loans : [],
        insurance: source.insurance || null,
        profile: {
            address: typeof profile.address === 'string' ? profile.address : '',
            city: typeof profile.city === 'string' ? profile.city : '',
            country: typeof profile.country === 'string' && profile.country ? profile.country : 'Uganda',
            notificationEmail: profile.notificationEmail !== false,
            notificationSMS: Boolean(profile.notificationSMS)
        }
    };
}

function createDemoUser() {
    return createDefaultUser({
        id: DEMO_USER_ID,
        name: 'Sente Demo',
        email: DEMO_USER_EMAIL,
        password: DEMO_USER_PASSWORD,
        phone: '+256700123456',
        balance: 2500000,
        accountNumber: 'UG-900001',
        createdAt: '2026-01-01T00:00:00.000Z',
        transactions: [
            {
                type: 'Deposit',
                amount: 1200000,
                description: 'Opening balance',
                date: '2026-01-01T10:00:00.000Z'
            },
            {
                type: 'Transfer',
                amount: 150000,
                description: 'Airtime top-up',
                date: '2026-02-14T14:35:00.000Z'
            }
        ],
        savingsBalance: 450000,
        savingsHistory: [],
        loans: [],
        insurance: {
            type: 'Starter Cover',
            status: 'active'
        },
        profile: {
            address: '',
            city: 'Kampala',
            country: 'Uganda',
            notificationEmail: true,
            notificationSMS: false
        }
    });
}

function saveUsers() {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersDB));
}

function upsertLocalUser(user) {
    const normalizedUser = createDefaultUser(user);
    const index = usersDB.findIndex(function(existing) {
        return existing.id === normalizedUser.id;
    });

    if (index !== -1) {
        usersDB[index] = normalizedUser;
    } else {
        usersDB.push(normalizedUser);
    }

    saveUsers();
    return normalizedUser;
}

function removeDemoUsers(users) {
    return users.filter(function(user) {
        return normalizeEmail(user.email) !== DEMO_USER_EMAIL;
    });
}

function cleanInvalidSessionReferences() {
    const cachedProfile = safeParse(sessionStorage.getItem(SESSION_USER_CACHE_KEY), null);
    const sessionUserId = sessionStorage.getItem(CURRENT_USER_ID_KEY);
    const lastUserId = localStorage.getItem(LAST_USER_ID_KEY);
    const rememberEmail = normalizeEmail(localStorage.getItem(REMEMBER_EMAIL_KEY) || '');
    const hasUserById = function(id) {
        return Boolean(id && usersDB.some(function(user) {
            return user.id === id;
        }));
    };

    if (cachedProfile && normalizeEmail(cachedProfile.email) === DEMO_USER_EMAIL) {
        sessionStorage.removeItem(SESSION_USER_CACHE_KEY);
    }

    if (sessionUserId && !hasUserById(sessionUserId)) {
        sessionStorage.removeItem(CURRENT_USER_ID_KEY);
        sessionStorage.removeItem(SESSION_USER_CACHE_KEY);
    }

    if (lastUserId && !hasUserById(lastUserId)) {
        localStorage.removeItem(LAST_USER_ID_KEY);
    }

    if (rememberEmail === DEMO_USER_EMAIL) {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
}

function ensureDemoUser() {
    const seededDemoUser = createDemoUser();
    const demoIndex = usersDB.findIndex(function(user) {
        return normalizeEmail(user.email) === DEMO_USER_EMAIL;
    });

    if (demoIndex === -1) {
        usersDB.push(seededDemoUser);
    } else {
        usersDB[demoIndex] = seededDemoUser;
    }

    saveUsers();
}

// Load users from localStorage.
function loadUsers() {
    const storedUsersJson = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem(LEGACY_USERS_STORAGE_KEY);
    if (storedUsersJson) {
        const parsedUsers = safeParse(storedUsersJson, []);
        usersDB = Array.isArray(parsedUsers) ? parsedUsers.map(createDefaultUser) : [];
    } else {
        usersDB = [];
    }

    usersDB = removeDemoUsers(usersDB);
    cleanInvalidSessionReferences();
    ensureDemoUser();
}

function cacheCurrentUser(user) {
    if (user) {
        const normalizedUser = createDefaultUser(user);
        sessionStorage.setItem(CURRENT_USER_ID_KEY, normalizedUser.id);
        sessionStorage.setItem(SESSION_USER_CACHE_KEY, JSON.stringify(normalizedUser));
        localStorage.setItem(LAST_USER_ID_KEY, normalizedUser.id);
        return;
    }

    sessionStorage.removeItem(CURRENT_USER_ID_KEY);
    sessionStorage.removeItem(SESSION_USER_CACHE_KEY);
    localStorage.removeItem(LAST_USER_ID_KEY);
}

// Get current logged in user.
function getCurrentUser() {
    const cachedProfile = safeParse(sessionStorage.getItem(SESSION_USER_CACHE_KEY), null);
    if (cachedProfile && cachedProfile.id) {
        const normalizedCachedProfile = createDefaultUser(cachedProfile);
        upsertLocalUser(normalizedCachedProfile);
        return normalizedCachedProfile;
    }

    const sessionUserId = sessionStorage.getItem(CURRENT_USER_ID_KEY);
    const fallbackUserId = localStorage.getItem(LAST_USER_ID_KEY);
    const userId = sessionUserId || fallbackUserId;

    if (!userId) {
        return null;
    }

    const existing = usersDB.find(function(user) {
        return user.id === userId;
    });

    if (existing) {
        cacheCurrentUser(existing);
        return existing;
    }

    return null;
}

// Set current user.
function setCurrentUser(user) {
    cacheCurrentUser(user);
}

// Check if user is logged in.
function isLoggedIn() {
    return getCurrentUser() !== null;
}

function currentPageName() {
    return (window.location.pathname.split('/').pop() || '').toLowerCase();
}

function isProtectedPage() {
    return [
        'dashboard.html',
        'overview.html',
        'deposit.html',
        'withdraw.html',
        'transfer.html',
        'savings.html',
        'loans.html',
        'insurance.html',
        'history.html',
        'profile.html'
    ].indexOf(currentPageName()) !== -1;
}

function isAuthPage() {
    const page = currentPageName();
    return page === 'login.html' || page === 'signup.html';
}

// Redirect if not logged in.
function requireAuth() {
    if (isLoggedIn()) {
        return true;
    }

    if (isFirebaseEnabled() && firebaseAuth.currentUser) {
        return true;
    }

    window.location.href = 'login.html';
    return false;
}

// Redirect if already logged in.
function requireGuest() {
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

function mapFirebaseError(error, fallbackMessage) {
    const code = error && error.code ? error.code : '';

    switch (code) {
        case 'auth/email-already-in-use':
            return 'This email is already registered.';
        case 'auth/invalid-email':
            return 'Please use a valid email address.';
        case 'auth/weak-password':
            return 'Password must be at least 6 characters.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a moment and try again.';
        default:
            return fallbackMessage;
    }
}

function localLogin(email, password) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = (password || '').trim();
    const user = usersDB.find(function(record) {
        return normalizeEmail(record.email) === normalizedEmail && record.password === normalizedPassword;
    });

    if (user) {
        setCurrentUser(user);
        return { success: true, user: user };
    }

    return { success: false, message: 'Invalid email or password.' };
}

function localSignup(name, email, password, phone) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = (name || '').trim();
    const normalizedPhone = (phone || '').trim();
    const normalizedPassword = (password || '').trim();

    const existingUser = usersDB.find(function(user) {
        return normalizeEmail(user.email) === normalizedEmail;
    });

    if (existingUser) {
        return { success: false, message: 'This email is already registered.' };
    }

    const newUser = createDefaultUser({
        id: Date.now().toString(),
        name: normalizedName,
        email: normalizedEmail,
        password: normalizedPassword,
        phone: normalizedPhone,
        balance: 0,
        accountNumber: createAccountNumber(),
        createdAt: new Date().toISOString(),
        transactions: [],
        savingsBalance: 0,
        savingsHistory: [],
        loans: [],
        insurance: null,
        profile: {
            address: '',
            city: '',
            country: 'Uganda',
            notificationEmail: true,
            notificationSMS: false
        }
    });

    upsertLocalUser(newUser);
    setCurrentUser(newUser);

    return { success: true, user: newUser };
}

async function readRemoteUser(uid) {
    if (!isFirebaseEnabled() || !uid) {
        return null;
    }

    const snapshot = await firebaseDb.collection('users').doc(uid).get();
    if (!snapshot.exists) {
        return null;
    }

    return createDefaultUser(Object.assign({}, snapshot.data(), { id: uid }));
}

async function writeRemoteUser(userProfile) {
    if (!isFirebaseEnabled() || !userProfile || !userProfile.id) {
        return;
    }

    const normalizedUser = createDefaultUser(userProfile);
    const payload = Object.assign({}, normalizedUser, {
        password: '',
        updatedAt: new Date().toISOString()
    });

    await firebaseDb.collection('users').doc(normalizedUser.id).set(payload, { merge: true });
}

async function ensureRemoteUser(firebaseUser, seedUser) {
    const uid = firebaseUser && firebaseUser.uid ? firebaseUser.uid : '';
    if (!uid) {
        return null;
    }

    const remoteProfile = await readRemoteUser(uid);
    if (remoteProfile) {
        return remoteProfile;
    }

    const seed = seedUser || {};
    const defaultUser = createDefaultUser({
        id: uid,
        name: seed.name || firebaseUser.displayName || 'Sente Member',
        email: firebaseUser.email || seed.email || '',
        password: '',
        phone: seed.phone || '',
        balance: Number(seed.balance || 0),
        accountNumber: seed.accountNumber || createAccountNumber(),
        createdAt: seed.createdAt || new Date().toISOString(),
        transactions: Array.isArray(seed.transactions) ? seed.transactions : [],
        savingsBalance: Number(seed.savingsBalance || 0),
        savingsHistory: Array.isArray(seed.savingsHistory) ? seed.savingsHistory : [],
        loans: Array.isArray(seed.loans) ? seed.loans : [],
        insurance: seed.insurance || null,
        profile: seed.profile || {
            address: '',
            city: '',
            country: 'Uganda',
            notificationEmail: true,
            notificationSMS: false
        }
    });

    await writeRemoteUser(defaultUser);
    return defaultUser;
}

// Login function - FIXED to ensure proper redirect
async function login(email, password) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = (password || '').trim();

    if (isFirebaseEnabled()) {
        try {
            const credential = await firebaseAuth.signInWithEmailAndPassword(normalizedEmail, normalizedPassword);
            const firebaseUser = credential.user;
            const localSeed = usersDB.find(function(user) {
                return normalizeEmail(user.email) === normalizedEmail;
            });

            const profile = await ensureRemoteUser(firebaseUser, localSeed);
            const syncedProfile = createDefaultUser(Object.assign({}, profile, {
                id: firebaseUser.uid,
                email: normalizeEmail(firebaseUser.email || normalizedEmail),
                password: ''
            }));

            upsertLocalUser(syncedProfile);
            setCurrentUser(syncedProfile);
            return { success: true, user: syncedProfile };
        } catch (error) {
            const fallbackLoginResult = localLogin(normalizedEmail, normalizedPassword);
            if (fallbackLoginResult.success) {
                return fallbackLoginResult;
            }

            return {
                success: false,
                message: mapFirebaseError(error, 'Unable to log in right now. Please try again.')
            };
        }
    }

    return localLogin(normalizedEmail, normalizedPassword);
}

// Signup function.
async function signup(name, email, password, phone) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = (name || '').trim();
    const normalizedPhone = (phone || '').trim();
    const normalizedPassword = (password || '').trim();

    if (isFirebaseEnabled()) {
        try {
            const credential = await firebaseAuth.createUserWithEmailAndPassword(normalizedEmail, normalizedPassword);
            const firebaseUser = credential.user;

            const newUser = createDefaultUser({
                id: firebaseUser.uid,
                name: normalizedName,
                email: normalizeEmail(firebaseUser.email || normalizedEmail),
                password: '',
                phone: normalizedPhone,
                balance: 0,
                accountNumber: createAccountNumber(),
                createdAt: new Date().toISOString(),
                transactions: [],
                savingsBalance: 0,
                savingsHistory: [],
                loans: [],
                insurance: null,
                profile: {
                    address: '',
                    city: '',
                    country: 'Uganda',
                    notificationEmail: true,
                    notificationSMS: false
                }
            });

            await writeRemoteUser(newUser);
            upsertLocalUser(newUser);
            setCurrentUser(newUser);
            return { success: true, user: newUser };
        } catch (error) {
            return {
                success: false,
                message: mapFirebaseError(error, 'Unable to create account right now. Please try again.')
            };
        }
    }

    return localSignup(normalizedName, normalizedEmail, normalizedPassword, normalizedPhone);
}

// Logout function.
async function logout() {
    setCurrentUser(null);

    if (isFirebaseEnabled()) {
        try {
            await firebaseAuth.signOut();
        } catch (error) {
            console.warn('Firebase sign-out error:', error.message);
        }
    }

    window.location.href = 'index.html';
}

// Update user data.
function updateUser(updatedUser) {
    const normalizedUser = upsertLocalUser(updatedUser);
    setCurrentUser(normalizedUser);

    if (isFirebaseEnabled()) {
        const activeFirebaseUser = firebaseAuth.currentUser;
        const uid = normalizedUser.id || (activeFirebaseUser && activeFirebaseUser.uid);

        if (uid) {
            const payload = Object.assign({}, normalizedUser, {
                id: uid,
                email: normalizeEmail(normalizedUser.email || (activeFirebaseUser && activeFirebaseUser.email) || ''),
                password: ''
            });

            firebaseDb
                .collection('users')
                .doc(uid)
                .set(payload, { merge: true })
                .catch(function(error) {
                    console.warn('Firebase profile sync failed:', error.message);
                });
        }
    }

    return true;
}

function syncSessionFromFirebase() {
    if (!isFirebaseEnabled()) {
        return;
    }

    firebaseAuth.onAuthStateChanged(async function(firebaseUser) {
        if (!firebaseUser) {
            if (!isLoggedIn() && isProtectedPage()) {
                window.location.href = 'login.html';
            }
            return;
        }

        const existing = getCurrentUser();
        if (existing && existing.id === firebaseUser.uid) {
            if (isAuthPage()) {
                window.location.href = 'dashboard.html';
            }
            return;
        }

        try {
            const localSeed = usersDB.find(function(user) {
                return normalizeEmail(user.email) === normalizeEmail(firebaseUser.email || '');
            });
            const mergedUser = await ensureRemoteUser(firebaseUser, localSeed);

            if (mergedUser) {
                upsertLocalUser(mergedUser);
                setCurrentUser(mergedUser);
            }

            if (isAuthPage()) {
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            console.warn('Firebase session sync failed:', error.message);
        }
    });
}

// Load users and wire session sync on script load.
loadUsers();
syncSessionFromFirebase();

// Helper function to show error message
function showAlertMessage(message, isError = true) {
    const alertDiv = document.getElementById('alertMessage');
    if (alertDiv) {
        alertDiv.innerHTML = '<div class="alert alert-error">' + message + '</div>';
    }
}

// Clear alert message
function clearAlertMessage() {
    const alertDiv = document.getElementById('alertMessage');
    if (alertDiv) {
        alertDiv.innerHTML = '';
    }
}

// Handle remember me functionality
function handleRememberMe() {
    const loginEmailEl = document.getElementById('loginEmail');
    const rememberEl = document.getElementById('rememberMe');
    
    if (loginEmailEl && rememberEl) {
        const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
        if (rememberedEmail && !loginEmailEl.value) {
            loginEmailEl.value = rememberedEmail;
            rememberEl.checked = true;
        }
        
        // Add change listener to remember checkbox
        rememberEl.addEventListener('change', function() {
            if (this.checked && loginEmailEl.value) {
                localStorage.setItem(REMEMBER_EMAIL_KEY, loginEmailEl.value.trim());
            } else if (!this.checked) {
                localStorage.removeItem(REMEMBER_EMAIL_KEY);
            }
        });
        
        // Also save when email field changes if remember is checked
        loginEmailEl.addEventListener('change', function() {
            if (rememberEl.checked && this.value) {
                localStorage.setItem(REMEMBER_EMAIL_KEY, this.value.trim());
            }
        });
    }
}

// Password toggle functionality
function setupPasswordToggle() {
    document.querySelectorAll('.auth-password-toggle').forEach((button) => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            if (!targetInput) return;
            const isPassword = targetInput.type === 'password';
            targetInput.type = isPassword ? 'text' : 'password';
            this.textContent = isPassword ? 'Hide' : 'Show';
        });
    });
}

// Setup demo credentials button
function setupDemoButton() {
    const useDemoButton = document.getElementById('useDemoCredentials');
    if (useDemoButton) {
        useDemoButton.addEventListener('click', function() {
            const emailInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');
            const rememberEl = document.getElementById('rememberMe');
            
            if (emailInput) emailInput.value = DEMO_USER_EMAIL;
            if (passwordInput) passwordInput.value = DEMO_USER_PASSWORD;
            if (rememberEl) rememberEl.checked = true;
            if (rememberEl && emailInput) {
                localStorage.setItem(REMEMBER_EMAIL_KEY, emailInput.value.trim());
            }
        });
    }
}

// FIXED: Login form handler with proper redirect
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        const submitButton = loginForm.querySelector('button[type="submit"]');
        
        if (!emailInput || !passwordInput) return;
        
        const email = emailInput.value;
        const password = passwordInput.value;
        
        // Validate inputs
        if (!email || !password) {
            showAlertMessage('Please enter both email and password.');
            return;
        }
        
        // Disable button and show loading state
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Signing in...';
        }
        
        clearAlertMessage();
        
        // Attempt login
        const result = await login(email, password);
        
        // Re-enable button if login fails
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Sign In';
        }
        
        if (result.success) {
            // Save remember me if checked
            const rememberEl = document.getElementById('rememberMe');
            if (rememberEl && rememberEl.checked) {
                localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
            } else {
                localStorage.removeItem(REMEMBER_EMAIL_KEY);
            }
            
            // FIXED: Force redirect to dashboard
            // Use window.location.replace to prevent back button issues
            window.location.href = 'dashboard.html';
        } else {
            showAlertMessage(result.message || 'Login failed. Please try again.');
        }
    });
}

// Setup signup form if it exists
function setupSignupForm() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('signupName');
        const emailInput = document.getElementById('signupEmail');
        const phoneInput = document.getElementById('signupPhone');
        const passwordInput = document.getElementById('signupPassword');
        const confirmInput = document.getElementById('signupConfirm');
        const submitButton = signupForm.querySelector('button[type="submit"]');
        
        if (!nameInput || !emailInput || !phoneInput || !passwordInput || !confirmInput) return;
        
        const name = nameInput.value;
        const email = emailInput.value;
        const phone = phoneInput.value;
        const password = passwordInput.value;
        const confirm = confirmInput.value;
        
        // Validation
        if (!name || !email || !phone || !password) {
            showAlertMessage('Please fill in all fields.');
            return;
        }
        
        if (password !== confirm) {
            showAlertMessage('Passwords do not match.');
            return;
        }
        
        if (password.length < 6) {
            showAlertMessage('Password must be at least 6 characters.');
            return;
        }
        
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Creating account...';
        }
        
        clearAlertMessage();
        
        const result = await signup(name, email, password, phone);
        
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Sign Up';
        }
        
        if (result.success) {
            window.location.href = 'dashboard.html';
        } else {
            showAlertMessage(result.message || 'Signup failed. Please try again.');
        }
    });
}

// Setup logout link
function setupLogout() {
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Initialize all form handlers when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        handleRememberMe();
        setupPasswordToggle();
        setupDemoButton();
        setupLoginForm();
        setupSignupForm();
        setupLogout();
        
        // If already logged in and on auth page, redirect to dashboard
        if (isLoggedIn() && isAuthPage()) {
            window.location.href = 'dashboard.html';
        }
    });
} else {
    handleRememberMe();
    setupPasswordToggle();
    setupDemoButton();
    setupLoginForm();
    setupSignupForm();
    setupLogout();
    
    if (isLoggedIn() && isAuthPage()) {
        window.location.href = 'dashboard.html';
    }
}

// Export for use in other files
window.auth = {
    getCurrentUser: getCurrentUser,
    isLoggedIn: isLoggedIn,
    requireAuth: requireAuth,
    requireGuest: requireGuest,
    updateUser: updateUser,
    logout: logout,
    usersDB: function() { return usersDB; },
    firebaseEnabled: isFirebaseEnabled
};