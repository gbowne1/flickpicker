import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises'; // For promise-based file operations
import { fileURLToPath } from 'url';

const app = express();

// Use import.meta.url to get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to parse JSON bodies
app.use(express.json()); // Replaced bodyParser.json() with express.json()

// Cors middleware to allow cross-origin requests
app.use(cors());

// Middleware to set correct MIME type for .mjs files
app.use((req, res, next) => {
    if (req.url.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript');
    }
    next();
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../Frontend/client/public')));

// Route to serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/client/public/index.html'));
});

app.get('/movieList.json', async (req, res) => {
    try {
        const filePath = path.join(__dirname, '..', 'Data', 'movieList.json');
        console.log('📂 Attempting to read:', filePath); // 👈 add this line
        const json = await fs.readFile(filePath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(json);
    } catch (error) {
        console.error('❌ Error reading movieList.json:', error);
        res.status(500).json({ error: 'Failed to load movie list' });
    }
});

// Endpoint to search for movies
app.get('/search-movies', async (req, res) => {
    const query = req.query.query?.toLowerCase(); // Safely get the query parameter

    try {
        // Read the movie list from the JSON file
        const movieListPath = path.join(__dirname, '..', 'Data', 'movieList.json');
        let movieList = JSON.parse(await fs.readFile(movieListPath, 'utf8'));

        // Ensure movieList is an array before proceeding
        if (!Array.isArray(movieList)) {
            return res.status(500).json({ error: 'Invalid movie data' });
        }

        // Filter the movie list based on the query
        const filteredMovies = movieList.filter(movie => {
            const matchesTitle = movie.title.toLowerCase().includes(query);
            const matchesDirector = movie.director && movie.director.toLowerCase().includes(query);
            const matchesYear = movie.year && movie.year.toString().includes(query);
            return matchesTitle || matchesDirector || matchesYear;
        });

        res.status(200).json(filteredMovies); // Send filtered results back
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Define the server port
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
