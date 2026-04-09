const { db } = require("../config/firebase");
const unsplashService = require("../services/unsplash.service");

exports.getItems = async (req, res) => {
  try {
    const userId = req.user.uid;
    const itemsSnapshot = await db.collection("pantry").doc(userId).collection("items").get();
    
    const items = [];
    itemsSnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.addItem = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, quantity, unit, expiry, imageUrl } = req.body;
    
    // Dynamically fetch image if not provided
    let finalImageUrl = imageUrl;
    if (!finalImageUrl) {
      finalImageUrl = await unsplashService.getFoodImage(name);
    }

    const newItem = {
      name,
      quantity: Number(quantity),
      unit,
      expiry: expiry || null,
      imageUrl: finalImageUrl || null,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection("pantry").doc(userId).collection("items").add(newItem);
    res.status(201).json({ id: docRef.id, ...newItem });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.bulkAddItems = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid payload, expected array of items" });
    }

    const batch = db.batch();
    const collectionRef = db.collection("pantry").doc(userId).collection("items");
    
    const addedItems = [];

    for (const item of items) {
      const docRef = collectionRef.doc(); // Auto-generate ID
      
      let finalImageUrl = item.imageUrl;
      if (!finalImageUrl) {
        finalImageUrl = await unsplashService.getFoodImage(item.name);
      }

      const newItem = {
        name: item.name,
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'unit',
        expiry: item.expiry || null,
        imageUrl: finalImageUrl || null,
        createdAt: new Date().toISOString(),
        source: "scan"
      };
      batch.set(docRef, newItem);
      addedItems.push({ id: docRef.id, ...newItem });
    }

    await batch.commit();
    res.status(201).json({ message: "Bulk insert successful", items: addedItems });
  } catch(error) {
    console.error("Bulk add error:", error);
    res.status(500).json({ error: "Failed to perform bulk insertion" });
  }
};

exports.useItem = async (req, res) => {
  try {
    const userId = req.user.uid;
    const itemId = req.params.id;
    
    const itemRef = db.collection("pantry").doc(userId).collection("items").doc(itemId);
    const doc = await itemRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Item not found" });
    
    const newQty = doc.data().quantity - 1;
    if (newQty <= 0) {
      await itemRef.delete();
      return res.status(200).json({ message: "Item removed" });
    } else {
      await itemRef.update({ quantity: newQty });
      return res.status(200).json({ message: "Item decremented", quantity: newQty });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.halfItem = async (req, res) => {
  try {
    const userId = req.user.uid;
    const itemRef = db.collection("pantry").doc(userId).collection("items").doc(req.params.id);
    const doc = await itemRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Item not found" });
    
    const newQty = doc.data().quantity * 0.5;
    await itemRef.update({ quantity: newQty });
    return res.status(200).json({ message: "Item halved", quantity: newQty });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.finishItem = async (req, res) => {
  try {
    const userId = req.user.uid;
    const itemRef = db.collection("pantry").doc(userId).collection("items").doc(req.params.id);
    await itemRef.delete();
    return res.status(200).json({ message: "Item finished" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
