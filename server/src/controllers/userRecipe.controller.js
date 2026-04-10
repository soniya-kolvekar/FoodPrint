const admin = require("firebase-admin");
const db = admin.firestore();

exports.saveRecipe = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { recipeId, title, image, servings, time } = req.body;

    if (!recipeId || !title) {
      return res.status(400).json({ error: "Missing recipe details" });
    }

    const savedRef = db.collection("users").doc(userId).collection("savedRecipes").doc(recipeId.toString());
    
    await savedRef.set({
      recipeId,
      title,
      image,
      servings,
      time,
      savedAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: "Recipe saved successfully" });
  } catch (error) {
    console.error("[SAVE ERROR]", error);
    res.status(500).json({ error: "Failed to save recipe" });
  }
};

exports.getSavedRecipes = async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db.collection("users").doc(userId).collection("savedRecipes").orderBy("savedAt", "desc").get();
    
    const saved = [];
    snapshot.forEach(doc => {
      saved.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(saved);
  } catch (error) {
    console.error("[GET SAVED ERROR]", error);
    res.status(500).json({ error: "Failed to fetch saved recipes" });
  }
};

exports.removeRecipe = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    await db.collection("users").doc(userId).collection("savedRecipes").doc(id).delete();
    
    res.status(200).json({ success: true, message: "Recipe removed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove recipe" });
  }
};
