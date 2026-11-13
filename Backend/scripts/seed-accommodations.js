// Adds the real accommodations and their photos to the database.
// Run from the Backend folder (after `npm run db:setup`):  npm run db:seed
//
// Safe to run more than once: an accommodation that already exists (same
// name) is not added again, and a photo already linked is not linked twice.
//
// Photos live in Frontend/public/images/<folder>/ and are served by the
// frontend at /images/<folder>/<file>. The first photo listed is the cover.
// `npm run images:upload` then moves them to Cloudinary; photos already moved
// are not added again.
//
// Every home has these in its rooms; they are added to each home's own facilities
const ROOM_FACILITIES = [
  "Wi-Fi",
  "Individual bed",
  "Personal cupboard",
  "Kitchen locker",
  "Study desk and chair",
];

// Search filters use:
// - roomTypes: Single, Shared or Triple, with the monthly price of each
// - facilities: what the home offers (shown as filter options on Explore).
//   These always replace what is in the database when you run the seed.
// - distances: km from each campus. Walking times are converted at about
//   5 km/h (5 minutes = 0.4 km, 10 minutes = 0.8 km); change them if you
//   have exact distances.
// - availableRooms (per room type): how many are free now; null = not known
// - address, rules and contact: shown on the home's page
// Values already in the database are kept, so changes made later in the
// database are not overwritten. Empty values here are simply not shown.

const pool = require("../src/config/database");

const ACCOMMODATIONS = [
  {
    name: "StudentStay",
    location: "Windhoek West",
    price: 4100, // lowest monthly price ("from"); single rooms are N$ 5,100
    description: "A 5-minute walk to NUST main campus and 6.5 km to UNAM.",
    roomTypes: [
      { type: "Single", price: 5100, availableRooms: null },
      { type: "Shared", price: 4100, availableRooms: null },
    ],
    facilities: [
      "Study area",
      "Entertainment area",
      "Indoor gym",
      "Outdoor gym",
      "Basketball court",
      "Kitchen",
      "Bathrooms",
      ...ROOM_FACILITIES,
    ],
    distances: { NUST: 0.4, UNAM: 6.5 },
    // Listing details: fill these in with the real information
    address: null, // street address, e.g. "123 Independence Avenue, Windhoek"
    rules: [], // e.g. ["No visitors after 22:00", "No smoking inside"]
    contact: { name: null, phone: null, email: null },
    imageFolder: "studentstay",
    images: [
      "single-room-1.jpeg",
      "sharing-room-1.jpeg",
      "single-room-2.jpeg",
      "sharing-room-2.jpeg",
      "study-area.jpeg",
      "kitchen-1.jpeg",
      "kitchen-2.jpeg",
      "gym.jpeg",
      "bathroom-1.jpeg",
      "bathroom-2.jpeg",
      "bathroom-3.jpeg",
      "shower.jpeg",
      "entrance.jpeg",
      "outside-1.jpeg",
      "outside-2.jpeg",
    ],
  },
  {
    name: "Emona",
    location: "Academia",
    price: 3000,
    description: "A 5-minute walk to UNAM main campus and 6.5 km to NUST.",
    roomTypes: [{ type: "Shared", price: 3000, availableRooms: null }],
    facilities: ["Study area", "Kitchen", "Bathrooms", ...ROOM_FACILITIES],
    distances: { UNAM: 0.4, NUST: 6.5 },
    // Listing details: fill these in with the real information
    address: null, // street address, e.g. "123 Independence Avenue, Windhoek"
    rules: [], // e.g. ["No visitors after 22:00", "No smoking inside"]
    contact: { name: null, phone: null, email: null },
    imageFolder: "emona",
    images: [
      "sharing-room.jpeg",
      "sitting-area.jpeg",
      "kitchen-1.jpeg",
      "kitchen-2.jpeg",
      "bathroom.jpeg",
    ],
  },
  {
    name: "Capital Residence",
    location: "Independence Avenue",
    price: 3231, // lowest monthly price ("from"): triple room
    description: "A 10-minute walk to NUST main campus and 10 km to UNAM.",
    roomTypes: [
      { type: "Single", price: 4957, availableRooms: null },
      { type: "Shared", price: 3241, availableRooms: null }, // twin room
      { type: "Triple", price: 3231, availableRooms: null },
    ],
    facilities: ["Study area", "Entertainment area", "Kitchen", "Bathrooms", ...ROOM_FACILITIES],
    distances: { NUST: 0.8, UNAM: 10 },
    // Listing details: fill these in with the real information
    address: null, // street address, e.g. "123 Independence Avenue, Windhoek"
    rules: [], // e.g. ["No visitors after 22:00", "No smoking inside"]
    contact: { name: null, phone: null, email: null },
    imageFolder: "capital-residence",
    images: [
      "single-room.jpg",
      "twin-room.jpg",
      "room-view.jpg",
      "kitchen.jpg",
      "entertainment-area.jpg",
      "games-room.jpg",
    ],
  },
];

