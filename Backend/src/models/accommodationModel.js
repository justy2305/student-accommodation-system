
const pool = require("../config/database");

// Room types a filter can ask for
const ROOM_TYPES = ["Single", "Shared", "Triple"];

// Each accommodation with its cover photo (the first one added), photo count,
// room types (cheapest first), total free rooms (NULL when not known) and
// distances to campuses (closest first)
const SELECT_COLUMNS = `
  SELECT
    accommodations.*,
    (SELECT image_url FROM accommodation_images Aimage
     WHERE Aimage.accommodation_id = accommodations.id
     ORDER BY Aimage.id LIMIT 1) AS cover_image,
    (SELECT COUNT(*)::int FROM accommodation_images Aimage
     WHERE Aimage.accommodation_id = accommodations.id) AS image_count,
    (SELECT COALESCE(
       json_agg(json_build_object(
         'room_type', Rtype.room_type,
         'price', Rtype.price,
         'is_available', Rtype.is_available,
         'available_rooms', Rtype.available_rooms
       ) ORDER BY Rtype.price), '[]'::json)
     FROM accommodation_room_types Rtype
     WHERE Rtype.accommodation_id = accommodations.id) AS room_types,
    (SELECT SUM(Rtype.available_rooms)::int
     FROM accommodation_room_types Rtype
     WHERE Rtype.accommodation_id = accommodations.id
       AND Rtype.is_available) AS available_rooms,
    (SELECT COALESCE(
       json_agg(json_build_object(
         'campus', Dist.campus,
         'distance_km', Dist.distance_km
       ) ORDER BY Dist.distance_km), '[]'::json)
     FROM accommodation_distances Dist
     WHERE Dist.accommodation_id = accommodations.id) AS distances`;

const SELECT_WITH_COVER = `${SELECT_COLUMNS}
  FROM accommodations`;

