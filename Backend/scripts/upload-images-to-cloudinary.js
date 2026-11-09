// Moves the accommodation photos from Frontend/public/images to Cloudinary.
// Run from the Backend folder (after `npm run db:seed`):  npm run images:upload
// Add --dry-run to only list what would be uploaded:     npm run images:upload -- --dry-run
//
// For every photo in the database that still points to a local file
// (/images/<folder>/<file>), it uploads that file to Cloudinary and replaces
// the link in the database with the Cloudinary https link. Photos that are
// already on Cloudinary are skipped, so it is safe to run more than once.
//
// Needs CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env

const fs = require("fs");
const path = require("path");
const pool = require("../src/config/database"); // also loads .env
const cloudinary = require("../src/config/cloudinary");
const { isCloudinaryConfigured } = require("../src/config/cloudinary");

const PUBLIC_DIR = path.resolve(__dirname, "..", "..", "Frontend", "public");
const CLOUDINARY_FOLDER = "student-accommodations";
const isDryRun = process.argv.includes("--dry-run");

// "/images/studentstay/single-room-1.jpeg" → the file on disk, or null if the
// link points outside Frontend/public
function toLocalFile(imageUrl) {
  const file = path.resolve(PUBLIC_DIR, `.${imageUrl}`);
  return file.startsWith(PUBLIC_DIR + path.sep) ? file : null;
}

// "/images/studentstay/single-room-1.jpeg" → "student-accommodations/studentstay/single-room-1"
function toPublicId(imageUrl) {
  const [, , folder, file] = imageUrl.split("/");
  return `${CLOUDINARY_FOLDER}/${folder}/${path.parse(file).name}`;
}

async function main() {
  if (!isDryRun && !isCloudinaryConfigured()) {
    console.error(
      "Cloudinary is not set up. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and " +
        "CLOUDINARY_API_SECRET to Backend/.env (from your Cloudinary dashboard), then run this again."
    );
    process.exitCode = 1;
    await pool.end();
    return;
  }

  const { rows: images } = await pool.query(
    `SELECT accommodation_images.id, accommodation_images.image_url, accommodations.name
     FROM accommodation_images
     JOIN accommodations ON accommodations.id = accommodation_images.accommodation_id
     WHERE accommodation_images.image_url LIKE '/images/%'
     ORDER BY accommodation_images.id`
  );

  if (images.length === 0) {
    console.log("Nothing to upload: every photo is already on Cloudinary.");
    await pool.end();
    return;
  }

  console.log(`${images.length} photo(s) to upload${isDryRun ? " (dry run, nothing will change)" : ""}:`);

  let uploaded = 0;
  let failed = 0;

  for (const image of images) {
    const file = toLocalFile(image.image_url);
    const label = `${image.name}: ${image.image_url}`;

    if (!file || !fs.existsSync(file)) {
      console.warn(`  skipped  ${label} (file not found in Frontend/public)`);
      failed += 1;
      continue;
    }

    if (isDryRun) {
      console.log(`  would upload  ${label}`);
      continue;
    }

    try {
      const result = await cloudinary.uploader.upload(file, {
        public_id: toPublicId(image.image_url),
        resource_type: "image",
        overwrite: true,
      });

      await pool.query("UPDATE accommodation_images SET image_url = $1 WHERE id = $2", [
        result.secure_url,
        image.id,
      ]);

      uploaded += 1;
      console.log(`  uploaded ${label}`);
    } catch (error) {
      failed += 1;
      console.error(`  failed   ${label}: ${error.message ?? error.error?.message ?? error}`);
    }
  }

  if (!isDryRun) {
    console.log(`Done. ${uploaded} uploaded, ${failed} not uploaded.`);
    if (failed > 0) {
      console.log("Photos that were not uploaded keep their local link. Fix the problem and run this again.");
      process.exitCode = 1;
    }
  }

  await pool.end();
}

main().catch(async (error) => {
  console.error("Upload failed:", error.message);
  process.exitCode = 1;
  await pool.end().catch(() => {});
});
