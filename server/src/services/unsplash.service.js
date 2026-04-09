const axios = require('axios');

/**
 * Service to fetch high-quality food images from Unsplash.
 * Implements a rotation mechanism for 3 API keys to avoid rate limits.
 */
class UnsplashService {
  constructor() {
    this.keys = [
      process.env.UNSPLASH_ACCESS_KEY_1,
      process.env.UNSPLASH_ACCESS_KEY_2,
      process.env.UNSPLASH_ACCESS_KEY_3
    ].filter(k => k && k.trim() !== "" && !k.includes("your_"));
    
    this.currentKeyIndex = 0;
  }

  /**
   * Fetches a dynamic image URL for a given food name.
   */
  async getFoodImage(foodName) {
    if (this.keys.length === 0) {
      console.warn("UnsplashService: No valid API keys found. Returning null.");
      return null;
    }

    // Try each key in sequence if one fails or hits rate limit
    for (let attempt = 0; attempt < this.keys.length; attempt++) {
      const activeKey = this.keys[this.currentKeyIndex];
      
      try {
        const query = encodeURIComponent(`${foodName} food`);
        const response = await axios.get(`https://api.unsplash.com/search/photos`, {
          params: {
            query: query,
            per_page: 1,
            orientation: 'squarish'
          },
          headers: {
            Authorization: `Client-ID ${activeKey}`
          }
        });

        const data = response.data;
        if (data.results && data.results.length > 0) {
          // Optimized size: raw + parameters for quality and dimensions
          return `${data.results[0].urls.raw}&w=600&h=400&fit=crop&q=80`;
        }
        
        // If no results, try a broader search or return null
        return null;

      } catch (error) {
        console.error(`UnsplashService: Key ${this.currentKeyIndex + 1} failed. Error: ${error.message}`);
        
        // Rotate to next key for next attempt
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
        
        // If we've exhausted all keys, return null
        if (attempt === this.keys.length - 1) {
          console.error("UnsplashService: All keys exhausted.");
          return null;
        }
      }
    }
    return null;
  }
}

module.exports = new UnsplashService();
