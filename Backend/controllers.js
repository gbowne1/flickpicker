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
            const movieListPath = path.join(__dirname, '..', 'Data', 'movieList.json');
            const movieList = JSON.parse(await fs.readFile(movieListPath, 'utf8'));

            // Filter movies based on the query
            const filteredMovies = movieList.filter(movie =>
                movie.title.toLowerCase().includes(query) ||
                (movie.director && movie.director.toLowerCase().includes(query)) ||
                (movie.year && movie.year.toString().includes(query))
            );

            if (filteredMovies.length === 0) {
                return res.status(404).json({ error: `No movies found matching "${query}"` });
            }

            res.status(200).json(filteredMovies);
        } catch (error) {
            console.error('Error fetching movies:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export default movieController;
