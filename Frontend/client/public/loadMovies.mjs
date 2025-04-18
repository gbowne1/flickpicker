// Import dependencies if necessary
import { showError } from './utils.mjs'; // Optional: Error handling utility

// Path to the movieList.json file
const JSON_FILE_PATH = "../Data/movieList.json";

// Cache DOM elements
const cachedElements = {
    movieGrid: document.getElementById('movie-grid'),
};

// Load movies from different sources
export async function loadMovies() {
    try {
        let movies = [];

        // Attempt loading from local storage
        const localMovies = loadFromLocalStorage();
        if (localMovies) {
            movies = localMovies;
        }

        // Attempt loading from session storage if not found in local storage
        if (!movies.length) {
            const sessionMovies = loadFromSessionStorage();
            if (sessionMovies) {
                movies = sessionMovies;
            }
        }

        // Attempt loading from IndexedDB
        if (!movies.length) {
            const indexedMovies = await loadFromIndexedDB();
            if (indexedMovies) {
                movies = indexedMovies;
            }
        }

        // Attempt loading from cookies
        if (!movies.length) {
            const cookieMovies = loadFromCookies();
            if (cookieMovies) {
                movies = cookieMovies;
            }
        }

        // Attempt loading from Cache Storage
        if (!movies.length) {
            const cacheMovies = await loadFromCacheStorage();
            if (cacheMovies) {
                movies = cacheMovies;
            }
        }

        // Fallback: Load from JSON file served from localhost
        if (!movies.length) {
            movies = await loadFromJson();
        }

        // Deduplicate movies
        movies = deduplicateMovies(movies);

        // Render the movies to the HTML div
        renderMovies(movies);
    } catch (error) {
        showError(`Failed to load movies: ${error.message}`);
    }
}

// Deduplicate movies
function deduplicateMovies(movies) {
    const movieMap = new Map();
    movies.forEach(movie => movieMap.set(movie.id, movie));
    return Array.from(movieMap.values());
}

// Load movies from local storage
function loadFromLocalStorage() {
    const movies = localStorage.getItem('movieList');
    return movies ? JSON.parse(movies) : null;
}

// Load movies from session storage
function loadFromSessionStorage() {
    const movies = sessionStorage.getItem('movieList');
    return movies ? JSON.parse(movies) : null;
}

// Load movies from IndexedDB
async function loadFromIndexedDB() {
    const dbName = 'MovieDB';
    const storeName = 'Movies';

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            // Create the object store if it doesn't already exist
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'id' });
            }
        };

        request.onsuccess = function (event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(storeName)) {
                reject(new Error(`Object store "${storeName}" does not exist in database "${dbName}".`));
                return;
            }

            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const allRequest = store.getAll();

            allRequest.onsuccess = function () {
                resolve(allRequest.result);
            };

            allRequest.onerror = function () {
                reject(new Error('IndexedDB error while fetching data.'));
            };
        };

        request.onerror = function () {
            reject(new Error('Failed to open IndexedDB.'));
        };
    });
}

// Load movies from cookies
function loadFromCookies() {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('movieList='));
    return cookie ? JSON.parse(decodeURIComponent(cookie.split('=')[1])) : null;
}

// Load movies from Cache Storage
async function loadFromCacheStorage() {
    try {
        const cache = await caches.open('MovieCache');
        const response = await cache.match('/movieList.json');
        if (response) {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.error('Cache Storage error:', error);
    }
    return null;
}

// Load movies from JSON file served from localhost
async function loadFromJson() {
    try {
        const response = await fetch('http://localhost:3000/movieList.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch JSON: ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error('Error loading JSON file:', error);
        return [];
    }
}

// Render movies to the HTML div
function renderMovies(movies) {
    if (!cachedElements.movieGrid) {
        console.error('Failed to find movie grid element.');
        return;
    }

    cachedElements.movieGrid.innerHTML = ''; // Clear existing content

    if (!movies.length) {
        cachedElements.movieGrid.innerHTML = '<p>No movies available.</p>';
        return;
    }

    movies.forEach(movie => {
        const movieCard = `
            <div class="col">
                <div class="card h-100">
                    <img src="${movie.imageUrl}" class="card-img-top" alt="${movie.title}">
                    <div class="card-body">
                        <h5 class="card-title">${movie.title}</h5>
                        <p class="card-text">Year: ${movie.year}</p>
                        <p class="card-text">Runtime: ${movie.runtime}</p>
                        <p class="card-text">Requested By: ${movie.requestedBy.username} (${movie.requestedBy.platform})</p>
                        <a href="${movie.trailerLink}" class="btn btn-primary" target="_blank">Watch Trailer</a>
                    </div>
                </div>
            </div>
        `;
        cachedElements.movieGrid.insertAdjacentHTML('beforeend', movieCard);
    });
}
