class ProfileManager {
    constructor() {
        // Initialize modals and mock data
        this.profileModal = null;
        this.searchModal = null;
        this.mockProfileData = {
            profileUsername: 'MovieBuff2024',
            profileJoinDate: 'January 2024',
            moviesWatchedCount: '142',
            votingStreak: '8',
            moviesCompleted: '142',
            moviesVoted: '256',
            moviesSuggested: '45',
            totalWatchTime: '284 hours',
            favoriteGenres: ['Sci-Fi', 'Thriller', 'Animation'],
            preferredLanguages: ['English', 'Japanese', 'Korean'],
            subtitlePreference: 'Always',
            viewingTime: 'Evening (8-11 PM)',
            lastAttended: 'Yesterday',
            nextHosting: 'Friday 8 PM'
        };

        // Initialize modals and event listeners
        this.initializeModals();
        this.attachEventListeners();
        this.loadMockData();
    }

    initializeModals() {
        // Use Bootstrap 5 modal API to initialize modals
        const profileModalEl = document.getElementById('profileModal');
        const searchModalEl = document.getElementById('searchProfilesModal');

        if (profileModalEl) {
            this.profileModal = new window.bootstrap.Modal(profileModalEl);
        }

        if (searchModalEl) {
            this.searchModal = new window.bootstrap.Modal(searchModalEl);
        }
    }

    attachEventListeners() {
        // Profile link click handler
        const profileLink = document.getElementById('profileLink');
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showProfile();
            });
        }

        // Save profile button handler
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => this.saveProfileChanges());
        }

        // Search button handler
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchProfiles());
        }
    }

    showProfile() {
        // Show profile modal
        if (this.profileModal) {
            this.profileModal.show();
        }
    }

    loadMockData() {
        // Load the mock data into the UI
        this.updateProfileUI(this.mockProfileData);
    }

    updateProfileUI(data) {
        // Update basic profile information
        const elements = {
            profileUsername: document.getElementById('profileUsername'),
            profileJoinDate: document.getElementById('profileJoinDate'),
            moviesWatchedCount: document.getElementById('moviesWatchedCount'),
            votingStreak: document.getElementById('votingStreak'),
            moviesCompleted: document.getElementById('moviesCompleted'),
            moviesVoted: document.getElementById('moviesVoted'),
            moviesSuggested: document.getElementById('moviesSuggested'),
            totalWatchTime: document.getElementById('totalWatchTime'),
            lastAttended: document.getElementById('lastAttended'),
            nextHosting: document.getElementById('nextHosting'),
            subtitlePreference: document.getElementById('subtitlePreference'),
            viewingTime: document.getElementById('viewingTime')
        };

        // Update text content for elements
        Object.entries(elements).forEach(([key, element]) => {
            if (element && data[key]) {
                element.textContent = data[key];
            }
        });

        // Update favorite genres
        const favoriteGenresEl = document.getElementById('favoriteGenres');
        if (favoriteGenresEl && data.favoriteGenres) {
            favoriteGenresEl.innerHTML = data.favoriteGenres
                .map(genre => `<span class="badge bg-primary">${genre}</span>`)
                .join(' ');
        }

        // Update preferred languages
        const preferredLanguagesEl = document.getElementById('preferredLanguages');
        if (preferredLanguagesEl && data.preferredLanguages) {
            preferredLanguagesEl.innerHTML = data.preferredLanguages
                .map(language => `<span class="badge bg-secondary">${language}</span>`)
                .join(' ');
        }
    }

    saveProfileChanges() {
        // Get form values
        const formData = {
            notifyNewMovies: document.getElementById('notifyNewMovies').checked,
            notifyVoting: document.getElementById('notifyVoting').checked,
            shareHistory: document.getElementById('shareHistory').checked
        };

        // Log the changes (since we don't have a backend)
        console.log('Profile changes saved:', formData);

        // Hide the modal
        if (this.profileModal) {
            this.profileModal.hide();
        }

        // Show success message (this can be replaced with a toast or a more sophisticated method)
        alert('Profile changes saved successfully!');
    }

    searchProfiles() {
        const searchQuery = document.getElementById('searchQuery').value.toLowerCase();
        const searchResults = document.getElementById('searchResults');

        // Mock search results (for demonstration purposes)
        const mockUsers = [
            { username: 'FilmFanatic', moviesWatched: 156 },
            { username: 'CinemaLover', moviesWatched: 203 },
            { username: 'MovieExplorer', moviesWatched: 178 }
        ];

        // Filter mock results based on search query
        const filteredResults = mockUsers.filter(user => 
            user.username.toLowerCase().includes(searchQuery)
        );

        // Display search results
        searchResults.innerHTML = filteredResults.length ? 
            filteredResults.map(user => `
                <div class="d-flex align-items-center p-2 border-bottom">
                    <div class="rounded-circle bg-secondary bg-opacity-25 d-flex align-items-center justify-content-center me-2" style="width: 40px; height: 40px;">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <div class="fw-bold">${user.username}</div>
                        <div class="text-muted small">Movies watched: ${user.moviesWatched}</div>
                    </div>
                </div>
            `).join('') :
            '<div class="alert alert-info">No users found</div>';
    }
}

// Initialize the profile manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const profileManager = new ProfileManager();
}, {once: true});

export default ProfileManager;