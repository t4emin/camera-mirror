"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "./monitor-join.module.css";

export function MonitorJoinClient() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      return;
    }

    router.push(`/monitor/${normalizedCode}`);
  };

  return (
    <main className={styles.page}>
      <form className={styles.panel} onSubmit={submit}>
        <p className={styles.kicker}>Phone B</p>
        <h1>Join Monitor</h1>
        <label>
          Pair Code
          <input
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="482913"
          />
        </label>
        <button type="submit">Join</button>
      </form>
    </main>
  );
}
