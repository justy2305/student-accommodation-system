const jwt = require("jsonwebtoken");

const TOKEN_COOKIE_NAME = "token";

// Reads the JWT from the httpOnly cookie set at login (used by the React app),
// or from an "Authorization: Bearer <token>" header (still works for API tools).
const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");

    if (name === TOKEN_COOKIE_NAME) {
      try {
        return decodeURIComponent(valueParts.join("="));
      } catch {
        return null;
      }
    }
  }

  return null;
};

const authMiddleware = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      message: "Please log in to continue"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      message: "Your session has expired. Please log in again"
    });
  }
};

module.exports = authMiddleware;
module.exports.TOKEN_COOKIE_NAME = TOKEN_COOKIE_NAME;
module.exports.getTokenFromRequest = getTokenFromRequest;
