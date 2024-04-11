import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { parseString } from 'xml2js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

let data = {};

const updateData = async () => {
    try {
        const response = await fetch('https://www.stadt-koeln.de/interne-dienste/hochwasser/pegel_ws.php');
        const xmlData = await response.text();
        parseString(xmlData, (err, result) => {
            if (err) {
                console.error('Error converting XML to JSON:', err);
                return;
            }
            data = result;
            console.log('Data updated:', result);
        });
    } catch (error) {
        console.error('Error updating data:', error);
    }
};

// Update data every 5 minutes
setInterval(updateData, 5 * 60 * 1000);

// Expand CORS middleware, allow everyone
const corsOptions = {
    origin: '*',
};

app.use(cors(corsOptions));

// Serve static files
app.use(express.static(path.join(__dirname, 'temp')));
app.use('/img', express.static(path.join(__dirname, 'img')));

// Send index.html file using the / endpoint
app.get('/', (req, res) => {
    const indexHtmlPath = path.join(__dirname, 'temp', 'index.html');
    res.sendFile(indexHtmlPath);
});

// API endpoint
app.get('/api/data', async (req, res) => {
    res.json(data);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}...`);
});

updateData(); // Initial data update
