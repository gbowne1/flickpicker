import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors()); 

app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../Frontend/client/public')));

// Use routes
app.use(routes);

export default app;