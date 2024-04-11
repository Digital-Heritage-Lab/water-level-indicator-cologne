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
                console.error('XML verisini JSON\'a çevirme hatasi:', err);
                return;
            }
            data = result;
            console.log('Veriler güncellendi:', result);
        });
    } catch (error) {
        console.error('Veri güncelleme hatasi:', error);
    }
};

// 5 dakikada bir güncelleme yapmak için
setInterval(updateData, 5 * 60 * 1000);

// CORS middleware'ini genişletelim, herkese izin verelim
const corsOptions = {
    origin: '*',
};

app.use(cors(corsOptions));

// Statik dosyaları servis etme
app.use(express.static(path.join(__dirname, 'temp')));
app.use('/img', express.static(path.join(__dirname, 'img')));

// / endpoint'ini kullanarak index.html dosyasını gönder
app.get('/', (req, res) => {
    const indexHtmlPath = path.join(__dirname, 'temp', 'index.html');
    res.sendFile(indexHtmlPath);
});

// API endpoint'i
app.get('/api/data', async (req, res) => {
    res.json(data);
});

app.listen(port, () => {
    console.log(`Server ${port} portunda çalışıyor...`);
});

updateData();