// Create an accommodation. details: { address, rules, contactName, contactPhone, contactEmail }
const createAccommodation = async (name, location, description, price, details = {}) => {
  const result = await pool.query(
    `INSERT INTO accommodations
       (name, location, description, price, address, rules, contact_name, contact_phone, contact_email)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      name,
      location,
      description,
      price,
      details.address ?? null,
      details.rules ?? [],
      details.contactName ?? null,
      details.contactPhone ?? null,
      details.contactEmail ?? null,
    ]
  );

  return result.rows[0];
};

// Get all accommodations
const getAllAccommodations = async () => {
  const result = await pool.query(
    `${SELECT_WITH_COVER} ORDER BY id DESC`
  );

  return result.rows;
};

// Get one accommodation by ID
const getAccommodationById = async (id) => {
  const result = await pool.query(
    `${SELECT_WITH_COVER} WHERE accommodations.id = $1`,
    [id]
  );

  return result.rows[0];
};

// Update an accommodation. Listing details that are not sent keep their value.
const updateAccommodation = async (
  id,
  name,
  location,
  description,
  price,
  details = {}
) => {
  const result = await pool.query(
    `UPDATE accommodations
     SET name = $1,
         location = $2,
         description = $3,
         price = $4,
         address = COALESCE($6, address),
         rules = COALESCE($7, rules),
         contact_name = COALESCE($8, contact_name),
         contact_phone = COALESCE($9, contact_phone),
         contact_email = COALESCE($10, contact_email)
     WHERE id = $5
     RETURNING *`,
    [
      name,
      location,
      description,
      price,
      id,
      details.address ?? null,
      details.rules ?? null,
      details.contactName ?? null,
      details.contactPhone ?? null,
      details.contactEmail ?? null,
    ]
  );

  return result.rows[0];
};

// Delete an accommodation
const deleteAccommodation = async (id) => {
  const result = await pool.query(
    "DELETE FROM accommodations WHERE id = $1 RETURNING *",
    [id]
  );

  return result.rows[0];
};

// Search and filter accommodations.
// - search / location: name or area contains the text
// - roomType, minPrice, maxPrice, available: the home has at least one room
//   type that matches all of them (price_from is the cheapest such room)
// - facilities: the home has every facility asked for
// - campus + maxDistance: the home is within maxDistance km of that campus
//   (with a campus, results are sorted closest first)
const searchAccommodations = async ({
  search,
  location,
  roomType,
  minPrice,
  maxPrice,
  available,
  facilities = [],
  campus,
  maxDistance,
}) => {
  const conditions = [];
  const values = [];
  const addValue = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  // Search by accommodation name OR location
  if (search) {
    const param = addValue(`%${search}%`);
    conditions.push(`(name ILIKE ${param} OR location ILIKE ${param})`);
  }

  // Filter by a specific location
  if (location) {
    conditions.push(`location ILIKE ${addValue(`%${location}%`)}`);
  }

  // Conditions on the room types (alias Rtype)
  const roomConditions = [];
  const priceConditions = []; // the same price checks, for homes with no room types

  if (roomType) {
    roomConditions.push(`Rtype.room_type = ${addValue(roomType)}`);
  }

  if (minPrice !== undefined) {
    const param = addValue(minPrice);
    roomConditions.push(`Rtype.price >= ${param}`);
    priceConditions.push(`accommodations.price >= ${param}`);
  }

  if (maxPrice !== undefined) {
    const param = addValue(maxPrice);
    roomConditions.push(`Rtype.price <= ${param}`);
    priceConditions.push(`accommodations.price <= ${param}`);
  }

  // Available: marked available, and not known to have 0 rooms free
  if (available) {
    roomConditions.push("Rtype.is_available AND COALESCE(Rtype.available_rooms, 1) > 0");
  }

  const roomWhere = ["Rtype.accommodation_id = accommodations.id", ...roomConditions].join(" AND ");

  if (roomConditions.length > 0) {
    const matchesRoom = `EXISTS (SELECT 1 FROM accommodation_room_types Rtype WHERE ${roomWhere})`;

    // A home without any room types can only match on its own price
    if (!roomType && !available) {
      const hasNoRoomTypes = `NOT EXISTS (SELECT 1 FROM accommodation_room_types Rtype
        WHERE Rtype.accommodation_id = accommodations.id)`;
      conditions.push(
        `(${matchesRoom} OR (${hasNoRoomTypes} AND ${priceConditions.join(" AND ")}))`
      );
    } else {
      conditions.push(matchesRoom);
    }
  }

  // Must have every facility asked for
  if (facilities.length > 0) {
    conditions.push(`accommodations.facilities @> ${addValue(facilities)}::text[]`);
  }

  // Distance from a campus
  let distanceColumn = "NULL::numeric";
  if (campus) {
    const campusParam = addValue(campus);
    distanceColumn = `(SELECT Dist.distance_km FROM accommodation_distances Dist
      WHERE Dist.accommodation_id = accommodations.id AND Dist.campus = ${campusParam})`;

    if (maxDistance !== undefined) {
      conditions.push(`${distanceColumn} <= ${addValue(maxDistance)}`);
    }
  }

  let query = `${SELECT_COLUMNS},
    COALESCE(
      (SELECT MIN(Rtype.price) FROM accommodation_room_types Rtype WHERE ${roomWhere}),
      accommodations.price
    ) AS price_from,
    ${distanceColumn} AS campus_distance_km
  FROM accommodations`;

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += campus
    ? " ORDER BY campus_distance_km ASC NULLS LAST, id DESC"
    : " ORDER BY id DESC";

  const result = await pool.query(query, values);
  return result.rows;
};

// Options for the Explore filters, taken from the homes that exist
const getFilterOptions = async () => {
  const [roomTypes, facilities, campuses] = await Promise.all([
    pool.query("SELECT DISTINCT room_type FROM accommodation_room_types"),
    pool.query(
      "SELECT DISTINCT unnest(facilities) AS facility FROM accommodations ORDER BY facility"
    ),
    pool.query("SELECT DISTINCT campus FROM accommodation_distances ORDER BY campus"),
  ]);

  const existingTypes = roomTypes.rows.map((row) => row.room_type);

  return {
    room_types: ROOM_TYPES.filter((type) => existingTypes.includes(type)),
    facilities: facilities.rows.map((row) => row.facility),
    campuses: campuses.rows.map((row) => row.campus),
  };
};

module.exports = {
  ROOM_TYPES,
  createAccommodation,
  getAllAccommodations,
  getAccommodationById,
  updateAccommodation,
  deleteAccommodation,
  searchAccommodations,
  getFilterOptions,
};
