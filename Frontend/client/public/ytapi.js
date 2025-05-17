const YOUTUBE_API_KEY = 'YOUR_API_KEY';
const YOUTUBE_CLIENT_ID = 'YOUR_CLIENT_ID';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/youtube.force-ssl';

let googleAuth;
let selectedMovieData = null;

function loadGoogleApi(callback) {
    if (typeof gapi !== 'undefined' && typeof gapi.auth2 !== 'undefined') {
      callback();
    } else {
      window.setTimeout(function() {
        loadGoogleApi(callback);
      }, 100);
    }
}

// Initialize the YouTube API client
function initYouTubeApi() {
    gapi.load('client:auth2', () => {
        gapi.client.init({
            apiKey: YOUTUBE_API_KEY,
            clientId: YOUTUBE_CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        }).then(() => {
            googleAuth = gapi.auth2.getAuthInstance();
            
            // Listen for sign-in state changes
            googleAuth.isSignedIn.listen(updateSigninStatus);
            
            // Handle initial sign-in state
            updateSigninStatus(googleAuth.isSignedIn.get());
            
            document.getElementById('authorize-button').onclick = handleAuthClick;
        });
    });
}

// Update UI based on sign-in status
function updateSigninStatus(isSignedIn) {
    const authButton = document.getElementById('authorize-button');
    const authSection = document.getElementById('authenticated-user');
    const playlistSection = document.getElementById('playlist-section');
    
    if (isSignedIn) {
        authButton.style.display = 'none';
        authSection.style.display = 'block';
        playlistSection.style.display = 'block';
        loadUserPlaylists();
    } else {
        authButton.style.display = 'block';
        authSection.style.display = 'none';
        playlistSection.style.display = 'none';
    }
}

// Handle authorization
function handleAuthClick() {
    googleAuth.signIn();
}

// Load user's existing playlists
async function loadUserPlaylists() {
    try {
        const response = await gapi.client.youtube.playlists.list({
            part: 'snippet',
            mine: true,
            maxResults: 50
        });
        
        const playlistSelect = document.getElementById('playlist-select');
        // Clear existing options except "Create New Playlist"
        playlistSelect.innerHTML = '<option value="new">Create New Playlist</option>';
        
        response.result.items.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist.id;
            option.textContent = playlist.snippet.title;
            playlistSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading playlists:', error);
        showStatus('Error loading playlists', 'danger');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Load the Google API client script
    var script = document.createElement('script');
    script.src = 'https://apis.google.com/js/platform.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  
    // Set up the callback for when the API is loaded
    script.onload = function() {
      initYouTubeApi();
    };
  
    // Set up the callback for when the API fails to load
    script.onerror = function() {
      console.error('Failed to load Google API client');
    };
}, {once: true});

// Handle playlist selection change
document.getElementById('playlist-select').addEventListener('change', function() {
    const newPlaylistForm = document.getElementById('new-playlist-form');
    newPlaylistForm.style.display = this.value === 'new' ? 'block' : 'none';
});

// Add click handler to movie card playlist buttons
document.addEventListener('click', async function(e) {
    if (e.target.closest('.add-to-playlist')) {
        const button = e.target.closest('.add-to-playlist');
        selectedMovieData = {
            movieId: button.dataset.movieId,
            trailerUrl: button.dataset.trailerUrl
        };
        
        // Extract video ID from trailer URL
        const videoId = getYouTubeVideoId(selectedMovieData.trailerUrl);
        if (!videoId) {
            showStatus('Invalid YouTube URL', 'danger');
            return;
        }
        
        selectedMovieData.videoId = videoId;
        
        // Show playlist modal
        const playlistModal = new window.bootstrap.Modal(document.getElementById('playlistModal'));
        playlistModal.show();
    }
});

// Handle adding to playlist
document.getElementById('add-to-playlist-btn').addEventListener('click', async function() {
    if (!selectedMovieData?.videoId) {
        showStatus('No video selected', 'danger');
        return;
    }
    
    const playlistSelect = document.getElementById('playlist-select');
    let playlistId = playlistSelect.value;
    
    try {
        // Create new playlist if selected
        if (playlistId === 'new') {
            const playlistName = document.getElementById('playlist-name').value;
            const privacyStatus = document.getElementById('playlist-privacy').value;
            
            if (!playlistName) {
                showStatus('Please enter a playlist name', 'warning');
                return;
            }
            
            const newPlaylist = await createPlaylist(playlistName, privacyStatus);
            playlistId = newPlaylist.id;
        }
        
        // Add video to playlist
        await addVideoToPlaylist(playlistId, selectedMovieData.videoId);
        
        showStatus('Successfully added to playlist!', 'success');
        setTimeout(() => {
            window.bootstrap.Modal.getInstance(document.getElementById('playlistModal')).hide();
        }, 1500);
    } catch (error) {
        console.error('Error:', error);
        showStatus('Error adding to playlist', 'danger');
    }
});

// Create a new playlist
async function createPlaylist(name, privacyStatus) {
    const response = await gapi.client.youtube.playlists.insert({
        part: 'snippet,status',
        resource: {
            snippet: {
                title: name,
                description: 'Created by MovieNight App'
            },
            status: {
                privacyStatus: privacyStatus
            }
        }
    });
    
    return response.result;
}

// Add a video to a playlist
async function addVideoToPlaylist(playlistId, videoId) {
    return gapi.client.youtube.playlistItems.insert({
        part: 'snippet',
        resource: {
            snippet: {
                playlistId: playlistId,
                resourceId: {
                    kind: 'youtube#video',
                    videoId: videoId
                }
            }
        }
    });
}

// Extract video ID from YouTube URL
function getYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Show status messages
function showStatus(message, type) {
    const statusDiv = document.getElementById('playlist-status');
    statusDiv.textContent = message;
    statusDiv.className = `alert alert-${type}`;
    statusDiv.style.display = 'block';
}

// Load YouTube API
function loadYouTubeApi() {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = initYouTubeApi;
    document.body.appendChild(script);
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', loadYouTubeApi, {once: true});