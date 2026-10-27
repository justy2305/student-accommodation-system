
const accommodationModel = require("../models/accommodationModel");

// Create accommodation
const createAccommodation = async (req, res) => {
  try {
    const { name, location, description, price } = req.body;

    if (!name || !location || price === undefined || price === "") {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    const accommodation =
      await accommodationModel.createAccommodation(
        name,
        location,
        description,
        price
      );

    return res.status(201).json({
      message: "Accommodation created successfully",
      accommodation,
    });
  } catch (error) {
    console.error("Create accommodation error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// Get all accommodations
const getAllAccommodations = async (req, res) => {
  try {
    const accommodations =
      await accommodationModel.getAllAccommodations();

    return res.status(200).json({
      accommodations,
    });
  } catch (error) {
    console.error("Get accommodations error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// Get one accommodation by ID
const getAccommodationById = async (req, res) => {
  try {
    const { id } = req.params;

    const accommodation =
      await accommodationModel.getAccommodationById(id);

    if (!accommodation) {
      return res.status(404).json({
        message: "Accommodation not found",
      });
    }

    return res.status(200).json({
      accommodation,
    });
  } catch (error) {
    console.error("Get accommodation error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// Search and filter accommodations
const searchAccommodations = async (req, res) => {
  try {
    const { search, location, minPrice, maxPrice } = req.query;

    // Validate price values
    if (
      (minPrice !== undefined &&
        minPrice !== "" &&
        (!Number.isFinite(Number(minPrice)) ||
          Number(minPrice) < 0)) ||
      (maxPrice !== undefined &&
        maxPrice !== "" &&
        (!Number.isFinite(Number(maxPrice)) ||
          Number(maxPrice) < 0))
    ) {
      return res.status(400).json({
        message: "Prices must be valid non-negative numbers",
      });
    }

    // Check minimum price does not exceed maximum price
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
    // Prints the actual error in the VS Code terminal
    console.error("Search accommodations error:", error);

    // Temporary debugging detail for local development
    return res.status(500).json({
      message: "Server error while searching accommodations",
      error: error.message,
    });
  }
};


// Update accommodation
const updateAccommodation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, description, price } = req.body;

    const accommodation =
      await accommodationModel.updateAccommodation(
        id,
        name,
        location,
        description,
        price
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
    console.error("Update accommodation error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// Delete accommodation
const deleteAccommodation = async (req, res) => {
  try {
    const { id } = req.params;

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
    console.error("Delete accommodation error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


// Export controller functions
module.exports = {
  createAccommodation,
  getAllAccommodations,
  getAccommodationById,
  updateAccommodation,
  deleteAccommodation,
  searchAccommodations,
};
