import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_DIR = path.join(__dirname, '../public/coins');

async function downloadImage(url, filepath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function fetchTopCoins() {
    try {
        console.log('Fetching top 250 coins list...');
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false');
        const coins = response.data;
        
        // Save the map for frontend use
        const coinMap = {};

        for (const coin of coins) {
            const fileName = `${coin.symbol.toLowerCase()}.png`;
            const filePath = path.join(TARGET_DIR, fileName);
            
            console.log(`Downloading ${coin.name} (${coin.symbol})...`);
            try {
                await downloadImage(coin.image, filePath);
                coinMap[coin.symbol.toLowerCase()] = `/coins/${fileName}`;
            } catch (err) {
                console.error(`Failed to download ${coin.name}:`, err.message);
            }
            
            // Be nice to the API
            await new Promise(r => setTimeout(r, 200));
        }

        // Save map to src/assets/coin-map.json
        const mapPath = path.join(__dirname, '../src/assets/coin-map.json');
        fs.writeFileSync(mapPath, JSON.stringify(coinMap, null, 2));
        console.log('✅ All done! Map saved to src/assets/coin-map.json');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

fetchTopCoins();
