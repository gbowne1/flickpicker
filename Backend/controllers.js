import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const movieController = {
    searchMovies: async (req, res) => {
        const query = req.query.query?.toLowerCase();

        try {
            // Read movie list from JSON file
            const movieListPath = path.join(__dirname, 'Data', 'movieList.json');
            const movieList = JSON.parse(await fs.readFile(movieListPath, 'utf8'));

            // Filter movies based on the query
            const filteredMovies = movieList.filter(movie =>
                movie.title.toLowerCase().includes(query) ||
                (movie.director && movie.director.toLowerCase().includes(query)) ||
                (movie.year && movie.year.toString().includes(query))
            );

            res.status(200).json(filteredMovies);
        } catch (error) {
            console.error('Error fetching movies:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    saveMovie: async (req, res) => {
        const newMovie = req.body;
        try {
            const movieListPath = path.join(__dirname,'..', 'Data', 'movieList.json');
            const movieList = JSON.parse(await fs.readFile(movieListPath, 'utf8'));

            // Add the new movie to the list
            movieList.push(newMovie);

            // Write the updated list back to the file
            await fs.writeFile(movieListPath, JSON.stringify(movieList, null, 2), 'utf8');

            res.status(200).json({ success: true, message: "Movie saved successfully!" });
        } catch (error) {
            console.error("Error saving movie:", error);
            res.status(500).json({ success: false, error: "Failed to save movie" });
        }
    },

    getMovies: async (req, res) => {
        try {
            const movieListPath = path.join(__dirname, '..', 'Data', 'movieList.json');
            //const movieList = JSON.parse(await fs.readFile(movieListPath, 'utf8'));
            //res.status(200).json(movieList);
            res.sendFile(movieListPath, { headers: { 'Content-Type': 'application/json' } });
        } catch (error) {
            console.error('Error fetching movies:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export default movieController;
