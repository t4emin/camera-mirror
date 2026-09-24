import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.kicker}>Remote Camera Monitor</p>
        <h1>Camera Mirror MVP</h1>
        <p className={styles.copy}>
          Start one phone as the camera, then join from another phone with the
          pair code or QR link.
        </p>
        <div className={styles.actions}>
          <Link className={styles.link} href="/camera">
            Open Camera
          </Link>
          <Link className={styles.secondaryLink} href="/monitor">
            Join Monitor
          </Link>
        </div>
      </section>
    </main>
  );
}
