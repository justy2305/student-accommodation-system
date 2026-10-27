
const accommodationModel = require("../models/accommodationModel");

// Create a new accommodation
const createAccommodation = async (req, res) => {
  try {
    const { name, location, description, price } = req.body;

    if (!name || !location || !description || price === undefined) {
      return res.status(400).json({
        message: "Name, location, description, and price are required",
      });
    }

    const accommodationPrice = Number(price);

    if (!Number.isFinite(accommodationPrice) || accommodationPrice < 0) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number",
      });
    }

    const accommodation = await accommodationModel.createAccommodation(
      name,
      location,
      description,
      accommodationPrice
    );

    return res.status(201).json({
      message: "Accommodation created successfully",
      accommodation,
    });
  } catch (error) {
    console.error("Create accommodation error:", error.message);

    return res.status(500).json({
      message: "Server error while creating accommodation",
    });
  }
};

// Get all accommodations
const getAllAccommodations = async (req, res) => {
  try {
    const accommodations =
      await accommodationModel.getAllAccommodations();

    return res.status(200).json({
      count: accommodations.length,
      accommodations,
    });
  } catch (error) {
    console.error("Get accommodations error:", error.message);

    return res.status(500).json({
      message: "Server error while retrieving accommodations",
    });
  }
};

// Get one accommodation by ID
const getAccommodationById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid accommodation ID",
      });
    }

    const accommodation =
      await accommodationModel.getAccommodationById(id);

    if (!accommodation) {
      return res.status(404).json({
        message: "Accommodation not found",
      });
    }

    return res.status(200).json({ accommodation });
  } catch (error) {
    console.error("Get accommodation error:", error.message);

    return res.status(500).json({
      message: "Server error while retrieving accommodation",
    });
  }
};

// Update an accommodation
const updateAccommodation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, location, description, price } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid accommodation ID",
      });
    }

    if (!name || !location || !description || price === undefined) {
      return res.status(400).json({
        message: "Name, location, description, and price are required",
      });
    }

    const accommodationPrice = Number(price);

    if (!Number.isFinite(accommodationPrice) || accommodationPrice < 0) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number",
      });
    }

    const accommodation =
      await accommodationModel.updateAccommodation(
        id,
        name,
        location,
        description,
        accommodationPrice
      );

    if (!accommodation) {
      return res.status(404).json({
        message: "Accommodation not found",
      });
    }

    return res.status(200).json({
      message: "Accommodation updated successfully",
      accommodation,
    });
  } catch (error) {
    console.error("Update accommodation error:", error.message);

    return res.status(500).json({
      message: "Server error while updating accommodation",
    });
  }
};

// Delete an accommodation
const deleteAccommodation = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid accommodation ID",
      });
    }

    const accommodation =
      await accommodationModel.deleteAccommodation(id);

    if (!accommodation) {
      return res.status(404).json({
        message: "Accommodation not found",
      });
    }

    return res.status(200).json({
      message: "Accommodation deleted successfully",
      accommodation,
    });
  } catch (error) {
    console.error("Delete accommodation error:", error.message);

    return res.status(500).json({
      message: "Server error while deleting accommodation",
    });
  }
};

// Search and filter accommodations
const searchAccommodations = async (req, res) => {
  try {
    const { search, location, minPrice, maxPrice } = req.query;

    if (minPrice !== undefined && minPrice !== "") {
      if (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0) {
        return res.status(400).json({
          message: "Prices must be valid non-negative numbers",
        });
      }
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      if (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0) {
        return res.status(400).json({
          message: "Prices must be valid non-negative numbers",
        });
      }
    }

    if (
      minPrice !== undefined &&
      minPrice !== "" &&
      maxPrice !== undefined &&
      maxPrice !== "" &&
      Number(minPrice) > Number(maxPrice)
    ) {
      return res.status(400).json({
        message: "Minimum price cannot be greater than maximum price",
      });
    }

    const accommodations =
      await accommodationModel.searchAccommodations({
        search,
        location,
        minPrice,
        maxPrice,
      });

    return res.status(200).json({
      count: accommodations.length,
      accommodations,
    });
  } catch (error) {
    console.error("Search accommodations error:", error.message);

    return res.status(500).json({
      message: "Server error while searching accommodations",
    });
  }
};

module.exports = {
  createAccommodation,
  getAllAccommodations,
  getAccommodationById,
  updateAccommodation,
  deleteAccommodation,
  searchAccommodations,
};
