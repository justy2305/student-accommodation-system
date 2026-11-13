
const accommodationModel = require("../models/accommodationModel");

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
// GET /api/accommodations/search?search=&roomType=&minPrice=&maxPrice=
//     &available=true&facilities=Kitchen,Gym&campus=NUST&maxDistance=2
const searchAccommodations = async (req, res) => {
  try {
    const {
      search,
      location,
      roomType,
      minPrice,
      maxPrice,
      available,
      facilities,
      campus,
      maxDistance,
    } = req.query;

    const isSet = (value) => value !== undefined && value !== "";
    const toNumber = (value) => (isSet(value) ? Number(value) : undefined);

    const filters = {
      search: isSet(search) ? String(search).trim() : undefined,
      location: isSet(location) ? String(location).trim() : undefined,
      roomType: isSet(roomType) ? String(roomType) : undefined,
      minPrice: toNumber(minPrice),
      maxPrice: toNumber(maxPrice),
      available: available === "true",
      facilities: isSet(facilities)
        ? String(facilities).split(",").map((facility) => facility.trim()).filter(Boolean)
        : [],
      campus: isSet(campus) ? String(campus).trim() : undefined,
      maxDistance: toNumber(maxDistance),
    };

    // Validate price values
    for (const price of [filters.minPrice, filters.maxPrice]) {
      if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
        return res.status(400).json({
          message: "Prices must be valid non-negative numbers",
        });
      }
    }

    // Check minimum price does not exceed maximum price
    if (
      filters.minPrice !== undefined &&
      filters.maxPrice !== undefined &&
      filters.minPrice > filters.maxPrice
    ) {
      return res.status(400).json({
        message: "Minimum price cannot be greater than maximum price",
      });
    }

    if (filters.roomType && !accommodationModel.ROOM_TYPES.includes(filters.roomType)) {
      return res.status(400).json({
        message: `Room type must be one of: ${accommodationModel.ROOM_TYPES.join(", ")}`,
      });
    }

    if (
      filters.facilities.length > 20 ||
      filters.facilities.some((facility) => facility.length > 50)
    ) {
      return res.status(400).json({
        message: "Invalid facilities filter",
      });
    }

    if (filters.campus && !/^[A-Za-z]{2,20}$/.test(filters.campus)) {
      return res.status(400).json({
        message: "Invalid campus",
      });
    }

    if (filters.maxDistance !== undefined) {
      if (!filters.campus) {
        return res.status(400).json({
          message: "Choose a campus to filter by distance",
        });
      }

      if (!Number.isFinite(filters.maxDistance) || filters.maxDistance <= 0) {
        return res.status(400).json({
          message: "Distance must be a number greater than 0",
        });
      }
    }

    const accommodations =
      await accommodationModel.searchAccommodations(filters);

    return res.status(200).json({
      count: accommodations.length,
      accommodations,
    });
  } catch (error) {
    // Prints the actual error in the VS Code terminal
    console.error("Search accommodations error:", error);

    return res.status(500).json({
      message: "Server error while searching accommodations",
    });
  }
};


// Options for the search filters (room types, facilities and campuses that exist)
const getFilterOptions = async (req, res) => {
  try {
    const options = await accommodationModel.getFilterOptions();
    return res.status(200).json(options);
  } catch (error) {
    console.error("Get filter options error:", error);

    return res.status(500).json({
      message: "Server error while loading filters",
    });
  }
};


// Export controller functions
module.exports = {
  getAllAccommodations,
  getAccommodationById,
  searchAccommodations,
  getFilterOptions,
};
