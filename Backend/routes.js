import express from 'express';
import movieController from './controllers.js';
import path from "path";

const router = express.Router();

// Route to search movies
router.get('/search-movies', movieController.searchMovies);
router.post('/save-movie', movieController.saveMovie);
router.get('/movies', movieController.getMovies);

export default router;
