import { getStatusInfo } from "../utils/status";
import { formatApplicationReference, formatDate, formatPrice } from "../utils/format";
import { CalendarIcon, ImageIcon, MapPinIcon } from "./icons";
import Badge from "./ui/Badge";
import { getImageUrl } from "../utils/image";

// One application on the dashboard. The progress stepper and history are added in Phase 19.
export default function ApplicationCard({ application }) {
  const status = getStatusInfo(application.status);
  const price = formatPrice(application.accommodation_price);

  return (
    <article className="application-card">
      <header className="application-card__header">
        <p className="application-card__ref">Application · {formatApplicationReference(application)}</p>
        <Badge variant={status.badge}>{status.label}</Badge>
      </header>

      <div className="application-card__body">
        {application.accommodation_image ? (
          <img
            className="application-card__image"
            src={getImageUrl(application.accommodation_image, 400)}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className="application-card__image application-card__image--empty" aria-hidden="true">
            <ImageIcon size={28} />
          </div>
        )}

        <div className="application-card__details">
          <h3 className="application-card__name">{application.accommodation_name}</h3>
          {application.accommodation_location && (
            <p className="application-card__meta">
              <MapPinIcon size={14} />
              {application.accommodation_location}
            </p>
          )}
          {price && (
            <p className="application-card__price">
              <strong>{price}</strong> / month
            </p>
          )}
          <p className="application-card__meta">
            <CalendarIcon size={14} />
            Applied {formatDate(application.created_at)}
          </p>
        </div>
      </div>

      {status.description && (
        <p className={`application-card__status application-card__status--${status.badge}`}>
          {status.description}
        </p>
      )}
    </article>
  );
}
