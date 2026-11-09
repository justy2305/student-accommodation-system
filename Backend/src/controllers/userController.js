const userModel = require("../models/userModels");

// "My profile": the logged-in user reads and updates their own details.
// Every route here works on req.user.id from the verified token, never on an
// id sent by the browser, so nobody can view or change someone else's profile.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;
const STUDENT_NUMBER_PATTERN = /^[A-Za-z0-9-]{4,20}$/;

// Trimmed text, or null when empty
const optionalText = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
};

const toProfile = (user) => ({
  id: user.id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  institution: user.institution,
  student_number: user.student_number,
  programme: user.programme,
  year_of_study: user.year_of_study,
  created_at: user.created_at,
  updated_at: user.updated_at,
});


// GET /api/users/me
const getMyProfile = async (req, res) => {
  try {
    const user = await userModel.findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    return res.status(200).json({ profile: toProfile(user) });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Server error while loading your profile" });
  }
};


// PUT /api/users/me
const updateMyProfile = async (req, res) => {
  try {
    const body = req.body ?? {};

    const profile = {
      firstName: optionalText(body.first_name),
      lastName: optionalText(body.last_name),
      email: optionalText(body.email)?.toLowerCase() ?? null,
      phone: optionalText(body.phone),
      institution: optionalText(body.institution),
      studentNumber: optionalText(body.student_number),
      programme: optionalText(body.programme),
      yearOfStudy:
        body.year_of_study === undefined || body.year_of_study === null || body.year_of_study === ""
          ? null
          : Number(body.year_of_study),
    };

    // Field-by-field checks; the frontend shows each message under its field
    const errors = {};

    if (!profile.firstName) errors.first_name = "Enter your first name";
    else if (profile.firstName.length > 100) errors.first_name = "Use 100 characters or fewer";

    if (!profile.lastName) errors.last_name = "Enter your last name";
    else if (profile.lastName.length > 100) errors.last_name = "Use 100 characters or fewer";

    if (!profile.email) errors.email = "Enter your email address";
    else if (!EMAIL_PATTERN.test(profile.email) || profile.email.length > 255) {
      errors.email = "Enter a valid email address";
    }

    if (profile.phone && !PHONE_PATTERN.test(profile.phone)) {
      errors.phone = "Enter a valid phone number";
    }

    if (profile.institution && profile.institution.length > 100) {
      errors.institution = "Use 100 characters or fewer";
    }

    if (profile.studentNumber && !STUDENT_NUMBER_PATTERN.test(profile.studentNumber)) {
      errors.student_number = "Use 4 to 20 letters or numbers";
    }

    if (profile.programme && profile.programme.length > 150) {
      errors.programme = "Use 150 characters or fewer";
    }

    if (
      profile.yearOfStudy !== null &&
      (!Number.isInteger(profile.yearOfStudy) || profile.yearOfStudy < 1 || profile.yearOfStudy > 6)
    ) {
      errors.year_of_study = "Choose a year of study";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Please check the highlighted fields",
        errors,
      });
    }

    if (await userModel.isEmailTakenByOther(profile.email, req.user.id)) {
      return res.status(409).json({
        message: "Another account already uses this email",
        errors: { email: "Another account already uses this email" },
      });
    }

    const updated = await userModel.updateProfile(req.user.id, profile);

    if (!updated) {
      return res.status(404).json({ message: "Account not found" });
    }

    return res.status(200).json({
      message: "Profile updated",
      profile: toProfile(updated),
    });
  } catch (error) {
    // Unique-email race: another account took this email at the same moment
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Another account already uses this email",
        errors: { email: "Another account already uses this email" },
      });
    }

    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Server error while saving your profile" });
  }
};


module.exports = {
  getMyProfile,
  updateMyProfile,
};
