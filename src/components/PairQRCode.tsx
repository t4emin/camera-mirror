"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import styles from "./PairQRCode.module.css";

interface PairQRCodeProps {
  roomId: string;
}

export function PairQRCode({ roomId }: PairQRCodeProps) {
  const [qrUrl, setQrUrl] = useState<string>();
  const [monitorUrl, setMonitorUrl] = useState<string>();

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

  return (
    <section className={styles.panel}>
      <div>
        <p className={styles.label}>Room</p>
        <p className={styles.roomId}>{roomId}</p>
      </div>

      {qrUrl ? (
        <img className={styles.qr} src={qrUrl} alt={`QR code for room ${roomId}`} />
      ) : (
        <div className={styles.qrPlaceholder} />
      )}

      {monitorUrl ? <p className={styles.url}>{monitorUrl}</p> : null}
    </section>
  );
}
