import { useState, useEffect } from 'react';
import coinMap from '../assets/coin-map.json';
import * as THREE from 'three';

export interface StockData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
  image: string;
  total_volume: number;
}

export function useStockData() {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch top 250 coins
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        let result = await response.json();
        
        // Map local images if available
        result = result.map((coin: StockData) => {
          const localImage = (coinMap as any)[coin.symbol.toLowerCase()];
          if (localImage) {
            return { ...coin, image: localImage };
          }
          return coin;
        });

        // Preload textures immediately
        const textureLoader = new THREE.TextureLoader();
        result.forEach((coin: StockData) => {
            const url = coin.image;
            if (url) {
                textureLoader.load(url); // Fire and forget preload
            }
        });

        setData(result);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        // Fallback mock data if API fails (rate limits)
        console.warn('API failed, using mock data:', err);
        const mockData = generateMockData(500);
        
        // Preload mock textures too
        const textureLoader = new THREE.TextureLoader();
        mockData.forEach((coin) => {
             textureLoader.load(coin.image);
        });

        setData(mockData);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}

function generateMockData(count: number): StockData[] {
  return Array.from({ length: count }).map((_, i) => {
    const symbol = `COIN${i}`;
    // Try to map mock data to real symbols if index matches known top coins roughly
    // Or just use random
    return {
      id: `coin-${i}`,
      symbol: symbol,
      name: `Coin ${i}`,
      current_price: Math.random() * 1000 + 10,
      market_cap: Math.random() * 1000000000 + 1000000,
      price_change_percentage_24h: (Math.random() - 0.5) * 20, // -10% to +10%
      image: `https://placehold.co/64x64/${Math.floor(Math.random()*16777215).toString(16)}/white?text=C${i}`,
      total_volume: Math.random() * 1000000,
    };
  });
}
