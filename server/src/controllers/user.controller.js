const { db } = require("../config/firebase");

exports.getMe = async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(200).json({ uid: req.user.uid, email: req.user.email });
    }
    res.status(200).json(userDoc.data());
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, age, bio, gender, culinaryLevel } = req.body;
    
    const updatedData = {
      uid: req.user.uid,
      email: req.user.email,
      name: name || "",
      age: age || "",
      bio: bio || "",
      gender: gender || "",
      culinaryLevel: culinaryLevel !== undefined ? Number(culinaryLevel) : 1
    };

    await db.collection("users").doc(req.user.uid).set(updatedData, { merge: true });
    res.status(200).json(updatedData);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
