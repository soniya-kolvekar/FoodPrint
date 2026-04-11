const axios = require("axios");
const admin = require("firebase-admin");
const crypto = require("crypto");
const db = admin.firestore();

const MEALDB_URL = "https://www.themealdb.com/api/json/v1/1/filter.php";
const MEALDB_LOOKUP_URL = "https://www.themealdb.com/api/json/v1/1/lookup.php";
const SPOONACULAR_FIND_URL = "https://api.spoonacular.com/recipes/findByIngredients";
const SPOONACULAR_INFO_URL = "https://api.spoonacular.com/recipes/informationBulk";
const API_KEY = process.env.SPOONACULAR_API_KEY;

// 1. HELPER: Generate human-readable cache key
const generateCacheKey = (ingredients, filters) => {
  const sorted = [...ingredients].map(i => i.toLowerCase().trim().replace(/ /g, "-")).sort();
  const top3 = sorted.slice(0, 3).join("-");
  const meal = (filters.mealType || "any").toLowerCase();
  const taste = (filters.taste || "any").toLowerCase();
  return `${top3}_${meal}_${taste}`;
};

// 2. HELPER: Fetch from TheMealDB (Free)
const fetchFromTheMealDB = async (userIngredients) => {
  console.log("[FREE] Attempting TheMealDB rescue...");
  // TheMealDB only allows 1 ingredient at a time. We'll try the first 3 major ones.
  const searchItems = userIngredients.slice(0, 3);
  const requests = searchItems.map(item => axios.get(`${MEALDB_URL}?i=${item}`));
  const responses = await Promise.allSettled(requests);
  
  const ids = new Set();
  responses.forEach(res => {
     if (res.status === 'fulfilled' && res.value.data.meals) {
        res.value.data.meals.forEach(m => ids.add(m.idMeal));
     }
  });

  if (ids.size === 0) return [];

  // Fetch details for the first 10 unique IDs to filter locally
  const detailIDs = Array.from(ids).slice(0, 10);
  const detailRequests = detailIDs.map(id => axios.get(`${MEALDB_LOOKUP_URL}?i=${id}`));
  const detailResponses = await Promise.allSettled(detailRequests);

  const matchingRecipes = [];
  detailResponses.forEach(res => {
    if (res.status === 'fulfilled' && res.value.data.meals) {
      const meal = res.value.data.meals[0];
      const ingredients = [];
      for(let i=1; i<=20; i++) {
        const ing = meal[`strIngredient${i}`];
        if (ing) ingredients.push(ing.toLowerCase().trim());
      }

      // Check how many ingredients we actually have
      const used = ingredients.filter(ing => 
        userIngredients.some(ui => ing.includes(ui) || ui.includes(ing))
      );
      const missedCount = ingredients.length - used.length;
      const percent = Math.round((used.length / ingredients.length) * 100);

      // Relaxed rule: Include 50% matches or close partials
      if (percent >= 40 || missedCount <= 5) {
        matchingRecipes.push({
          id: `mealdb-${meal.idMeal}`,
          title: meal.strMeal,
          image: meal.strMealThumb,
          usedIngredients: used,
          missedIngredients: ingredients.filter(i => !used.includes(i)),
          matchPercentage: percent,
          time: "20-40m",
          summary: `A delicious ${meal.strCategory} dish from TheMealDB. Best served fresh.`,
          source: "mealdb"
        });
      }
    }
  });

  return matchingRecipes.sort((a, b) => b.matchPercentage - a.matchPercentage);
};

