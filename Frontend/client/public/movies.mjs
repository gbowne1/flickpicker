import { state } from '../public/state.mjs';
import { showError } from '../public/utils.mjs';

// Check if running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Helper function to create movie card HTML
function createMovieCardHTML(movie) {
    const fallbackImage = '/path/to/default.jpg';
    return `
        <div class="col">
            <div class="card h-100" data-movie-id="${movie.id}">
                <img src="${movie.imageUrl || fallbackImage}" 
                     class="card-img-top" alt="${movie.title || 'Movie Poster'}" loading="lazy"
                     onerror="this.src='${fallbackImage}'">
                <div class="card-body">
                    <h5 class="card-title">${movie.title || 'Untitled Movie'}</h5>
                    <p class="card-text">
                        <small class="text-muted">
                            ${movie.year || 'Unknown Year'} • ${movie.runtime || 'Unknown Runtime'} • ${movie.ratings || 'Unrated'}
                        </small>
                    </p>
                    <p class="card-text">${movie.category || 'General'}</p>
                    <p class="card-text">
                        <small class="text-muted">
                            Requested by ${movie.requestedBy?.username || 'Unknown User'}
                        </small>
                    </p>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="btn-group">
                            <button type="button" class="btn btn-sm btn-outline-primary vote-btn" 
                                    data-vote="up" ${state.currentUser ? '' : 'disabled'}>
                                <i class="fas fa-thumbs-up"></i> 
                                <span class="vote-count">${movie.voteCount || 0}</span>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-primary" 
                                    onclick="showMovieDetails('${movie.id}')">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                        </div>
                        <button type="button" 
                            class="btn btn-sm btn-primary add-to-playlist-btn" 
                            onclick="addToPlaylist(${movie.id}, '${movie.title}', '${movie.imageUrl}')"
                            ${state.currentUser ? '' : 'disabled'}>
                            <i class="fas fa-plus"></i> Add to Playlist
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update movie display dynamically
function updateMovieDisplay() {
    if (!isBrowser) return;

    const movieTable = document.getElementById('movie-table');
    const loadingPlaceholder = document.getElementById('loading-placeholder');

    // Hide loading placeholder
    if (loadingPlaceholder) loadingPlaceholder.style.display = 'none';

    // Show fallback message if no movies are found
    if (!state.filteredMovies || state.filteredMovies.length === 0) {
        movieTable.innerHTML = `
            <div class="col-12 text-center">
                <p>No movies found matching your criteria.</p>
            </div>
        `;
        return;
    }

    // Render movie cards dynamically
    movieTable.innerHTML = state.filteredMovies.map(createMovieCardHTML).join('');
}

// Unified fetch function with fallback
async function fetchMovies(source = '../Data/movieList.json') {
    try {
        const response = await fetch(source);
        if (!response.ok) throw new Error('Failed to fetch movies');

        const movies = await response.json();
        state.movies = movies;
        state.filteredMovies = [...movies]; // Default filtered list
        updateMovieDisplay(); // Update UI after fetching
    } catch (error) {
        console.error('Error fetching movies:', error);
        showError('Failed to fetch movies. Please try again later.');
    }
}

// Explicit function to display movies (wrapper around updateMovieDisplay)
function displayMovies() {
    if (!isBrowser) return;
    updateMovieDisplay();
}

// Export module functions, including displayMovies
export { createMovieCardHTML, updateMovieDisplay, fetchMovies, displayMovies };
