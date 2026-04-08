// Maps common pantry items to static, highly-optimized Unsplash image URLs.
// This preserves your API rate limits for obscure or specific edge-case items.

export const COMMON_FOOD_IMAGES: Record<string, string> = {
  // Dairy & Eggs
  milk: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80",
  eggs: "https://images.unsplash.com/photo-1587486913049-53fd88ef16f3?w=500&q=80",
  cheese: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&q=80",
  butter: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80",
  yogurt: "https://images.unsplash.com/photo-1571212515416-f3b14562c5b0?w=500&q=80",

  // Bakery & Grains
  bread: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80",
  pasta: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=500&q=80",
  flour: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80",
  cereal: "https://images.unsplash.com/photo-1521252119934-8c4391e6c382?w=500&q=80",

  // Fruits
  apples: "https://media.istockphoto.com/id/614871876/photo/apple-isolated-on-wood-background.webp?a=1&b=1&s=612x612&w=0&k=20&c=GxR5a1dtDlF0-n6JA1p33uIxXLOzzfKOBr84zEtRtB8=",
  apple: "https://media.istockphoto.com/id/614871876/photo/apple-isolated-on-wood-background.webp?a=1&b=1&s=612x612&w=0&k=20&c=GxR5a1dtDlF0-n6JA1p33uIxXLOzzfKOBr84zEtRtB8=",
  bananas: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500&q=80",
  banana: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500&q=80",
  strawberries: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&q=80",
  avocados: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&q=80",
  lemons: "https://images.unsplash.com/photo-1587496678229-768ad11ff05d?w=500&q=80",
  oranges: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=500&q=80",

  // Vegetables
  tomatoes: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80",
  tomato: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80",
  carrots: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&q=80",
  potatoes: "https://images.unsplash.com/photo-1518977673322-bc082006733c?w=500&q=80",
  onions: "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=500&q=80",
  garlic: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80",
  spinach: "https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=500&q=80",
  kale: "https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=500&q=80",
  broccoli: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&q=80",

  // Meats & Proteins
  chicken: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&q=80",
  beef: "https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=500&q=80",
  pork: "https://images.unsplash.com/photo-1628268909376-e8c44bb3153f?w=500&q=80",
  fish: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=500&q=80",
  tofu: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80",

  // Generic Fallback
  default: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"
};

/**
 * Normalizes a scanned item name to safely check our dictionary cache.
 */
function normalizeFoodName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Dynamic Food Image Resolver.
 * Acts as an intelligent proxy: 
 * 1. Checks standard Dictionary (0 API limits)
 * 2. Falls back to Unsplash Live REST calls for strange/undefined items.
 */
export async function getFoodImage(foodName: string): Promise<string> {
  const normalized = normalizeFoodName(foodName);

  // 1. Check local static dictionary first (Free & Instant)
  for (const key of Object.keys(COMMON_FOOD_IMAGES)) {
    if (normalized.includes(key)) {
      return COMMON_FOOD_IMAGES[key];
    }
  }

  // 2. Fallback to API if not inherently cached
  try {
    // If running on backend: Pull from process.env.UNSPLASH_ACCESS_KEY
    // If running on client: Pull from process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

    // Safety check - if we have no key yet, render emergency default
    if (!unsplashKey) {
      console.warn("No Unsplash key found. Generating fallback image.");
      return COMMON_FOOD_IMAGES.default;
    }

    // Call active Unsplash query
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(normalized)}+food&per_page=1&client_id=${unsplashKey}`);

    if (!res.ok) {
      throw new Error(`Unsplash API rate limit or error (${res.status})`);
    }

    const data = await res.json();

    // Return precise API image, otherwise drop back down to standard cache
    if (data.results && data.results.length > 0) {
      return `${data.results[0].urls.raw}&w=500&q=80`;
    }

    return COMMON_FOOD_IMAGES.default;

  } catch (error) {
    console.warn("Failed retrieving dynamic photo. Loading dictionary fallback: ", error);
    return COMMON_FOOD_IMAGES.default;
  }
}
