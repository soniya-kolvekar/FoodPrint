const { admin } = require("../config/firebase");

exports.protect = async (req, res, next) => {
  let token = req.headers.authorization;
  if (token && token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.warn("Auth Middleware Error:", error.message);
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};
