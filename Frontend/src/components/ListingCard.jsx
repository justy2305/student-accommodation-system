import { Link } from "react-router-dom";
import { formatDistance, getFirstSentence } from "../utils/accommodation";
import { formatPrice } from "../utils/format";
import { ArrowUpRightIcon, GraduationCapIcon, ImageIcon, MapPinIcon } from "./icons";
import { getImageUrl } from "../utils/image";

// Accommodation card from the Figma "Desktop accommodation discovery" frame.
// With a campus filter, it shows the distance to that campus.
export default function ListingCard({ accommodation, campus }) {
  // price_from is the cheapest room that matches the filters
  const price = formatPrice(accommodation.price_from ?? accommodation.price);
  const summary = getFirstSentence(accommodation.description);
  const roomTypes = (accommodation.room_types ?? []).map((room) => room.room_type);
  const campusDistance = campus
    ? (accommodation.distances ?? []).find((item) => item.campus === campus)
    : null;

  return (
    <article className="listing-card">
      <Link to={`/accommodations/${accommodation.id}`} className="listing-card__link">
        <div className="listing-card__media">
          {accommodation.cover_image ? (
            <img
              className="listing-card__image"
              src={getImageUrl(accommodation.cover_image, 600)}
              alt={`${accommodation.name}`}
              loading="lazy"
            />
          ) : (
            <div className="listing-card__image listing-card__image--empty" aria-hidden="true">
              <ImageIcon size={32} />
            </div>
          )}
          {accommodation.image_count > 1 && (
            <span className="listing-card__count">{accommodation.image_count} photos</span>
          )}
        </div>

        <div className="listing-card__body">
          <h3 className="listing-card__name">
            {accommodation.name}
            <ArrowUpRightIcon size={16} />
          </h3>
          <p className="listing-card__meta">
            <MapPinIcon size={14} />
            {accommodation.location}
          </p>
          {campusDistance && (
            <p className="listing-card__meta">
              <GraduationCapIcon size={14} />
              {formatDistance(campusDistance.distance_km)} to {campusDistance.campus}
            </p>
          )}
          {summary && <p className="listing-card__summary">{summary}</p>}
          {roomTypes.length > 0 && (
            <p className="listing-card__rooms">
              {roomTypes.join(" · ")} rooms
              {accommodation.available_rooms > 0 && (
                <span className="listing-card__available">
                  {" "}
                  · {accommodation.available_rooms} available
                </span>
              )}
            </p>
          )}
          {price && (
            <p className="listing-card__price">
              <span className="listing-card__from">From</span> <strong>{price}</strong> / month
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