async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const accommodation of ACCOMMODATIONS) {
      let result = await client.query(
        "SELECT id FROM accommodations WHERE LOWER(name) = LOWER($1)",
        [accommodation.name]
      );

      let id;
      if (result.rows.length > 0) {
        id = result.rows[0].id;
        console.log(`${accommodation.name}: already exists (id ${id}), keeping it`);
      } else {
        result = await client.query(
          `INSERT INTO accommodations (name, location, description, price)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [accommodation.name, accommodation.location, accommodation.description, accommodation.price]
        );
        id = result.rows[0].id;
        console.log(`${accommodation.name}: added (id ${id})`);
      }

      let added = 0;
      for (const file of accommodation.images) {
        const url = `/images/${accommodation.imageFolder}/${file}`;
        // The same photo after `npm run images:upload` moved it to Cloudinary
        const cloudinaryUrl = `%/student-accommodations/${accommodation.imageFolder}/${file.replace(/\.[^.]+$/, "")}.%`;
        const insert = await client.query(
          `INSERT INTO accommodation_images (accommodation_id, image_url)
           SELECT $1, $2
           WHERE NOT EXISTS (
             SELECT 1 FROM accommodation_images
             WHERE accommodation_id = $1 AND (image_url = $2 OR image_url LIKE $3)
           )`,
          [id, url, cloudinaryUrl]
        );
        added += insert.rowCount;
      }
      console.log(`  photos linked: ${added} new, ${accommodation.images.length} in total`);

      // Description and facilities always follow this file; address, rules
      // and contact are only filled in where empty
      await client.query(
        `UPDATE accommodations SET
           description = $8,
           facilities = $2,
           address = COALESCE(address, $3),
           rules = CASE WHEN cardinality(rules) = 0 THEN $4 ELSE rules END,
           contact_name = COALESCE(contact_name, $5),
           contact_phone = COALESCE(contact_phone, $6),
           contact_email = COALESCE(contact_email, $7)
         WHERE id = $1`,
        [
          id,
          accommodation.facilities,
          accommodation.address,
          accommodation.rules,
          accommodation.contact.name,
          accommodation.contact.phone,
          accommodation.contact.email,
          accommodation.description,
        ]
      );

      for (const room of accommodation.roomTypes) {
        await client.query(
          `INSERT INTO accommodation_room_types (accommodation_id, room_type, price, available_rooms)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (accommodation_id, room_type) DO UPDATE
             SET available_rooms = COALESCE(
               accommodation_room_types.available_rooms, EXCLUDED.available_rooms
             )`,
          [id, room.type, room.price, room.availableRooms]
        );
      }

      for (const [campus, km] of Object.entries(accommodation.distances)) {
        await client.query(
          `INSERT INTO accommodation_distances (accommodation_id, campus, distance_km)
           VALUES ($1, $2, $3)
           ON CONFLICT (accommodation_id, campus) DO NOTHING`,
          [id, campus, km]
        );
      }
      console.log(
        `  room types: ${accommodation.roomTypes.map((room) => room.type).join(", ")}; ` +
          `facilities: ${accommodation.facilities.join(", ")}`
      );
    }

    await client.query("COMMIT");
    console.log("Done.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Seeding failed, nothing was changed:", error.message);
    if (/does not exist/.test(error.message)) {
      console.error("Run `npm run db:setup` first to create the tables.");
    }
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
