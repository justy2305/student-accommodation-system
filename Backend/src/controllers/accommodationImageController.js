const imageModel = require("../models/accommodationImageModel");

// Get all images for a specific accommodation
const getAccommodationImages = async (req, res) => {
  try {
    const accommodationId = Number(req.params.accommodationId);

    if (!Number.isInteger(accommodationId) || accommodationId <= 0) {
      return res.status(400).json({
        message: "Invalid accommodation id",
      });
    }

    const images = await imageModel.getAccommodationImages(accommodationId);

    return res.status(200).json({
      message: "Accommodation images retrieved successfully",
      images,
    });
  } catch (error) {
    console.error("Get accommodation images error:", error);

    return res.status(500).json({
      message: "Server error while retrieving images",
    });
  }
};

module.exports = {
  getAccommodationImages,
};
