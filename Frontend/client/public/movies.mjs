import { state } from './state.mjs';
import { showError, showToast } from './utils.mjs';
import { addToPlaylist } from './playlist.mjs';
import { Pagination} from './pagination.mjs';
import { isAuthenticated } from './auth.mjs';

const DEFAULT_PAGE_SIZE = 5;
const MOVIES_PER_PAGE_VALUES = [1, 5, 10, 15];

// Cache DOM elements
const cachedElements = {
    movieTable: document.getElementById('movie-table'),
};

document.addEventListener('DOMContentLoaded', () => {
    // Load the full movie list on initial page load
    loadMovies();

    // Event listener for adding movie form submission
    const form = document.getElementById("add-movie-form");
    if (form) {
        form.addEventListener("submit", saveMovie);
    } else {
        console.error("Form with id 'add-movie-form' not found.");
    }

    // Add movie button visibility
    const addMovieButton = document.getElementById("addMovieButton");
    if (addMovieButton) {
        try {
            addMovieButton.style.display = isAuthenticated() ? "block" : "none";
        } catch (error) {
            console.error("Error checking authentication:", error);
            addMovieButton.style.display = "none";
        }
    }

    // Initialize event listeners for filters
    document.querySelectorAll("#filter-section select").forEach((select) => {
        select.addEventListener("change", applyFilters);
    });

    const paginationSection = document.getElementById('movies-pagination-section');
    const pagination = new Pagination(paginationSection, renderMoviesPage, DEFAULT_PAGE_SIZE, MOVIES_PER_PAGE_VALUES, 'movies-page-size-select');

    if (cachedElements.movieTable) {
        cachedElements.movieTable.addEventListener("click", handleMovieInteraction);
    }
}, { once: true });

function handleMovieInteraction(event) {
    const target = event.target;
    const movieCard = target.closest(".card");

    if (!movieCard) return;

    const movieId = movieCard.dataset.movieId;

    if (target.classList.contains("vote-btn")) {
        handleVote(movieId, target.dataset.vote);
    } else if (target.classList.contains("add-to-playlist-btn")) {
        addToPlaylist(movieId);
    }
}

function handleVote(movieId, voteType) {
    if (
        !state.currentUser ||
        !state.currentUser.id ||
        !state.currentUser.username
    ) {
        showToast("Please log in to vote", "warning");
        return;
    }

    console.log(`Vote ${voteType} for movie ${movieId}`);
    // Update UI or make API call to record vote
}

