import { state } from "./state.mjs";
import { showToast } from "./utils.mjs";
import { login, logout, isAuthenticated, initializeAuth, loadUserFromSession } from "./auth.mjs";
import { addToPlaylist } from "./playlist.mjs";
import { searchMovies } from "./search.mjs";
import { displayMovies, updateMovieDisplay } from "./movies.mjs";
import { togglePasswordVisibility, updateAuthUI, closeModal, handleMovieSearch, toggleTheme } from "./ui.mjs";

const isBrowser = typeof window !== "undefined";
const isNode = typeof window === "undefined";

const movies = isBrowser
  ? localStorage.getItem("movieList")
    ? JSON.parse(localStorage.getItem("movieList"))
    : []
  : [];

const movieList = isNode
  ? require("./movie-database").getMovies() // Example: Fetch movies from Node.js database
  : localStorage.getItem("movieList")
    ? JSON.parse(localStorage.getItem("movieList"))
    : [];

if (isBrowser) {
  // Initial display (show all movies on page load)
  displayMovies(movies);

  // Event listener for search input
  searchMovies();

  // Expose saveMoviesToFile to the global scope
  window.saveMoviesToFile = saveMoviesToFile;
}

// Filtering and Sorting
export function applyFilters() {
  if (isBrowser) {
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
}

export function sortMovies(criteria) {
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

export async function saveMoviesToFile() {
  const movieList = isBrowser
    ? localStorage.getItem("movieList")
      ? JSON.parse(localStorage.getItem("movieList"))
      : []
    : [];

  // Send the data to the server using fetch
  fetch("http://localhost:3000/save-movies", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(movieList),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Movies saved successfully!");
      } else {
        alert("Failed to save movies.");
      }
    })
    .catch((error) => {
      console.error("Error saving movies:", error);
      alert("Error saving movies.");
    });
}

export async function loadMovieFromFile() {
  const fileInput = document.getElementById("fileInput");
  if (fileInput.files.length === 0) {
    alert("Please select a file to upload.");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = async function (event) {
    const fileContent = event.target.result;
    try {
      const movies = JSON.parse(fileContent);
      if (!Array.isArray(movies)) {
        throw new Error("Invalid file format. Expected an array of movies.");
      }

      // Validate each movie object
      for (const movie of movies) {
        if (!validateMovieData(movie)) {
          throw new Error(`Invalid movie data: ${JSON.stringify(movie)}`);
        }
      }

      // Update the state and UI
      state.movies = movies;
      state.filteredMovies = [...state.movies];
      updateMovieDisplay();

      alert("Movies loaded successfully!");
    } catch (error) {
      console.error("Error loading movies:", error);
      alert("Failed to load movies. Please check the file format.");
    }
  };
  reader.onerror = function () {
    console.error("Error reading file:", reader.error);
    alert("Error reading file. Please try again.");
  };
  reader.readAsText(file);
  loadMovieFromFile;
}

export function handleMovieInteraction(event) {
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

export function handleVote(movieId, voteType) {
  if (
    !state.currentUser ||
    !state.currentUser.id ||
    !state.currentUser.username
  ) {
    showToast("Please log in to vote", "warning");
    return;
  }

  // Implement voting logic here
  console.log(`Vote ${voteType} for movie ${movieId}`);
  // Update UI or make API call to record vote
}

export async function handleAddMovie(event) {
  event.preventDefault();

  // Gather data from the modal form
  const movieData = {
    id: Date.now(), // Generate unique ID
    title: document.getElementById("title").value,
    dateWatched: document.getElementById("dateWatched").value,
    watched: false,
    year: parseInt(document.getElementById("year").value),
    category: document.getElementById("category").value,
    trailerLink: document.getElementById("trailerLink").value,
    movieLink: document.getElementById("movieLink").value,
    modernTrailerLink: document.getElementById("modernTrailerLink").value,
    tmdbLink: document.getElementById("tmdbLink").value,
    imdbLink: document.getElementById("imdbLink").value,
    requestedBy: {
      userId: state.currentUser?.id || "anonymous",
      username: document.getElementById("requestedBy").value,
      platform: "Web",
    },
    language: document.getElementById("language").value,
    subtitles: document.getElementById("subtitles").value === "true",
    voteCount: 0,
    imageUrl: "", // Default image
    runtime: "", // You might want to add this to your form
    ratings: "",
    trailerPrivate: false,
    moviePrivate: false,
  };

  try {
    // Validate the data before sending (optional)
    if (!validateMovieData(movieData)) {
      throw new Error("Invalid movie data");
    }

    // Send the POST request to add the movie
    const response = await fetch("http://localhost:3000/add-movie", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(movieData),
    });

    if (!response.ok) {
      throw new Error("Failed to add movie");
    }

    // If successful, update the frontend
    state.movies.push(movieData);
    state.filteredMovies = [...state.movies];
    updateMovieDisplay(); // Assuming this updates the movie list in your UI

    // Close the modal
    if (isBrowser) {
      const modal = window.bootstrap.Modal.getInstance(
        document.getElementById("addMovieModal")
      );
      modal.hide();
    }

    // Show success message (can be done with a toast or alert)
    showToast("Movie added successfully!", "success");

    // Reset the form
    if (isBrowser) {
      document.getElementById("add-movie-form").reset();
    }
  } catch (error) {
    console.error("Error adding movie:", error);
    showToast("Failed to add movie. Please try again.", "error");
  }
}

export async function updateMovieListJson(movies) {
  try {
    const response = await fetch("http://localhost:3000/update-movie-list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(movies),
    });

    if (!response.ok) {
      throw new Error("Failed to update movie list");
    }

    // Parse the response to get any returned data
    const data = await response.json();

    console.log("Movie list updated successfully:", data.message);
  } catch (error) {
    console.error("Error updating movie list:", error);
    throw error;
  }
}

