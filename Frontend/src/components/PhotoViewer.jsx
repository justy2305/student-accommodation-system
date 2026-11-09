import { useEffect, useRef } from "react";
import { describePhoto } from "../utils/accommodation";
import { ArrowRightIcon } from "./icons";
import { getImageUrl } from "../utils/image";

// Full-screen photo viewer. Uses the native <dialog> element, which handles
// Escape, focus and the dark backdrop. ← → keys move between photos.
export default function PhotoViewer({ title, images, index, onIndexChange, onClose }) {
  const dialogRef = useRef(null);
  const isOpen = index !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const count = images.length;
  const go = (step) => onIndexChange((index + step + count) % count);

  const handleKeyDown = (event) => {
    if (event.key === "ArrowRight") go(1);
    if (event.key === "ArrowLeft") go(-1);
  };

  const current = isOpen ? images[index] : null;

  return (
    <dialog
      ref={dialogRef}
      className="photo-viewer"
      aria-label={`${title} photos`}
      onClose={onClose}
      onKeyDown={handleKeyDown}
    >
      {current && (
        <>
          <div className="photo-viewer__bar">
            <p className="photo-viewer__counter">
              {index + 1} / {count} · {describePhoto(current.image_url)}
            </p>
            <button type="button" className="photo-viewer__close" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="photo-viewer__stage">
            <button
              type="button"
              className="photo-viewer__nav photo-viewer__nav--prev"
              onClick={() => go(-1)}
              aria-label="Previous photo"
            >
              <ArrowRightIcon size={22} />
            </button>
            <img
              className="photo-viewer__image"
              src={getImageUrl(current.image_url, 1600)}
              alt={`${title}: ${describePhoto(current.image_url)}`}
            />
            <button
              type="button"
              className="photo-viewer__nav photo-viewer__nav--next"
              onClick={() => go(1)}
              aria-label="Next photo"
            >
              <ArrowRightIcon size={22} />
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
