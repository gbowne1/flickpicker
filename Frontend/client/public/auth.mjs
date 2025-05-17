// Import dependencies
import { state } from './state.mjs';
import { showToast, showError } from './utils.mjs';
import { updateAuthUI, closeModal } from './ui.mjs';

// Default test users
// Default test users with roles
const defaultUsers = [
    { username: 'user1', password: 'pass1', role: 'user' },
    { username: 'admin', password: 'admin123', role: 'admin' }
];

// Cached DOM elements for performance optimization
const cachedElements = {};

// Cache commonly accessed DOM elements
function cacheDOM() {
    cachedElements.loginBtn = document.getElementById('loginBtn');
    cachedElements.usernameInput = document.getElementById('username');
    cachedElements.passwordInput = document.getElementById('password');
    cachedElements.logoutLink = document.getElementById('logoutLink');
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

// Attach event listeners to the DOM elements
function attachEventListeners() {
    // Login Button
    if (cachedElements.loginBtn) {
        cachedElements.loginBtn.addEventListener('click', debounce(async (e) => {
            e.preventDefault();
            const username = cachedElements.usernameInput?.value;
            const password = cachedElements.passwordInput?.value;

            if (!validateCredentials(username, password)) {
                showError('Please fill in all fields');
                return;
            }

            try {
                await login(username, password);
                closeModal('loginModal'); // Close modal upon successful login
            } catch (error) {
                showError(error.message);
            }
        }, 300)); // Debounce to prevent rapid button clicks
    }

    // Logout Link
    if (cachedElements.logoutLink) {
        cachedElements.logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
}

// Validate user credentials
function validateCredentials(username, password) {
    return !!username?.trim() && !!password?.trim();
}

// Login function// Login function with role assignment and storing user session and role in storage
export async function login(username, password) {
    const loginBtn = cachedElements.loginBtn;
    if (loginBtn) loginBtn.disabled = true; // Disable button to prevent multiple clicks

    try {
        showToast('Authenticating...');
        const user = defaultUsers.find(u => u.username === username && u.password === password);

        if (user) {
            state.currentUser = { username: user.username, role: user.role };

            // Save user session and role to sessionStorage
            sessionStorage.setItem('user', JSON.stringify(state.currentUser));

            // Save user role to localStorage for longer persistence
            localStorage.setItem('userRole', user.role);

            // Optionally, store role in cookies (for broader access across tabs and browser restarts)
            document.cookie = `userRole=${user.role}; path=/; max-age=86400`; // Cookie expires in 1 day

            // Optionally, store role in IndexedDB (for more complex storage needs)
            // (IndexedDB logic would go here if needed)

            updateAuthUI();
            showToast(`Welcome, ${user.username}!`);

        } else {
            throw new Error('Invalid credentials');
        }
    } finally {
        if (loginBtn) loginBtn.disabled = false; // Re-enable button after processing
    }
}

// Logout function
export function logout() {
    state.currentUser = null;

    // Remove user session from sessionStorage
    sessionStorage.removeItem('user');

    updateAuthUI(); // Update UI after logout
    showToast('You have logged out successfully');
}

// Handle login/logout logic
export function handleLogout() {
    logout();
}

export function isAuthenticated() {
    return !!state.currentUser;
}

// Debounce utility function to optimize event handling
function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Initialize authentication module
export function initializeAuth() {
    cacheDOM(); // Cache DOM elements
    attachEventListeners(); // Attach event listeners
    loadUserFromSession(); // Load session on page load
}

// Event listener for page load
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
}, {once: true});


// Initialize IndexedDB for role storage
function storeUserInIndexedDB(user) {
    const request = indexedDB.open('authDB', 1);

    request.onupgradeneeded = function (e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'username' });
        }
    };

    request.onsuccess = function (e) {
        const db = e.target.result;
        const transaction = db.transaction('users', 'readwrite');
        const store = transaction.objectStore('users');
        store.put(user); // Save user with role
    };
}

export function isAuthorized(requiredRole) {
    if (!state.currentUser) {
        return false;
    }
    return state.currentUser.role === requiredRole;
}

export function loadUserFromSession() {
    const savedUser = sessionStorage.getItem('user');
    const savedRole = localStorage.getItem('userRole') || getCookie('userRole'); // Fallback to cookie if localStorage is empty

    if (savedUser) {
        const user = JSON.parse(savedUser);
        state.currentUser = { username: user.username, role: savedRole || user.role };
        updateAuthUI();
    }
}