export function validateMovieData(data) {
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

export function isValidUrl(string) {
  if (!string) return true; // Allow empty strings
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Register the service worker in the browser environment
if (isBrowser && "serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "../../../service-worker.js",
        {
          scope: location.pathname.replace(/\/[^/]*$/, "/"), // Dynamically set scope based on current path
        }
      );
      console.log("Service Worker registered with scope:", registration.scope);
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  });
}

if (isBrowser)
  document.addEventListener("DOMContentLoaded", function () {
    
    handleMovieSearch();
    toggleTheme();
    togglePasswordVisibility();
    updateAuthUI();
    initializeAuth();
    loadUserFromSession();
    
    // Settings modal
    const settingsLink = document.getElementById("settingsLink");
    if (settingsLink) {
      settingsLink.addEventListener("click", function (e) {
        e.preventDefault();
        const settingsModal = new window.bootstrap.Modal(
          document.getElementById("settingsModal")
        );
        settingsModal.show();
      });
    }

    // Profile modal
    const profileLink = document.getElementById("profileLink");
    if (profileLink) {
      profileLink.addEventListener("click", function (e) {
        e.preventDefault();
        const profileModal = new window.bootstrap.Modal(
          document.getElementById("profileModal")
        );
        profileModal.show();
      });
    }

    // Add movie button visibility
    const addMovieButton = document.getElementById("addMovieButton");
    if (addMovieButton) {
      try {
        addMovieButton.style.display = isAuthenticated() ? "block" : "none";
      } catch (error) {
        console.error("Error checking authentication:", error);
        addMovieButton.style.display = "none"; // Default to hiding the button
      }
    }

    // Event listeners for filters, login, and movie interactions
    // Initialize event listeners for filters, login, and movie interactions
    document.querySelectorAll("#filter-section select").forEach((select) => {
      select.addEventListener("change", applyFilters);
    });

    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        login(username, password);
      });
    }

    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
      logoutLink.addEventListener("click", logout);
    }

    const movieGrid = document.getElementById("movie-grid");
    if (movieGrid) {
      movieGrid.addEventListener("click", handleMovieInteraction);
    }
  }, {once: true});
const filterSelects = document.querySelectorAll("#filter-section select");
if (filterSelects) {
  filterSelects.forEach((select) => {
    select.addEventListener("change", applyFilters);
  });
}
if (isBrowser) {
  // Filter listeners
  document.querySelectorAll("#filter-section select").forEach((select) => {
    select.addEventListener("change", applyFilters);
  });
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      login(username, password);
    });
  }
  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", logout);
  }

  const movieGrid = document.getElementById("movie-grid");
  if (movieGrid) {
    movieGrid.addEventListener("click", handleMovieInteraction);
  }

  // Movie interaction listeners
  document
    .getElementById("movie-grid")
    .addEventListener("click", handleMovieInteraction);
}

if (isBrowser) {
  document
    .getElementById("saveSettingsBtn")
    .addEventListener("click", function () {
      const emailNotifications =
        document.getElementById("emailNotifications").checked;
      const discordNotifications = document.getElementById(
        "discordNotifications"
      ).checked;
      const voteLimit = document.getElementById("voteLimit").value;
      const votingDeadline = document.getElementById("votingDeadline").value;
      const theme = document.getElementById("themeSelector").value;
      const feedback = document.getElementById("feedback").value;

      console.log({
        emailNotifications,
        discordNotifications,
        voteLimit,
        votingDeadline,
        theme,
        feedback,
      });

      window.bootstrap.Modal.getInstance(
        document.getElementById("settingsModal")
      );
    });
}
