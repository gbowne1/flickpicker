// ui.mjs
import { state } from './state.mjs';

// Password toggle
export function togglePasswordVisibility() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');

    if (togglePassword && passwordInput && eyeIcon) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            if (type === 'password') {
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            } else {
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            }
        });
    }
}

export function handleMovieSearch() {
    const movieSearch = document.getElementById('movieSearch');
    const searchButton = document.getElementById('searchButton');

    if (movieSearch && searchButton) {
        movieSearch.addEventListener('input', () => {
            searchButton.disabled = movieSearch.value.trim().length < 2;
        });
    }
}

// Theme toggle for light/dark mode
// Theme toggle for light/dark mode
export function toggleTheme() {
    const icon = document.querySelector('#themeToggle i');
    icon.classList.toggle('fa-sun');
    icon.classList.toggle('fa-moon');

    // Optional: Toggle actual theme classes here
    document.body.classList.toggle('dark-theme');
}

// Update the UI based on authentication status
export function updateAuthUI() {
    const loginButton = document.getElementById('loginButton');
    const userMenu = document.getElementById('userMenu');

    if (state.currentUser) {
        loginButton?.classList.add('d-none');
        userMenu?.classList.remove('d-none');

        const usernameElement = document.querySelector('#userMenu .username');
        if (usernameElement) {
            usernameElement.textContent = state.currentUser.username;
        }
    } else {
        loginButton?.classList.remove('d-none');
        userMenu?.classList.add('d-none');
    }
}

// Handle modal closure
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const bsModal = window.bootstrap.Modal.getInstance(modal);

    if (bsModal) {
        bsModal.hide();
    }
}
