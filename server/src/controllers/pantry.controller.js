const { db } = require("../config/firebase");
const unsplashService = require("../services/unsplash.service");

// Helper to normalize strings for matching
const normalize = (str) => {
  if (!str) return "";
  // Lowercase, trim, and handle basic pluralization (removing trailing 's')
  return str.toLowerCase().trim().replace(/s$/, ""); 
};

exports.getItems = async (req, res) => {
  try {
    const userId = req.user.uid;
    const itemsRef = db.collection("pantry").doc(userId).collection("items");
    const snapshot = await itemsRef.get();
    
    const rawItems = [];
    snapshot.forEach((doc) => {
      rawItems.push({ id: doc.id, ...doc.data() });
    });

    // --- AUTO-CLEANUP LOGIC: Merging existing duplicates in the DB ---
    const groups = {};
    const toDelete = [];
    const mergedItems = [];

    for (const item of rawItems) {
      const key = `${normalize(item.name)}|${normalize(item.unit)}`;
      
      if (!groups[key]) {
        // First time seeing this item type
        groups[key] = { ...item };
        // Ensure it has a batches array
        if (!groups[key].batches) {
          groups[key].batches = [{ id: "legacy", quantity: item.quantity, expiry: item.expiry, addedAt: item.createdAt || new Date().toISOString() }];
        }
        mergedItems.push(groups[key]);
      } else {
        // Found a duplicate! Merge it into the first one
        const target = groups[key];
        const batchToAdd = item.batches || [{ id: `dup-${item.id}`, quantity: item.quantity, expiry: item.expiry, addedAt: item.createdAt || new Date().toISOString() }];
        
        target.batches = [...target.batches, ...batchToAdd];
        target.quantity = target.batches.reduce((acc, b) => acc + b.quantity, 0);
        target.updatedAt = new Date().toISOString();
        
        // Mark the duplicate document for deletion from Firestore
        toDelete.push(item.id);
      }
    }

    // Perform deletions in the background (fire and forget)
    if (toDelete.length > 0) {
      console.log(`[CLEANUP] Merging ${toDelete.length} duplicates for user ${userId}`);
      const batch = db.batch();
      toDelete.forEach(id => batch.delete(itemsRef.doc(id)));
      
      // Update the "master" documents with their new combined batches
      mergedItems.forEach(item => {
        if (toDelete.some(id => id !== item.id)) { // Only update if we actually merged something into it
           batch.update(itemsRef.doc(item.id), {
             batches: item.batches,
             quantity: item.quantity,
             updatedAt: new Date().toISOString(),
             lowercaseName: normalize(item.name)
           });
        }
      });
      
      await batch.commit();
    }
    
    res.status(200).json(mergedItems);
  } catch (error) {
    console.error("Get items/cleanup error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.addItem = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, quantity, unit, expiry, imageUrl } = req.body;
    const numQty = Number(quantity);

    // 1. Fetch all items for this user to perform a truly resilient normalized merge
    const itemsRef = db.collection("pantry").doc(userId).collection("items");
    const snapshot = await itemsRef.get();
    
    // Find exact match ignoring casing/spaces for both name and unit
    const existingDoc = snapshot.docs.find(doc => {
      const d = doc.data();
      return normalize(d.name) === normalize(name) && normalize(d.unit) === normalize(unit);
    });

    let finalImageUrl = imageUrl;
    if (!finalImageUrl) {
      finalImageUrl = await unsplashService.getFoodImage(name);
    }

    const newBatch = {
      id: Date.now().toString(),
      quantity: numQty,
      expiry: expiry || null,
      addedAt: new Date().toISOString()
    };

    if (existingDoc) {
      // MERGE logic
      const data = existingDoc.data();
      const batches = data.batches || [{ id: "legacy", quantity: data.quantity, expiry: data.expiry, addedAt: data.createdAt || new Date().toISOString() }];
      
      batches.push(newBatch);
      
      const updateData = {
        batches,
        lowercaseName: normalize(name), // Repairing field on the fly
        quantity: batches.reduce((acc, b) => acc + b.quantity, 0),
        updatedAt: new Date().toISOString()
      };
      
      await existingDoc.ref.update(updateData);
      return res.status(200).json({ id: existingDoc.id, ...data, ...updateData });
    } else {

      // NEW item logic
      const newItem = {
        name,
        lowercaseName: normalize(name),
        quantity: numQty,
        unit,
        imageUrl: finalImageUrl || null,
        batches: [newBatch],
        createdAt: new Date().toISOString()
      };
      
      const docRef = await itemsRef.add(newItem);
      res.status(201).json({ id: docRef.id, ...newItem });
    }
  } catch (error) {
    console.error("Add item error:", error);
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

    const itemsRef = db.collection("pantry").doc(userId).collection("items");
    // Fetch all current items once to perform in-memory merging
    const currentItemsSnapshot = await itemsRef.get();
    const currentItems = currentItemsSnapshot.docs.map(d => ({ ref: d.ref, data: d.data() }));

    const results = [];

    for (const item of items) {
      const qNum = Number(item.quantity) || 1;
      const normName = normalize(item.name);
      const normUnit = normalize(item.unit || "unit");

      // Look for match in local memory first, then in current pantry items
      const existing = currentItems.find(ci => 
        normalize(ci.data.name) === normName && 
        normalize(ci.data.unit) === normUnit
      );


      let finalImageUrl = item.imageUrl;
      if (!finalImageUrl) {
        finalImageUrl = await unsplashService.getFoodImage(item.name);
      }

      const newBatch = {
        id: Math.random().toString(36).substr(2, 9),
        quantity: qNum,
        expiry: item.expiry || null,
        addedAt: new Date().toISOString()
      };

      if (existing) {
        const data = existing.data;
        const batches = data.batches || [{ id: "legacy", quantity: data.quantity, expiry: data.expiry, addedAt: data.createdAt || new Date().toISOString() }];
        batches.push(newBatch);
        
        const update = {
          batches,
          lowercaseName: normName, // Repairing field locally
          quantity: batches.reduce((acc, b) => acc + b.quantity, 0),
          updatedAt: new Date().toISOString()
        };
        await existing.ref.update(update);
        
        // Update local memory so subsequent items in the same bulk request merge correctly
        existing.data = { ...existing.data, ...update };
        results.push({ id: existing.ref.id, ...existing.data });
      } else {
        const newItem = {
          name: item.name,
          lowercaseName: normName,
          quantity: qNum,
          unit: item.unit || "unit",
          imageUrl: finalImageUrl || null,
          batches: [newBatch],
          createdAt: new Date().toISOString(),
          source: "scan"
        };
        const docRef = await itemsRef.add(newItem);
        const savedItem = { id: docRef.id, ...newItem };
        
        // Add to local memory for potential further merges in this batch
        currentItems.push({ ref: docRef, data: newItem });
        results.push(savedItem);
      }
    }


    res.status(201).json({ message: "Bulk add/merge successful", items: results });
  } catch(error) {
    console.error("Bulk add error:", error);
    res.status(500).json({ error: "Failed to perform bulk insertion" });
  }
};

/**
 * Deducts quantity using FIFO (First In First Out) across batches.
 * Priority given to batches expiring sooner.
 */
const consumeQuantity = (batches, amountToDeduct) => {
  // Sort by expiry (null/furthest last)
  const sorted = [...batches].sort((a, b) => {
    if (!a.expiry) return 1;
    if (!b.expiry) return -1;
    return new Date(a.expiry) - new Date(b.expiry);
  });

  let remaining = amountToDeduct;
  const resultBatches = [];

  for (const batch of sorted) {
    if (remaining <= 0) {
      resultBatches.push(batch);
      continue;
    }

    if (batch.quantity <= remaining) {
      remaining -= batch.quantity;
      // Batch fully consumed, do not push to results
    } else {
      resultBatches.push({ ...batch, quantity: batch.quantity - remaining });
      remaining = 0;
    }
  }

  return resultBatches;
};

exports.useItem = async (req, res) => {
  try {
    const userId = req.user.uid;
    const itemRef = db.collection("pantry").doc(userId).collection("items").doc(req.params.id);
    const doc = await itemRef.get();
    
    if (!doc.exists) return res.status(404).json({ error: "Item not found" });
    
    const data = doc.data();
    const batches = data.batches || [{ id: "legacy", quantity: data.quantity, expiry: data.expiry, addedAt: data.createdAt }];
    
    const newBatches = consumeQuantity(batches, 1);
    
    if (newBatches.length === 0) {
      await itemRef.delete();
      return res.status(200).json({ message: "Item completely finished" });
    } else {
      const newTotal = newBatches.reduce((acc, b) => acc + b.quantity, 0);
      await itemRef.update({ batches: newBatches, quantity: newTotal });
      return res.status(200).json({ message: "Item used (FIFO)", quantity: newTotal });
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
    
    const data = doc.data();
    const totalQty = data.quantity;
    const batches = data.batches || [{ id: "legacy", quantity: data.quantity, expiry: data.expiry, addedAt: data.createdAt }];
    
    const newBatches = consumeQuantity(batches, totalQty * 0.5);
    
    const newTotal = newBatches.reduce((acc, b) => acc + b.quantity, 0);
    await itemRef.update({ batches: newBatches, quantity: newTotal });
    return res.status(200).json({ message: "Item halved (FIFO)", quantity: newTotal });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.adjustQuantity = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { deductAmount } = req.body;
    const itemRef = db.collection("pantry").doc(userId).collection("items").doc(req.params.id);
    const doc = await itemRef.get();
    
    if (!doc.exists) return res.status(404).json({ error: "Item not found" });
    if (isNaN(deductAmount) || deductAmount <= 0) return res.status(400).json({ error: "Invalid deduction amount" });

    const data = doc.data();
    const batches = data.batches || [{ id: "legacy", quantity: data.quantity, expiry: data.expiry, addedAt: data.createdAt }];
    
    const newBatches = consumeQuantity(batches, Number(deductAmount));
    
    if (newBatches.length === 0) {
      await itemRef.delete();
      return res.status(200).json({ message: "Item completely finished" });
    } else {
      const newTotal = newBatches.reduce((acc, b) => acc + b.quantity, 0);
      await itemRef.update({ batches: newBatches, quantity: newTotal });
      return res.status(200).json({ message: "Quantity adjusted", quantity: newTotal });
    }
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
