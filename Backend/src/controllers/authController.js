const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModels");
const {
  TOKEN_COOKIE_NAME,
  getTokenFromRequest
} = require("../middleware/authMiddleware");

const TOKEN_LIFETIME = "1h";
const TOKEN_LIFETIME_MS = 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Compared against when the email is unknown, so a failed login takes the
// same time whether or not the account exists (prevents email enumeration).
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("not-a-real-password", 10);

const cookieOptions = {
  httpOnly: true, // JavaScript in the browser can never read the token
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "lax", // not sent on cross-site POSTs (CSRF protection)
  path: "/"
};

const toPublicUser = (user) => ({
  id: user.id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  phone: user.phone,
  role: user.role
});

const startSession = (res, user) => {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: TOKEN_LIFETIME
    }
  );

  res.cookie(TOKEN_COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: TOKEN_LIFETIME_MS
  });
};


// Student Registration
const register = async (req, res) => {
  try {
    const firstName = req.body.firstName?.trim();
    const lastName = req.body.lastName?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const phone = req.body.phone?.trim() || null;
    const { password } = req.body;

    // Check required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Please provide all required fields"
      });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address"
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    // Check if email already exists
    const existingUser = await userModel.findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists"
      });
    }

    // Hash password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (role is never taken from the request body)
    const user = await userModel.createUser(
      firstName,
      lastName,
      email,
      hashedPassword,
      phone
    );

    // Log the new student in straight away
    startSession(res, user);

    res.status(201).json({
      message: "User registered successfully",
      user: toPublicUser(user)
    });

  } catch (error) {
    // Unique-constraint race: two sign-ups with the same email at once
    if (error.code === "23505") {
      return res.status(409).json({
        message: "An account with this email already exists"
      });
    }

    console.error("Registration error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


// Student Login
const login = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    // Check email and password
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password"
      });
    }

    // Find user by email
    const user = await userModel.findUserByEmail(email);

    // Compare entered password with hashed password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user ? user.password : DUMMY_PASSWORD_HASH
    );

    if (!user || !isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Login successful: the token goes in an httpOnly cookie, not the body
    startSession(res, user);

    res.json({
      message: "Login successful",
      user: toPublicUser(user)
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


// Current user (used by the frontend to restore the session on page load).
// Returns { user: null } instead of a 401 when nobody is logged in.
const getCurrentUser = async (req, res) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.json({ user: null });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      res.clearCookie(TOKEN_COOKIE_NAME, cookieOptions);
      return res.json({ user: null });
    }

    const user = await userModel.findUserById(decoded.id);

    if (!user) {
      res.clearCookie(TOKEN_COOKIE_NAME, cookieOptions);
      return res.json({ user: null });
    }

    res.json({ user: toPublicUser(user) });

  } catch (error) {
    console.error("Current user error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


// Logout: remove the session cookie
const logout = (req, res) => {
  res.clearCookie(TOKEN_COOKIE_NAME, cookieOptions);

  res.json({
    message: "Logged out"
  });
};


module.exports = {
  register,
  login,
  getCurrentUser,
  logout
};
