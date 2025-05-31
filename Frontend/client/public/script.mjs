import { login, logout, isAuthenticated, initializeAuth, loadUserFromSession } from "./auth.mjs";
import { searchMovies } from "./search.mjs";
import { togglePasswordVisibility, updateAuthUI,  handleMovieSearch, toggleTheme, initTheme, getPreferredTheme, setTheme } from "./ui.mjs";
import {  updateMovieDisplay } from "./movies.mjs";
import { state } from "./state.mjs";

const isBrowser = typeof window !== "undefined";
const isNode = typeof window === "undefined";

if (isBrowser) {
  // Event listener for search input
  searchMovies();

  // Expose saveMoviesToFile to the global scope
  window.saveMovie = saveMovie;
}

//Added to check code runs on Node.js Environment 
if (isNode) {
  const fs = require('fs');
} else {
  // Browser-specific logic
  console.log('Running in the browser');
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

export async function saveMovie(event) {
  event.preventDefault();
  console.log("saveMovie function triggered");
  const form = document.getElementById("add-movie-form");
  const formData = new FormData(form);

  const movieData = {
    id: Date.now(),
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
    form.reset();
  } catch (error) {
    console.error("Error saving movie:", error);
    alert("Failed to save movie. Please try again.");
  }
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

      for (const movie of movies) {
        if (!validateMovieData(movie)) {
          throw new Error(`Invalid movie data: ${JSON.stringify(movie)}`);
        }
      }

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

    const data = await response.json();

    console.log("Movie list updated successfully:", data.message);
  } catch (error) {
    console.error("Error updating movie list:", error);
    throw error;
  }
}

export function validateMovieData(data) {
  return (
    data.title &&
    data.year &&
    data.category &&
    data.requestedBy.username &&
    data.language &&
    data.trailerLink &&
    data.movieLink &&
    data.modernTrailerLink &&
    data.dateWatched &&
    data.imdbLink &&
    data.tmdbLink &&
    !isNaN(data.year) &&
    typeof data.subtitles === "boolean"
  );
}

export function isValidUrl(string) {
  if (!string) return true;
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
        "./service-worker.js",
        {
          scope: '/'
        }
      );
      console.log("Service Worker registered with scope:", registration.scope);
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  });
}

if (isBrowser) {
  document.addEventListener("DOMContentLoaded", function () {
    handleMovieSearch();
    initTheme();
    togglePasswordVisibility();
    updateAuthUI();
    initializeAuth();
    loadUserFromSession();

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

    const addMovieButton = document.getElementById("addMovieButton");
    if (addMovieButton) {
      try {
        addMovieButton.style.display = isAuthenticated() ? "block" : "none";
      } catch (error) {
        console.error("Error checking authentication:", error);
        addMovieButton.style.display = "none";
      }
    }

    document.querySelectorAll("#filter-section select").forEach((select) => {
      select.addEventListener("change", applyFilters);
    });

    const themeToggleBtn = document.getElementById("themeToggle");
    if (themeToggleBtn) {
      const theme = getPreferredTheme();
      const themeBtnIcon = themeToggleBtn.querySelector("i");
      const iconClassName = theme === "dark" ? "fa-sun" : "fa-moon";
      themeBtnIcon.classList.remove("fa-sun", "fa-moon");
      themeBtnIcon.classList.add("fas", iconClassName);
      themeToggleBtn.addEventListener("click", toggleTheme);
    }

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
  }, { once: true });
}

if (isBrowser) {
  const currentTheme = getPreferredTheme();
  document.getElementById("themeSelector").value = currentTheme;

  document.getElementById("saveSettingsBtn").addEventListener("click", function () {
    const emailNotifications = document.getElementById("emailNotifications").checked;
    const discordNotifications = document.getElementById("discordNotifications").checked;
    const voteLimit = document.getElementById("voteLimit").value;
    const votingDeadline = document.getElementById("votingDeadline").value;
    const theme = document.getElementById("themeSelector").value;
    const feedback = document.getElementById("feedback").value;

    setTheme(theme);
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