// 3. HELPER: Fetch from Spoonacular (Fallback)
const fetchFromSpoonacular = async (userIngredients) => {
  try {
    console.log("[LIMITED] Falling back to Spoonacular Engine...");
    const basics = ["salt", "pepper", "water", "olive oil", "vegetable oil", "sugar", "flour", "milk"];
    const searchList = Array.from(new Set([...userIngredients, ...basics])).join(",");

    const res = await axios.get(SPOONACULAR_FIND_URL, {
      params: { apiKey: API_KEY, ingredients: searchList, number: 10, ranking: 1, ignorePantry: true }
    });

    if (!res.data || res.data.length === 0) return [];

    const ids = res.data.map(r => r.id).join(",");
    let detailedRecipes = [];
    
    try {
      const infoRes = await axios.get(SPOONACULAR_INFO_URL, { params: { apiKey: API_KEY, ids } });
      detailedRecipes = infoRes.data || [];
    } catch (infoErr) {
      console.warn("[QUOTA] Metadata enrichment failed. Using basic Spoonacular data.");
      detailedRecipes = res.data.map(r => ({ ...r, summary: "Details limited.", readyInMinutes: null }));
    }

    return detailedRecipes.map(detail => {
      const match = res.data.find(m => m.id === detail.id);
      const used = match?.usedIngredientCount || 0;
      const missed = match?.missedIngredientCount || 0;
      const percent = Math.round((used / (used + missed)) * 100);

      return {
        id: `spoon-${detail.id}`,
        title: detail.title,
        image: detail.image,
        usedIngredients: (match?.usedIngredients || []).map(i => i.name),
        missedIngredients: (match?.missedIngredients || []).map(i => i.name),
        matchPercentage: percent,
        time: detail.readyInMinutes ? `${detail.readyInMinutes}m` : "N/A",
        summary: detail.summary?.replace(/<[^>]*>?/gm, "").substring(0, 160) + "...",
        source: "spoonacular"
      };
    });
  } catch (err) {
    if (err.response?.status === 402) {
      console.warn("[QUOTA] Spoonacular total limit reached. Skipping this source.");
      return [];
    }
    throw err;
  }
};

exports.getRecipes = async (req, res) => {
  try {
    const { ingredients: rawItems, mealType, taste } = req.query;
    if (!rawItems) return res.status(200).json([]);

    const userIngredients = rawItems.split(",").map(i => i.trim().toLowerCase());
    const cacheKey = generateCacheKey(userIngredients, { mealType, taste });

    // 1. CHECK CACHE
    const cacheRef = db.collection("recipesCache").doc(cacheKey);
    const cachedDoc = await cacheRef.get();

    if (cachedDoc.exists) {
      const data = cachedDoc.data();
      const ageHours = (Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60);
      if (ageHours < 24) {
        console.log(`[CACHE HIT] Delivering: ${cacheKey}`);
        return res.status(200).json(data.recipes);
      }
    }

    // 2. PIPELINE START
    let finalRecipes = await fetchFromTheMealDB(userIngredients);

    // 3. FALLBACK IF NEEDED
    if (finalRecipes.length < 5) {
      const spoonRecipes = await fetchFromSpoonacular(userIngredients);
      finalRecipes = [...finalRecipes, ...spoonRecipes];
    }

    // 4. STORAGE & RESPONSE
    await cacheRef.set({
      recipes: finalRecipes.slice(0, 20),
      createdAt: new Date().toISOString()
    });

    console.log(`[PIPELINE SUCCESS] ${finalRecipes.length} recipes returned for: ${cacheKey}`);
    res.status(200).json(finalRecipes);

  } catch (error) {
    if (error.response?.status === 402 || error.message?.includes("402")) {
      console.warn("[FINAL GUARD] Quota exhausted during rescue mission. Proceeding with empty results.");
      return res.status(200).json([]);
    }
    console.error("[RECIPE ENGINE ERROR]", error.message);
    res.status(500).json({ error: "Recipe Rescue Engine currently overloaded." });
  }
};

exports.getRecipeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (id.startsWith("spoon-")) {
      const realId = id.replace("spoon-", "");
      const resData = await axios.get(`https://api.spoonacular.com/recipes/${realId}/information`, {
        params: { apiKey: API_KEY }
      });
      return res.status(200).json(resData.data);
    }
    // MealDB details lookup
    const realId = id.replace("mealdb-", "");
    const resData = await axios.get(`${MEALDB_LOOKUP_URL}?i=${realId}`);
    res.status(200).json(resData.data.meals[0]);
  } catch (err) {
    res.status(500).json({ error: "Details unavailable." });
  }
};

exports.cookRecipe = async (req, res) => {
  // Logic to deduct ingredients could be added here in the future
  res.status(200).json({ message: "Recipe deduction logic pending", updatedItems: [] });
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
