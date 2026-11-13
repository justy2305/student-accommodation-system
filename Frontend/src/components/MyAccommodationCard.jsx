import { useState } from "react";
import { getErrorMessage } from "../services/api";
import { signLease } from "../services/applicationService";
import { formatDate, formatPrice } from "../utils/format";
import { formatDateOnly, getLeaseProgress } from "../utils/lease";
import { CalendarIcon, CheckCircleIcon, ClockIcon, FileTextIcon, ImageIcon, MapPinIcon } from "./icons";
import Alert from "./ui/Alert";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import { getImageUrl } from "../utils/image";

// The student's current home (their approved application): lease period,
// time left, and whether the lease agreement is signed. They can sign it here.
export default function MyAccommodationCard({ application, now, onSigned }) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState("");

  const price = formatPrice(application.accommodation_price);
  const hasLeaseDates = Boolean(application.lease_start && application.lease_end);
  const progress = hasLeaseDates ? getLeaseProgress(application.lease_start, application.lease_end, now) : null;
  const isSigned = Boolean(application.lease_signed_at);

  const handleSign = async () => {
    setError("");
    setIsSigning(true);
    try {
      const updated = await signLease(application.id);
      onSigned(updated);
      setIsReviewing(false);
    } catch (signError) {
      setError(getErrorMessage(signError, "We couldn't sign your lease. Please try again."));
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <section className="home-card" aria-labelledby="home-card-title">
      <div className="home-card__top">
        <h2 id="home-card-title" className="home-card__heading">
          My accommodation
        </h2>
        <Badge variant="success">Approved</Badge>
      </div>

      <div className="home-card__place">
        {application.accommodation_image ? (
          <img className="home-card__image" src={getImageUrl(application.accommodation_image, 800)} alt="" />
        ) : (
          <div className="home-card__image home-card__image--empty" aria-hidden="true">
            <ImageIcon size={28} />
          </div>
        )}
        <div className="home-card__details">
          <p className="home-card__name">{application.accommodation_name}</p>
          {application.accommodation_location && (
            <p className="home-card__meta">
              <MapPinIcon size={14} />
              {application.accommodation_location}
            </p>
          )}
          {price && (
            <p className="home-card__price">
              <strong>{price}</strong> / month
            </p>
          )}
        </div>
      </div>

      {!hasLeaseDates && (
        <p className="home-card__pending">
          <ClockIcon size={18} />
          Your lease dates will appear here once they are set.
        </p>
      )}

      {hasLeaseDates && (
        <>
          <dl className="lease-facts">
            <div className="lease-fact">
              <dt>
                <CalendarIcon size={14} /> Lease start
              </dt>
              <dd>{formatDateOnly(application.lease_start)}</dd>
            </div>
            <div className="lease-fact">
              <dt>
                <CalendarIcon size={14} /> Lease end
              </dt>
              <dd>{formatDateOnly(application.lease_end)}</dd>
            </div>
            <div className="lease-fact lease-fact--highlight">
              <dt>
                <ClockIcon size={14} /> Time left
              </dt>
              <dd>{progress?.label}</dd>
            </div>
          </dl>

          {progress && (
            <div className="lease-progress">
              <div
                className="lease-progress__track"
                role="progressbar"
                aria-label="Lease progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress.percent}
                aria-valuetext={`${progress.label}. ${progress.detail}`}
              >
                <span
                  className={`lease-progress__bar lease-progress__bar--${progress.phase}`}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="lease-progress__detail">{progress.detail}</p>
            </div>
          )}

          <div className={`agreement agreement--${isSigned ? "signed" : "unsigned"}`}>
            <div className="agreement__status">
              {isSigned ? <CheckCircleIcon size={20} /> : <FileTextIcon size={20} />}
              <div>
                <p className="agreement__title">
                  Lease agreement: {isSigned ? "Signed" : "Not signed yet"}
                </p>
                <p className="agreement__text">
                  {isSigned
                    ? `You signed on ${formatDate(application.lease_signed_at)}.`
                    : "Review and sign your lease to confirm your place."}
                </p>
              </div>
            </div>

            {!isSigned && !isReviewing && (
              <Button className="btn--sm" onClick={() => setIsReviewing(true)}>
                Review &amp; sign
              </Button>
            )}
          </div>

          {!isSigned && isReviewing && (
            <div className="agreement-review">
              <p className="agreement-review__summary">
                By signing, you agree to rent a room at <strong>{application.accommodation_name}</strong> from{" "}
                <strong>{formatDateOnly(application.lease_start)}</strong> to{" "}
                <strong>{formatDateOnly(application.lease_end)}</strong>
                {price && (
                  <>
                    {" "}
                    for <strong>{price}</strong> per month
                  </>
                )}
                .
              </p>

              <label className="agreement-review__check">
                <input
                  type="checkbox"
                  checked={hasAgreed}
                  onChange={(event) => setHasAgreed(event.target.checked)}
                />
                I have read and agree to the lease terms.
              </label>

              {error && <Alert variant="error">{error}</Alert>}

              <div className="agreement-review__actions">
                <Button
                  onClick={handleSign}
                  disabled={!hasAgreed}
                  isLoading={isSigning}
                  loadingText="Signing…"
                  className="btn--sm"
                >
                  Sign lease agreement
                </Button>
                <Button
                  variant="secondary"
                  className="btn--sm"
                  onClick={() => {
                    setIsReviewing(false);
                    setHasAgreed(false);
                    setError("");
                  }}
                  disabled={isSigning}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
