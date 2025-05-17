// Safeguard: Ensure this code runs only in a browser context
if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('search.mjs is intended to be executed in a browser environment only.');
}

// Import the displayMovies function from movies.mjs
import { displayMovies } from './movies.mjs';

export function searchMovies() {
    document.addEventListener('DOMContentLoaded', () => {
        const searchInput = document.getElementById('movieSearch');
        if (!searchInput) {
            console.error('Element with ID "movieSearch" not found.');
            return;
        }

        // Debounced search functionality for smoother interaction
        const debounce = (func, wait) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        };

        const debouncedSearch = debounce(() => {
            const searchTerm = searchInput.value.trim().toLowerCase();

            // Validate the search term
            if (!searchTerm) {
                displayMovies([]); // Clear display if no search term
                return;
            }

            // Fetch filtered results from the server
            fetch(`/search-movies?query=${encodeURIComponent(searchTerm)}`)
                .then(response => response.json())
                .then(filteredMovies => {
                    displayMovies(filteredMovies); // Render movies on the page
                })
                .catch(error => {
                    console.error('Error fetching movies:', error);
                });
        }, 300); // Set debounce delay (300ms)

        searchInput.addEventListener('input', debouncedSearch);
    }, {once: true});
}
