
const imageModel = require("../models/accommodationImageModel");

// Upload an accommodation image
const uploadAccommodationImage = async (req, res) => {
  try {
    const { accommodationId } = req.params;

    // Check whether an image was selected
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image to upload",
      });
    }

    // Save the Cloudinary image URL (https://res.cloudinary.com/...) in PostgreSQL
    const image = await imageModel.createAccommodationImage(
      Number(accommodationId),
      req.file.path
    );

    return res.status(201).json({
      message: "Image uploaded successfully",
      image,
    });
  } catch (error) {
    console.error("Image upload error:", error);

    return res.status(500).json({
      message: "Server error while uploading image",
    });
  }
};

// Get all images for a specific accommodation
const getAccommodationImages = async (req, res) => {
  try {
    const { accommodationId } = req.params;

    const images = await imageModel.getAccommodationImages(
      accommodationId
    );

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

// Export the controller functions
module.exports = {
  uploadAccommodationImage,
  getAccommodationImages,
};