// Helper function to create movie card HTML
function createMovieCardHTML(movie) {
    const fallbackImage = '';
    return `
        <div class="col">
            <div class="card h-100" data-movie-id="${movie.id}">
                <img src="${movie.imageUrl || fallbackImage}" 
                     class="card-img-top" alt="${movie.title || 'Movie Poster'}" loading="lazy"
                     onerror="this.onerror=null; this.src='${fallbackImage}'">
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

// Explicit function to display movies (wrapper around updateMovieDisplay)
function displayMovies(movieList) {
    state.filteredMovies = movieList;
    updateMovieDisplay(movieList);
}

async function loadMovies() {
    let movies = [];
    const spinner = document.getElementById('loading-spinner');
    const movieTable = document.getElementById('movie-table');
    try {
        if (spinner) spinner.style.display = 'inline-block';
        if (movieTable) movieTable.style.display = 'none';
        movies = await fetchMovies();
        if (movies && movies.length > 0) {
            localStorage.setItem("moviesList", JSON.stringify(movies));
            state.movies = movies;
            state.filteredMovies = movies; // Default filtered list
            updateMovieDisplay(); // Update UI after fetching
            return;
        }
    } catch (error) {
        console.error('Error fetching movies:', error);
        showToast('Failed to fetch movies. Please try again later.', 'error');
     }finally {
    //     // Hide spinner and show movie table
        if (spinner) spinner.style.display = 'none';
        if (movieTable) movieTable.style.display = 'flex';
    }

    try {
        movies = getMoviesFromLocalStorage();
        if (movies && movies.length > 0) {
            state.movies = movies;
            state.filteredMovies = movies; // Default filtered list
            updateMovieDisplay(); // Update UI after fetching
        }
    } catch (error) {
        console.error('Error fetching movies from local storage:', error);
        showToast('Failed to fetch movies from local storage. Please try again later.', 'error');
    }
}

// Unified fetch function with fallback
async function fetchMovies() {
    try {
        const response = await fetch("/movies");
        if (!response.ok) throw new Error('Failed to fetch movies');

        console.log("📂 Fetching movies from: /movies"); // Debugging line
        return await response.json();
    } catch (error) {
        console.error('Error fetching movies:', error);
        showToast('Failed to fetch movies. Please try again later.', 'error');
    }

}

// Function to fetch movies from local storage
function getMoviesFromLocalStorage() {
    const storedMoviesStr = localStorage.getItem("moviesList");
    if (storedMoviesStr) {
        return JSON.parse(storedMoviesStr)
    }
}

// Filtering and Sorting
function applyFilters() {
    const genre = document.getElementById("genre-filter").value.toLowerCase();
    const year = document.getElementById("year-filter").value;
    const rating = document.getElementById("rating-filter").value;
    const sortOrder = document.getElementById("sort-order").value;

    state.filteredMovies = state.movies.filter((movie) => {
    const genreMatch =
        !genre ||
        (movie.category && movie.category.toLowerCase().includes(genre));
    const yearMatch = !year || movie.year.toString() === year;
    const ratingMatch = !rating || movie.rating === rating;
    return genreMatch && yearMatch && ratingMatch;
    });

    sortMovies(sortOrder);
    updateMovieDisplay();
}
  
function sortMovies(criteria) {
    state.filteredMovies.sort((a, b) => {
        switch (criteria) {
            case "title":
                return a.title.localeCompare(b.title);
            case "year":
                return b.year - a.year;
            case "runtime":
                return (parseFloat(a.runtime) || 0) - (parseFloat(b.runtime) || 0);
            default:
                return 0;
        }
    });
}


async function saveMovie(event) {
  event.preventDefault(); // Prevent form submission
  console.log("saveMovie function triggered");
  const form = document.getElementById("add-movie-form");
  const formData = new FormData(form);

  const movieData = {
    id: Date.now(), // Generate unique ID
    title: formData.get("title"),
    dateWatched: formData.get("dateWatched"),
    watched: false,
    year: formData.get("year"),
    category: formData.get("category"),
    trailerLink: formData.get("trailerLink"),
    movieLink: formData.get("movieLink"),
    modernTrailerLink: formData.get("modernTrailerLink"),
    requestedBy: {
      userId: "anonymous",
      username: formData.get("requestedBy"),
      platform: "Web",
    },
    language: formData.get("language"),
    subtitles: formData.get("subtitles") === "true",
    voteCount: 0,
    imageUrl: "",
    runtime: "",
    ratings: "",
    trailerPrivate: false,
    moviePrivate: false,
  };
  console.log("Movie data to be saved:", movieData);

  try {
    const response = await fetch("http://localhost:3000/save-movie", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(movieData),
    });

    if (!response.ok) {
      throw new Error("Failed to save movie");
    }

    alert("Movie saved successfully!");
    form.reset(); // Reset the form
  } catch (error) {
    console.error("Error saving movie:", error);
    alert("Failed to save movie. Please try again.");
  }
}

function validateMovieData(data) {
  return (
    data.title && // Title is required
    data.year && // Year is required
    data.category && // Category is required
    data.requestedBy.username && // Requested By username is required
    data.language && // Language is required
    data.trailerLink && // Trailer Link is required
    data.movieLink && // Movie Link is required
    data.modernTrailerLink && // Modern Trailer Link is required
    data.dateWatched && // Date Watched is required
    data.imdbLink && // IMDB Link is required
    data.tmdbLink && // TMDB Link is required
    !isNaN(data.year) && // Year should be a number
    typeof data.subtitles === "boolean" // Subtitles should be boolean
  );
}

function renderMoviesPage(page, pageSize) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = state.filteredMovies.slice(start, end);
    displayMovies(pageItems);
}

// Export module functions, including displayMovies
export { createMovieCardHTML, updateMovieDisplay, displayMovies, saveMovie, renderMoviesPage };
