import { playlistState, state } from './state.mjs';
import { showToast } from './utils.mjs';

export function updatePlaylistBadge() {
    const badge = document.querySelector('.playlist-count');
    if (badge) {
        badge.textContent = playlistState.items.length;
    }
}

export function initializePlaylist() {
    try {
        const savedPlaylist = localStorage.getItem('userPlaylist');
        if (savedPlaylist) {
            // Validate the data before parsing
            if (typeof savedPlaylist === 'string' && savedPlaylist.trim() !== '') {
                const parsedPlaylist = JSON.parse(savedPlaylist);
                if (Array.isArray(parsedPlaylist) && parsedPlaylist.every(item => typeof item === 'object')) {
                    playlistState.items = parsedPlaylist;
                    updatePlaylistBadge();
                } else {
                    console.error('Invalid playlist data format');
                }
            } else {
                console.warn('No valid playlist data found');
            }
        } else {
            console.log('No saved playlist data available');
        }
    } catch (error) {
        console.error('Error initializing playlist:', error);
        // Optionally, you can reset the playlist state here
        playlistState.items = [];
    }
}

export function renderPlaylistContent() {
    const playlistContent = document.getElementById('playlistContent');
    if (!playlistContent) return;

    if (playlistState.items.length === 0) {
        playlistContent.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-film fa-3x mb-3 text-muted"></i>
                <p class="text-muted">Your playlist is empty</p>
            </div>
        `;
        return;
    }

    playlistContent.innerHTML = `
        <div class="row g-3">
            ${playlistState.items.map(movie => `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100">
                        <img src="${movie.poster}" class="card-img-top" alt="${movie.title}">
                        <div class="card-body">
                            <h6 class="card-title">${movie.title}</h6>
                            <p class="card-text small text-muted">
                                Added ${new Date(movie.addedAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div class="card-footer bg-transparent border-top-0">
                            <button type="button" class="btn btn-sm btn-outline-danger" 
                                    onclick="removeFromPlaylist(${movie.id})">
                                <i class="fas fa-trash-alt"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

export function initializePlaylistUI() {
    // Add playlist button to navbar
    const navbarContent = document.querySelector('#navbarContent .ms-auto');
    if (navbarContent) {
        navbarContent.insertAdjacentHTML('beforebegin', `
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item dropdown">
              <button class="btn btn-link nav-link position-relative" id="playlistButton">
                <i class="fas fa-list"></i> Playlist
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary playlist-count">
                  ${playlistState.items.length}
                </span>
              </button>
            </li>
          </ul>
        `);
    }

    // Add playlist modal
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal fade" id="playlistModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">My Playlist</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div id="playlistContent" class="playlist-items"></div>
            </div>
          </div>
        </div>
      </div>
    `);

    // Add toast container
    document.body.insertAdjacentHTML('beforeend', `
      <div id="toastContainer" class="toast-container position-fixed bottom-0 end-0 p-3"></div>
    `);

    // Initialize playlist modal
    const playlistModal = new window.bootstrap.Modal(document.getElementById('playlistModal'));

    // Add click handler for playlist button
    document.getElementById('playlistButton').addEventListener('click', () => {
        playlistState.isOpen = true;
        renderPlaylistContent();
        playlistModal.show();
    });

    // Handle modal close
    document.getElementById('playlistModal').addEventListener('hidden.bs.modal', () => {
        playlistState.isOpen = false;
    });
}

export function addToPlaylist(movieId, movieTitle, moviePoster) {
    if (!state.currentUser) {
        showToast('Please log in to add to playlist', 'warning');
        return;
    }

    // Check if movie already exists in playlist
    if (playlistState.items.some(item => item.id === movieId)) {
        showToast('Movie already in playlist', 'info');
        return;
    }

    // Create a copy of the current state to avoid modifying the original object
    const newState = { ...playlistState };

    // Add movie to playlist
    newState.items = [...newState.items, {
        id: movieId,
        title: movieTitle,
        poster: moviePoster,
        addedAt: new Date().toISOString()
    }];

    // Save to localStorage
    try {
        localStorage.setItem('userPlaylist', JSON.stringify(newState.items));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        showToast('Failed to save to playlist', 'error');
        return;
    }

    // Update UI
    updatePlaylistBadge();
    showToast('Added to playlist successfully', 'success');

    // If playlist is open, refresh its content
    if (playlistState.isOpen) {
        renderPlaylistContent();
    }
}

export function removeFromPlaylist(movieId) {
    playlistState.items = playlistState.items.filter(item => item.id !== movieId);
    localStorage.setItem('userPlaylist', JSON.stringify(playlistState.items));
    updatePlaylistBadge();
    renderPlaylistContent();
    showToast('Removed from playlist', 'success');
}
