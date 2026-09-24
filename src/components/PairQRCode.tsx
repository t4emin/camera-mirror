"use client";

import QRCode from "qrcode";
import {
  CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import styles from "./PairQRCode.module.css";

const MODAL_ANIMATION_MS = 520;

interface PairQRCodeProps {
  roomId: string;
  open: boolean;
  onClose: () => void;
  origin?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function PairQRCode({ origin, roomId, open, onClose }: PairQRCodeProps) {
  const [qrUrl, setQrUrl] = useState<string>();
  const [monitorUrl, setMonitorUrl] = useState<string>();
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(false);
  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 28, scaleX: 0.9, scaleY: 0.9 });
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const nextMonitorUrl = `${window.location.origin}/monitor/${roomId}`;
    setMonitorUrl(nextMonitorUrl);

    void QRCode.toDataURL(nextMonitorUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: {
        dark: "#07110f",
        light: "#f7fafc"
      }
    }).then(setQrUrl);
  }, [roomId]);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      setIsVisible(false);
      return;
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => {
      setIsMounted(false);
    }, MODAL_ANIMATION_MS);

    return () => window.clearTimeout(timeout);
  }, [open]);

  useLayoutEffect(() => {
    if (!isMounted || !open) {
      return;
    }

    let revealFrame = 0;
    let frame = 0;
    const reveal = () => {
      frame = requestAnimationFrame(() => {
        revealFrame = requestAnimationFrame(() => setIsVisible(true));
      });
    };
    const panel = panelRef.current;

    if (!panel || !origin) {
      setPanelOffset({ x: 0, y: 28, scaleX: 0.9, scaleY: 0.9 });
    } else {
      const panelRect = panel.getBoundingClientRect();
      const panelCenter = {
        x: panelRect.left + panelRect.width / 2,
        y: panelRect.top + panelRect.height / 2
      };

      setPanelOffset({
        x: origin.x - panelCenter.x,
        y: origin.y - panelCenter.y,
        scaleX: origin.width / panelRect.width,
        scaleY: origin.height / panelRect.height
      });

    }
    reveal();

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(revealFrame);
    };
  }, [isMounted, open, origin]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMounted, onClose]);

  useEffect(() => {
    if (!isMounted) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => previousFocus?.focus({ preventScroll: true });
  }, [isMounted]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`${styles.overlay} ${isVisible ? styles.overlayVisible : ""}`}
      role="presentation"
      onClick={onClose}
    >
      <section
        aria-modal="true"
        aria-label={`Pair with room ${roomId}`}
        tabIndex={-1}
        className={`${styles.panel} ${isVisible ? styles.panelVisible : ""}`}
        ref={panelRef}
        role="dialog"
        style={
          {
            "--modal-origin-x": `${panelOffset.x}px`,
            "--modal-origin-y": `${panelOffset.y}px`,
            "--modal-scale-x": panelOffset.scaleX,
            "--modal-scale-y": panelOffset.scaleY,
            "--modal-radius-x": `${22 / panelOffset.scaleX}px`,
            "--modal-radius-y": `${22 / panelOffset.scaleY}px`
          } as CSSProperties
        }
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            event.preventDefault();
            panelRef.current?.querySelector("button")?.focus();
          }
        }}
      >
        <div aria-hidden="true" className={styles.surface} />
        <div className={styles.content}>
        <button className={styles.closeButton} onClick={onClose} type="button">
          Close
        </button>

        <div>
          <p className={styles.label}>Room</p>
          <p className={styles.roomId}>{roomId}</p>
        </div>

        {qrUrl ? (
          <img
            className={styles.qr}
            src={qrUrl}
            alt={`QR code for room ${roomId}`}
          />
        ) : (
          <div className={styles.qrPlaceholder} />
        )}

        {monitorUrl ? <p className={styles.url}>{monitorUrl}</p> : null}
        </div>
      </section>
    </div>
  );
}
