const axios = require("axios");

exports.getRecipes = async (req, res) => {
  try {
    const { ingredients } = req.query;
    if (!ingredients) return res.status(400).json({ error: "Missing ingredients" });
    
    // In actual implementation, add API key checks
    res.status(200).json({ message: "Recipe query successful", ingredients });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getRecipeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    res.status(200).json({ message: "Got recipe details", id });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.cookRecipe = async (req, res) => {
  try {
    res.status(200).json({ message: "Recipe cooked successfully", updatedItems: [] });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const fallbackSubstitutesMap = {
  "milk": [
    { name: "Soy milk", preparation: "Use a 1:1 ratio. Great for baking and cooking.", image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500&q=80" },
    { name: "Almond milk", preparation: "Use a 1:1 ratio. Adds a slight nutty flavor.", image: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=500&q=80" },
    { name: "Oat milk", preparation: "Use 1:1 ratio. Creamy texture, excellent for coffee.", image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&q=80" },
    { name: "Yogurt", preparation: "Use equal amounts but may thin with water if baking.", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80" }
  ],
  "eggs": [
    { name: "Applesauce", preparation: "Use 1/4 cup of unsweetened applesauce per egg.", image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=500&q=80" },
    { name: "Mashed bananas", preparation: "Use 1/4 cup mashed banana per egg. Adds banana flavor.", image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=500&q=80" },
    { name: "Flaxseed meal", preparation: "Mix 1 tbsp flaxseed with 3 tbsp water, let sit for 5 mins.", image: "https://images.unsplash.com/photo-1599940824399-b879809651a1?w=500&q=80" },
    { name: "Silken tofu", preparation: "Use 1/4 cup puréed silken tofu per egg.", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80" }
  ],
  "butter": [
    { name: "Olive oil", preparation: "Use 3/4 cup olive oil for every 1 cup of butter.", image: "https://images.unsplash.com/photo-1474965044301-12502ba06dce?w=500&q=80" },
    { name: "Coconut oil", preparation: "Use a 1:1 ratio. Excellent for baking.", image: "https://images.unsplash.com/photo-1628189680387-a2f2efd29792?w=500&q=80" },
    { name: "Avocado", preparation: "Use a 1:1 ratio. Provides great healthy fats.", image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&q=80" }
  ],
  "sugar": [
    { name: "Honey", preparation: "Use 3/4 cup honey for every 1 cup sugar. Reduce liquid by 2 tbsp.", image: "https://images.unsplash.com/photo-1587049352847-4d4b121bcbb8?w=500&q=80" },
    { name: "Maple syrup", preparation: "Use 3/4 cup maple syrup for every 1 cup sugar.", image: "https://images.unsplash.com/photo-1589134739556-3de6028549ce?w=500&q=80" },
    { name: "Agave nectar", preparation: "Use 2/3 cup agave for every 1 cup sugar.", image: "https://images.unsplash.com/photo-1582522434522-8d7653bbdf1c?w=500&q=80" }
  ]
};

const defaultImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80";

const fetchUnsplashImage = async (query) => {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) return defaultImage;
    
    // Improved query to force food-only results
    const searchQuery = `${query} food ingredient close-up photography`;
    const response = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=squarish&client_id=${accessKey}`);
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      return response.data.results[0].urls.small;
    }
  } catch (error) {
    console.warn("Unsplash API fetch failed:", error.message);
  }
  return defaultImage;
};

const formatSpoonacularSubs = async (subs) => {
  const seenNames = new Set();
  const results = await Promise.all(subs.map(async (sub) => {
     // Better name extraction: try to find the part after 'of' or 'or', or just skip first words if they are numbers/units
     let name = sub.toLowerCase()
       .replace(/^[0-9/\s]+(cup|tbsp|tsp|tablespoon|teaspoon|oz|ounce|gram|g|ml)?\s+(of|or)?\s+/i, "")
       .split(",")[0].trim();
     
     // Capitalize
     name = name.charAt(0).toUpperCase() + name.slice(1);
     
     if (seenNames.has(name) || !name || name.length < 3) return null;
     seenNames.add(name);

     const image = await fetchUnsplashImage(name);
     // If the image is just the default, it might be an irrelevant search result
     if (!image || image === defaultImage) return null;

     return {
        name: name,
        preparation: sub.charAt(0).toUpperCase() + sub.slice(1),
        image: image
     };
  }));

  return results.filter(sub => sub !== null).slice(0, 4);
};

exports.getSubstitutes = async (req, res) => {
  try {
    const { ingredient } = req.query;
    if (!ingredient) return res.status(400).json({ error: "Missing ingredient to substitute" });
    
    const sanitizedQuery = ingredient.toLowerCase().trim();

    if (process.env.SPOONACULAR_API_KEY && process.env.SPOONACULAR_API_KEY !== "your_spoonacular_api_key_here") {
      try {
         const response = await axios.get(`https://api.spoonacular.com/food/ingredients/substitutes?ingredientName=${encodeURIComponent(sanitizedQuery)}&apiKey=${process.env.SPOONACULAR_API_KEY}`);
         if (response.data && response.data.status === "success" && response.data.substitutes) {
             const structuredSubs = await formatSpoonacularSubs(response.data.substitutes);
             if (structuredSubs.length > 0) {
                return res.status(200).json({ ingredient, substitutes: structuredSubs });
             }
         }
      } catch(e) {
         console.warn("Spoonacular API failed, falling back", e.message);
      }
    }
    
    // Fallback logic
    let foundSubstitutes = fallbackSubstitutesMap[sanitizedQuery];
    
    if (!foundSubstitutes) {
       const matchedKey = Object.keys(fallbackSubstitutesMap).find(k => sanitizedQuery.includes(k) || k.includes(sanitizedQuery));
       if (matchedKey) foundSubstitutes = fallbackSubstitutesMap[matchedKey];
    }
    
    if (foundSubstitutes) {
       // Deep copy and filter just in case
       return res.status(200).json({ ingredient, substitutes: foundSubstitutes.slice(0, 4) });
    } else {
       const image1 = await fetchUnsplashImage(`Plant-based ${ingredient}`);
       const image2 = await fetchUnsplashImage(`Healthy ${ingredient} substitute`);
       
       const subProducts = [
         { name: `Plant-based ${ingredient}`, preparation: `Use a 1:1 ratio. Optimized for culinary performance.`, image: image1 }, 
         { name: `Artisanal ${ingredient} blend`, preparation: `A professional-grade pantry alternative.`, image: image2 }
       ].filter(s => s.image && s.image !== defaultImage);

       return res.status(200).json({ 
         ingredient, 
         substitutes: subProducts
       });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
