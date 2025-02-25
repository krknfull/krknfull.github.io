class MusicPlayer {
    constructor() {
        this.tracks = [];
        this.currentTrackIndex = 0;
        this.audio = new Audio();
        this.isInitialized = false;
        this.isPlaying = false;
        
        this.initElements();
        this.loadTracksFromJSON()
            .then(() => {
                this.setupEventListeners();
                this.restorePlaybackState();
                this.loadTrack(0);
                this.isInitialized = true;
            })
            .catch(error => {
                console.error('Error initializing player:', error);
            });
    }
    
    async loadTracksFromJSON() {
        try {
            const response = await fetch('list.json');
            const data = await response.json();
            this.tracks = data.tracks.filter(track => track.url);
            
            if (this.tracks.length === 0) {
                console.error('No valid tracks found');
                return;
            }
            
            this.renderPlaylist();
        } catch (error) {
            console.error('Error loading tracks:', error);
        }
    }
    
    initElements() {
        this.playPauseBtn = document.getElementById('playPause');
        this.playIcon = document.getElementById('playIcon');
        this.pauseIcon = document.getElementById('pauseIcon');
        this.pauseIcon2 = document.getElementById('pauseIcon2');
        this.prevTrackBtn = document.getElementById('prevTrack');
        this.nextTrackBtn = document.getElementById('nextTrack');
        this.progressBar = document.getElementById('progressBar');
        this.albumCover = document.getElementById('albumCover');
        this.trackTitle = document.getElementById('trackTitle');
        this.trackArtist = document.getElementById('trackArtist');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');

        // Initially hide pause icons
        this.pauseIcon.style.display = 'none';
        this.pauseIcon2.style.display = 'none';
    }
    
    setupEventListeners() {
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.prevTrackBtn.addEventListener('click', () => this.previousTrack());
        this.nextTrackBtn.addEventListener('click', () => this.nextTrack());
        
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateTotalTime());
        this.audio.addEventListener('error', (e) => this.handleAudioError(e));
        
        this.progressBar.addEventListener('input', (e) => this.safeSetProgress(e.target.value));
        
        // Add event listener for saving playback state
        this.audio.addEventListener('timeupdate', () => this.savePlaybackState());

        // Add ended event to automatically play next track
        this.audio.addEventListener('ended', () => this.nextTrack());
    }
    
    safeSetProgress(value) {
        try {
            if (this.audio.duration && !isNaN(this.audio.duration) && isFinite(this.audio.duration)) {
                const time = (value / 100) * this.audio.duration;
                
                if (isFinite(time)) {
                    this.audio.currentTime = time;
                }
            }
        } catch (error) {
            console.error('Error setting progress:', error);
        }
    }
    
    handleAudioError(e) {
        console.error('Audio error:', e);
        
        // Try next track
        this.nextTrack();
    }
    
    loadTrack(index) {
        if (index < 0 || index >= this.tracks.length) {
            console.error('Invalid track index');
            return;
        }
        
        const track = this.tracks[index];
        
        try {
            // Reset audio state
            this.audio.pause();
            this.audio.src = track.url;
            this.audio.load();
            
            this.trackTitle.textContent = track.title || 'Неизвестный трек';
            this.trackArtist.textContent = track.artist || 'Неизвестный исполнитель';
            this.albumCover.src = track.cover || 'kraken-logo.svg';
            
            // Reset progress bar and time displays
            this.progressBar.value = 0;
            this.currentTimeEl.textContent = '0:00';
            this.totalTimeEl.textContent = '0:00';

            // Reset play/pause icons
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
            this.pauseIcon2.style.display = 'none';
        } catch (error) {
            console.error('Error loading track:', error);
        }
    }
    
    togglePlay() {
        if (!this.isInitialized || this.tracks.length === 0) return;

        if (this.audio.paused) {
            this.audio.play()
                .then(() => {
                    this.isPlaying = true;
                    this.playIcon.style.display = 'none';
                    this.pauseIcon.style.display = 'block';
                    this.pauseIcon2.style.display = 'block';
                })
                .catch(error => {
                    console.error('Play error:', error);
                    this.isPlaying = false;
                });
        } else {
            this.audio.pause();
            this.isPlaying = false;
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
            this.pauseIcon2.style.display = 'none';
        }
    }
    
    nextTrack() {
        if (!this.isInitialized || this.tracks.length === 0 || !this.isPlaying) return;

        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
        this.loadTrack(this.currentTrackIndex);
        this.togglePlay();
    }
    
    previousTrack() {
        if (!this.isInitialized || this.tracks.length === 0 || !this.isPlaying) return;

        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
        this.loadTrack(this.currentTrackIndex);
        this.togglePlay();
    }
    
    updateProgress() {
        if (this.audio.duration && !isNaN(this.audio.duration)) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressBar.value = progress;
            
            const currentMinutes = Math.floor(this.audio.currentTime / 60);
            const currentSeconds = Math.floor(this.audio.currentTime % 60);
            this.currentTimeEl.textContent = `${currentMinutes}:${currentSeconds < 10 ? '0' : ''}${currentSeconds}`;
        }
    }
    
    updateTotalTime() {
        if (this.audio.duration && !isNaN(this.audio.duration)) {
            const totalMinutes = Math.floor(this.audio.duration / 60);
            const totalSeconds = Math.floor(this.audio.duration % 60);
            this.totalTimeEl.textContent = `${totalMinutes}:${totalSeconds < 10 ? '0' : ''}${totalSeconds}`;
        }
    }
    
    renderPlaylist() {
        const playlistContent = document.getElementById('playlistContent');
        playlistContent.innerHTML = this.tracks.map((track, index) => `
            <div class="playlist-item">
                <div class="playlist-item-content">
                    <div class="playlist-item-info">
                        ${track.isNew ? '<span class="new-badge">New</span>' : ''}
                        <div class="playlist-item-track-name">
                            ${track.title || 'Неизвестный трек'} - ${track.artist || 'Неизвестный исполнитель'}
                        </div>
                    </div>
                    <div class="playlist-item-actions">
                        <button onclick="player.playSpecificTrack(${index})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </button>
                        <a href="${track.url}" download class="download-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    playSpecificTrack(index) {
        if (!this.isInitialized || this.tracks.length === 0) return;

        this.currentTrackIndex = index;
        this.loadTrack(index);
        this.togglePlay();
    }
    
    savePlaybackState() {
        if (isFinite(this.audio.currentTime)) {
            document.cookie = `currentTrackIndex=${this.currentTrackIndex}; path=/`;
            document.cookie = `currentTime=${this.audio.currentTime}; path=/`;
        }
    }
    
    restorePlaybackState() {
        const cookies = document.cookie.split('; ');
        let savedTrackIndex = null;
        let savedTime = null;
        
        cookies.forEach(cookie => {
            const [name, value] = cookie.split('=');
            if (name === 'currentTrackIndex') savedTrackIndex = parseInt(value);
            if (name === 'currentTime') savedTime = parseFloat(value);
        });
        
        if (savedTrackIndex !== null && savedTrackIndex < this.tracks.length) {
            this.currentTrackIndex = savedTrackIndex;
            this.loadTrack(this.currentTrackIndex);
            
            if (savedTime !== null && isFinite(savedTime)) {
                setTimeout(() => {
                    this.audio.currentTime = savedTime;
                }, 100);
            }
        } else {
            this.loadTrack(0);
        }
    }
}

const player = new MusicPlayer();
window.player = player;