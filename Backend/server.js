import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises'; // For promise-based file operations
import { fileURLToPath } from 'url';
import router from './routes.js';

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
app.use('/', router);

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

// Define the server port
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
