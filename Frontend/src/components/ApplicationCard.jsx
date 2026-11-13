import { useState } from "react";
import { getErrorMessage } from "../services/api";
import { withdrawApplication } from "../services/applicationService";
import { getStatusInfo } from "../utils/status";
import { formatApplicationReference, formatDate, formatPrice } from "../utils/format";
import { CalendarIcon, ImageIcon, MapPinIcon } from "./icons";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import { getImageUrl } from "../utils/image";
import { getRoomTypeLabel } from "../utils/accommodation";
import { formatDateOnly } from "../utils/lease";

// Statuses a student can still withdraw from (the backend checks this too)
const WITHDRAWABLE = ["Pending", "Under Review"];

// One application on the dashboard. Pending and under-review applications can
// be withdrawn; onWithdrawn(id) removes it from the list.
export default function ApplicationCard({ application, onWithdrawn }) {
  const status = getStatusInfo(application.status);
  const price = formatPrice(application.accommodation_price);
  const canWithdraw = Boolean(onWithdrawn) && WITHDRAWABLE.includes(application.status);

  const [isConfirming, setIsConfirming] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState("");

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    setError("");
    try {
      await withdrawApplication(application.id);
      onWithdrawn(application.id);
    } catch (withdrawError) {
      setError(getErrorMessage(withdrawError, "We couldn't withdraw this application. Please try again."));
      setIsWithdrawing(false);
    }
  };

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
              {application.room_type && <>{getRoomTypeLabel(application.room_type)} · </>}
              <strong>{price}</strong> / month
            </p>
          )}
          {application.move_in_date && application.lease_months && (
            <p className="application-card__meta">
              <CalendarIcon size={14} />
              Move in {formatDateOnly(application.move_in_date)} · {application.lease_months} months
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
          {application.status === "Rejected" && application.decision_reason && (
            <> {application.decision_reason}</>
          )}
        </p>
      )}

      {canWithdraw && (
        <footer className="application-card__footer">
          {isConfirming ? (
            <div className="withdraw-confirm" role="group" aria-label="Confirm withdrawal">
              <p className="withdraw-confirm__text">
                Withdraw your application for {application.accommodation_name}? This can't be undone.
              </p>
              <div className="withdraw-confirm__actions">
                <Button
                  variant="secondary"
                  className="btn--sm"
                  onClick={() => {
                    setIsConfirming(false);
                    setError("");
                  }}
                  disabled={isWithdrawing}
                >
                  Keep it
                </Button>
                <Button
                  className="btn--sm btn--danger"
                  onClick={handleWithdraw}
                  isLoading={isWithdrawing}
                  loadingText="Withdrawing…"
                >
                  Yes, withdraw
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" className="application-card__withdraw" onClick={() => setIsConfirming(true)}>
              Withdraw application
            </button>
          )}
          {error && (
            <p className="application-card__error" role="alert">
              {error}
            </p>
          )}
        </footer>
      )}
    </article>
  );
}
