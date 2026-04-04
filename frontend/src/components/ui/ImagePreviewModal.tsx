import { useCallback, useEffect, useRef, useState } from "react";

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const zoomSpeed = 0.1;

    setScale((previous) => {
      if (event.deltaY < 0) {
        return Math.min(previous + zoomSpeed, 3);
      }

      return Math.max(previous - zoomSpeed, 1);
    });
  }, []);

  const handleClickZoom = useCallback(() => {
    setScale((previous) => (previous === 1 ? 2 : 1));
  }, []);

  useEffect(() => {
    if (!imageUrl) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab") {
        // Focus trap básico: mantener foco dentro del modal.
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imageUrl, onClose]);

  useEffect(() => {
    if (!imageUrl) {
      setScale(1);
    }
  }, [imageUrl]);

  if (!imageUrl) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/80 p-4 transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa de imagen"
      onClick={onClose}
      onWheel={handleWheel}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        aria-label="Cerrar imagen"
      >
        X
      </button>

      <img
        src={imageUrl}
        alt="Vista ampliada"
        className="max-h-full max-w-full origin-center object-contain transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${scale})`,
          transition: "transform 0.2s ease",
          cursor: scale > 1 ? "zoom-out" : "zoom-in",
        }}
        onClick={(event) => {
          event.stopPropagation();
          handleClickZoom();
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          handleClickZoom();
        }}
      />
    </div>
  );
}

export default ImagePreviewModal;
