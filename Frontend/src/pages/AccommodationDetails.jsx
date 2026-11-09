import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import PhotoViewer from "../components/PhotoViewer";
import SiteFooter from "../components/SiteFooter";
import { GraduationCapIcon, ImageIcon, MailIcon, MapPinIcon, PhoneIcon, UserIcon } from "../components/icons";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import useAuth from "../context/useAuth";
import { getErrorMessage } from "../services/api";
import { getAccommodation, getAccommodationImages } from "../services/accommodationService";
import { applyForAccommodation, getMyApplications } from "../services/applicationService";
import {
  describePhoto,
  formatDistance,
  getRoomAvailability,
  getRoomTypeLabel,
} from "../utils/accommodation";
import { formatPrice } from "../utils/format";
import { getStatusInfo } from "../utils/status";
import { getImageUrl } from "../utils/image";

// Accommodation details: top half of the Figma "Accommodation detail and
// application" frame (title, photo grid, description, price card).
export default function AccommodationDetails() {
  const { id } = useParams();
  const isValidId = /^\d+$/.test(id ?? "");

  const [state, setState] = useState({ key: null, accommodation: null, images: [], error: "", notFound: false });
  const [viewerIndex, setViewerIndex] = useState(null);

  useEffect(() => {
    if (!isValidId) return undefined;
    let isCurrent = true;

    Promise.all([getAccommodation(id), getAccommodationImages(id).catch(() => [])])
      .then(([accommodation, images]) => {
        if (isCurrent) setState({ key: id, accommodation, images, error: "", notFound: false });
      })
      .catch((error) => {
        if (!isCurrent) return;
        setState({
          key: id,
          accommodation: null,
          images: [],
          notFound: error.response?.status === 404,
          error: getErrorMessage(error, "We couldn't load this home."),
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [id, isValidId]);

  const isLoading = isValidId && state.key !== id;
  const { accommodation, images } = state;

  let content;
  if (!isValidId || state.notFound) {
    content = (
      <div className="empty-state">
        <p className="empty-state__title">We couldn't find that home</p>
        <p className="empty-state__text">It may have been removed. Have a look at the other homes instead.</p>
        <Link to="/" className="btn btn--secondary btn--sm">
          Explore homes
        </Link>
      </div>
    );
  } else if (isLoading) {
    content = (
      <div className="details-skeleton" role="status">
        <span className="visually-hidden">Loading this home</span>
        <div className="skeleton skeleton--title" aria-hidden="true" />
        <div className="skeleton skeleton--gallery" aria-hidden="true" />
      </div>
    );
  } else if (state.error) {
    content = (
      <Alert variant="error" title="Something went wrong">
        {state.error}
      </Alert>
    );
  } else {
    content = (
      <>
        <header className="details-header">
          <h1 className="details-header__title">{accommodation.name}</h1>
          <p className="details-header__meta">
            <MapPinIcon size={16} />
            {getAddressLine(accommodation)}
          </p>
        </header>

        <Gallery title={accommodation.name} images={images} onOpen={setViewerIndex} />

        <div className="details-body">
          <section className="details-about" aria-labelledby="about-title">
            <h2 id="about-title" className="details-section-title">
              About the accommodation
            </h2>
            <p className="details-about__text">
              {accommodation.description || "The housing team hasn't added a description yet."}
            </p>

            {accommodation.room_types?.length > 0 && (
              <>
                <h2 className="details-section-title">Rooms and prices</h2>
                <ul className="room-list">
                  {accommodation.room_types.map((room) => {
                    const availability = getRoomAvailability(room);
                    return (
                      <li key={room.room_type}>
                        <span className="room-list__name">{getRoomTypeLabel(room.room_type)}</span>
                        <span>
                          <strong>{formatPrice(room.price)}</strong> / month
                        </span>
                        <span
                          className={`room-list__status${availability.isFull ? " room-list__status--full" : ""}`}
                        >
                          {availability.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {accommodation.distances?.length > 0 && (
              <>
                <h2 className="details-section-title">Distance to campus</h2>
                <ul className="distance-list">
                  {accommodation.distances.map((item) => (
                    <li key={item.campus}>
                      <GraduationCapIcon size={16} />
                      {formatDistance(item.distance_km)} to {item.campus}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {accommodation.facilities?.length > 0 && (
              <>
                <h2 className="details-section-title">Facilities</h2>
                <ul className="photo-tags">
                  {accommodation.facilities.map((facility) => (
                    <li key={facility} className="photo-tag">
                      {facility}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {accommodation.rules?.length > 0 && (
              <>
                <h2 className="details-section-title">House rules</h2>
                <ul className="rule-list">
                  {accommodation.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </>
            )}

            <ContactDetails accommodation={accommodation} />
          </section>

          <ApplyCard accommodation={accommodation} />
        </div>

        <PhotoViewer
          title={accommodation.name}
          images={images}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      </>
    );
  }

  return (
    <div className="page">
      <AppHeader />
      <main className="page__main details">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">‹ Homes in Windhoek</Link>
          {accommodation && !isLoading && (
            <>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{accommodation.name}</span>
            </>
          )}
        </nav>
        {content}
      </main>
      <SiteFooter />
    </div>
  );
}

// "12 Independence Avenue, Windhoek · Independence Avenue" without repeating the area
function getAddressLine({ address, location }) {
  if (!address) return location;
  return address.toLowerCase().includes(location.toLowerCase()) ? address : `${address} · ${location}`;
}

// Who to call or email about this home
function ContactDetails({ accommodation }) {
  const { contact_name: name, contact_phone: phone, contact_email: email } = accommodation;
  if (!name && !phone && !email) return null;

  return (
    <>
      <h2 className="details-section-title">Contact</h2>
      <ul className="contact-list">
        {name && (
          <li>
            <UserIcon size={16} />
            {name}
          </li>
        )}
        {phone && (
          <li>
            <PhoneIcon size={16} />
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-link">
              {phone}
            </a>
          </li>
        )}
        {email && (
          <li>
            <MailIcon size={16} />
            <a href={`mailto:${email}`} className="text-link">
              {email}
            </a>
          </li>
        )}
      </ul>
    </>
  );
}

// One large photo and up to four smaller ones, as in the Figma frame
function Gallery({ title, images, onOpen }) {
  if (images.length === 0) {
    return (
      <div className="gallery gallery--empty" aria-label="No photos yet">
        <ImageIcon size={36} />
        <p>No photos yet</p>
      </div>
    );
  }

  const shown = images.slice(0, 5);

  return (
    <div className={`gallery gallery--${shown.length}`}>
      {shown.map((image, index) => (
        <button
          key={image.id}
          type="button"
          className={`gallery__item${index === 0 ? " gallery__item--main" : ""}`}
          onClick={() => onOpen(index)}
          aria-label={`Open photo ${index + 1} of ${images.length}: ${describePhoto(image.image_url)}`}
        >
          <img
            src={getImageUrl(image.image_url, index === 0 ? 1200 : 600)}
            alt=""
            loading={index === 0 ? "eager" : "lazy"}
          />
        </button>
      ))}
      <button type="button" className="btn btn--secondary btn--sm gallery__all" onClick={() => onOpen(0)}>
        Show all {images.length} photos
      </button>
      <span className="visually-hidden">{title} photo gallery</span>
    </div>
  );
}

// Sticky price card: apply as a student, or log in first
function ApplyCard({ accommodation }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user && user.role !== "admin";

  const [existing, setExisting] = useState({ key: null, application: null });
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState("");

  const checkKey = isStudent ? `${user.id}:${accommodation.id}` : null;

  // Has this student already applied here?
  useEffect(() => {
    if (!checkKey) return undefined;
    let isCurrent = true;
    getMyApplications()
      .then((applications) => {
        if (!isCurrent) return;
        const match = applications.find((app) => Number(app.accommodation_id) === Number(accommodation.id));
        setExisting({ key: checkKey, application: match ?? null });
      })
      .catch(() => {
        if (isCurrent) setExisting({ key: checkKey, application: null });
      });
    return () => {
      isCurrent = false;
    };
  }, [checkKey, accommodation.id]);

  const handleApply = async () => {
    setApplyError("");
    setIsApplying(true);
    try {
      await applyForAccommodation(accommodation.id);
      navigate("/applications", { state: { notice: "applied" } });
    } catch (error) {
      setApplyError(getErrorMessage(error, "We couldn't send your application. Please try again."));
      setIsApplying(false);
    }
  };

  const price = formatPrice(accommodation.price);
  const isChecking = isStudent && existing.key !== checkKey;
  const status = existing.application ? getStatusInfo(existing.application.status) : null;

  return (
    <aside className="apply-card" aria-label="Price and application">
      {price && (
        <p className="apply-card__price">
          <span className="apply-card__from">From</span> <strong>{price}</strong> / month
        </p>
      )}
      <h2 className="apply-card__title">Make this your next home</h2>

      {!user && (
        <>
          <p className="apply-card__text">Log in or create a free account to apply.</p>
          <Link
            to="/login"
            state={{ from: `/accommodations/${accommodation.id}`, notice: "loginToApply" }}
            className="btn btn--primary btn--full"
          >
            Log in to apply
          </Link>
          <Link to="/register" className="text-link apply-card__secondary">
            Create an account
          </Link>
        </>
      )}

      {user && !isStudent && (
        <p className="apply-card__text">You're logged in as an admin, so you can't apply.</p>
      )}

      {isStudent && isChecking && <p className="apply-card__text">Checking your applications…</p>}

      {isStudent && !isChecking && existing.application && (
        <>
          <p className="apply-card__text">
            You've already applied here. Status: <strong>{status.label}</strong>.
          </p>
          <Link to="/applications" className="btn btn--secondary btn--full">
            View my application
          </Link>
        </>
      )}

      {isStudent && !isChecking && !existing.application && (
        <>
          <p className="apply-card__text">
            Send your application to the housing team. You can track it on your dashboard.
          </p>
          {applyError && <Alert variant="error">{applyError}</Alert>}
          <Button fullWidth isLoading={isApplying} loadingText="Sending…" onClick={handleApply}>
            Apply for this home
          </Button>
        </>
      )}
    </aside>
  );
}
