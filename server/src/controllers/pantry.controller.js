const { db } = require("../config/firebase");

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
    
    const newItem = {
      name,
      quantity: Number(quantity),
      unit,
      expiry,
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection("pantry").doc(userId).collection("items").add(newItem);
    res.status(201).json({ id: docRef.id, ...newItem });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
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
