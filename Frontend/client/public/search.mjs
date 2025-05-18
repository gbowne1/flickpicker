import { displayMovies } from './movies.mjs';
import { loadMovies } from './loadMovies.mjs';

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

export const searchMoviesHandler = debounce(function(event) {
    const searchInput = event.target;
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) {
        console.log('No search term provided');
        loadMovies(); // Load all movies if search term is empty
        return;
    }
    fetch(`http://localhost:3000/search-movies?query=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(filteredMovies => {
            console.log('Filtered Movies:', filteredMovies);
            displayMovies(filteredMovies);
        })
        .catch(error => {
            console.error('Error fetching movies:', error);
        });
}, 300);