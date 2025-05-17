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
        console.log('Starting movie loading process...');

        // Load from the API first
        try {
            console.log('Attempting to load from API...');
            movies = await loadFromJson();
            if (movies && movies.length > 0) {
                console.log(`Successfully loaded ${movies.length} movies from API`);
                // Store in localStorage for future use
                localStorage.setItem('movieList', JSON.stringify(movies));
                renderMovies(movies);
                return;
            }
        } catch (error) {
            console.warn('API load failed:', error);
        }

         // Attempt loading from local storage
        if (!movies.length) {
            console.log('Attempting to load from localStorage...');
            const localMovies = loadFromLocalStorage();
            if (localMovies && localMovies.length > 0) {
                console.log(`Found ${localMovies.length} movies in localStorage`);
                movies = localMovies;
                renderMovies(movies);
                return;
            }
        }

        // Attempt loading from other storage methods
        if (!movies.length) {
            const sources = [
                { name: 'sessionStorage', loader: loadFromSessionStorage },
                { name: 'IndexedDB', loader: loadFromIndexedDB },
                { name: 'cookies', loader: loadFromCookies },
                { name: 'cacheStorage', loader: loadFromCacheStorage }
            ];

            for (const source of sources) {
                console.log(`Attempting to load from ${source.name}...`);
                try {
                    const loadedMovies = await source.loader();
                    if (loadedMovies && loadedMovies.length > 0) {
                        console.log(`Successfully loaded ${loadedMovies.length} movies from ${source.name}`);
                        movies = loadedMovies;
                        break;
                    }
                } catch (error) {
                    console.warn(`Failed to load from ${source.name}:`, error);
                }
            }
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
        console.log('Loading movies from JSON file...');
        const response = await fetch('http://localhost:3000/movies');
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch JSON: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data) throw new Error('No data received from API');
        
        return data;
    } catch (error) {
        console.error('Error loading JSON file:', error);
        throw error
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
