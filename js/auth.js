// User database management
let usersDB = [];
const USERS_STORAGE_KEY = 'senteYoCreditsUsers';
const LEGACY_USERS_STORAGE_KEY = 'premierBankUsers';

function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
}

// Initialize demo user
function initDemoUser() {
    const demoUser = {
        id: '1',
        name: 'Alex Okello',
        email: 'demo@bank.com',
        password: 'demo123',
        phone: '+256 700 123456',
        balance: 5250.75,
        accountNumber: 'UG-887234',
        createdAt: new Date().toISOString(),
        transactions: [
            { id: 't1', type: 'Deposit', amount: 5000, date: new Date().toISOString(), newBalance: 5000, description: 'Initial deposit' },
            { id: 't2', type: 'Withdrawal', amount: 200, date: new Date(Date.now() - 86400000).toISOString(), newBalance: 4800, description: 'ATM withdrawal' },
            { id: 't3', type: 'Deposit', amount: 450.75, date: new Date(Date.now() - 43200000).toISOString(), newBalance: 5250.75, description: 'Salary deposit' }
        ],
        savingsBalance: 2500.00,
        savingsHistory: [],
        loans: [],
        insurance: {
            active: true,
            type: 'Basic Health',
            premium: 50,
            startDate: new Date().toISOString()
        },
        profile: {
            address: 'Bweyogerer, Kampala',
            city: 'Kampala',
            country: 'Uganda',
            notificationEmail: true,
            notificationSMS: false
        }
    };
    
    const existing = usersDB.find(u => u.email === demoUser.email);
    if (!existing) {
        usersDB.push(demoUser);
    }
}

// Load users from localStorage
function loadUsers() {
    const stored = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem(LEGACY_USERS_STORAGE_KEY);
    if (stored) {
        usersDB = JSON.parse(stored);
        // Migrate legacy key seamlessly.
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersDB));
    } else {
        usersDB = [];
        initDemoUser();
        saveUsers();
    }
}

// Save users to localStorage
function saveUsers() {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersDB));
}

// Get current logged in user
function getCurrentUser() {
    const userId = sessionStorage.getItem('currentUserId');
    if (userId) {
        return usersDB.find(u => u.id === userId);
    }
    return null;
}

// Set current user
function setCurrentUser(user) {
    if (user) {
        sessionStorage.setItem('currentUserId', user.id);
    } else {
        sessionStorage.removeItem('currentUserId');
    }
}

// Check if user is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Redirect if not logged in
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Redirect if already logged in
function requireGuest() {
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

// Login function
function login(email, password) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = (password || '').trim();
    const user = usersDB.find(u =>
        normalizeEmail(u.email) === normalizedEmail &&
        u.password === normalizedPassword
    );
    if (user) {
        setCurrentUser(user);
        return { success: true, user: user };
    }
    return { success: false, message: 'Invalid email or password.' };
}

// Signup function
function signup(name, email, password, phone) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = (name || '').trim();
    const normalizedPhone = (phone || '').trim();
    const normalizedPassword = (password || '').trim();

    // Check if email already exists
    const existingUser = usersDB.find(u => normalizeEmail(u.email) === normalizedEmail);
    if (existingUser) {
        return { success: false, message: 'This email is already registered.' };
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name: normalizedName,
        email: normalizedEmail,
        password: normalizedPassword,
        phone: normalizedPhone,
        balance: 0,
        accountNumber: 'UG-' + Math.floor(100000 + Math.random() * 900000),
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
    };
    
    usersDB.push(newUser);
    saveUsers();
    setCurrentUser(newUser);
    return { success: true, user: newUser };
}

// Logout function
function logout() {
    setCurrentUser(null);
    window.location.href = 'index.html';
}

// Update user data
function updateUser(updatedUser) {
    const index = usersDB.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
        usersDB[index] = updatedUser;
        saveUsers();
        setCurrentUser(updatedUser);
        return true;
    }
    return false;
}

// Load users on script load
loadUsers();

// Event listeners for login page
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const result = login(email, password);
        
        if (result.success) {
            window.location.href = 'dashboard.html';
        } else {
            const alertDiv = document.getElementById('alertMessage');
            alertDiv.innerHTML = '<div class="alert alert-error">' + result.message + ' Demo account: demo@bank.com / demo123.</div>';
        }
    });
}

// Event listeners for signup page
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const phone = document.getElementById('signupPhone').value;
        const password = document.getElementById('signupPassword').value;
        const confirm = document.getElementById('signupConfirm').value;
        
        if ((password || '').trim() !== (confirm || '').trim()) {
            document.getElementById('alertMessage').innerHTML = '<div class="alert alert-error">Passwords do not match.</div>';
            return;
        }
        
        if ((password || '').trim().length < 6) {
            document.getElementById('alertMessage').innerHTML = '<div class="alert alert-error">Password must be at least 6 characters.</div>';
            return;
        }
        
        const result = signup(name, email, password, phone);
        
        if (result.success) {
            window.location.href = 'dashboard.html';
        } else {
            document.getElementById('alertMessage').innerHTML = '<div class="alert alert-error">' + result.message + '</div>';
        }
    });
}

// Logout link
if (document.getElementById('logoutLink')) {
    document.getElementById('logoutLink').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
}

// Export for use in other files
window.auth = {
    getCurrentUser,
    isLoggedIn,
    requireAuth,
    updateUser,
    logout,
    usersDB: () => usersDB
};
