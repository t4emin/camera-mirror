"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import styles from "./monitor-join.module.css";

export function MonitorJoinClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = code.replace(/\D/g, "").slice(0, 6);

    if (!normalizedCode) {
      return;
    }

    router.push(`/monitor/${normalizedCode}`);
  };

  const formattedCode = code.padEnd(6, " ").slice(0, 6).split("");

  return (
    <main className={styles.page}>
      <form className={styles.panel} onSubmit={submit}>
        <header className={styles.header}>
          <p className={styles.kicker}>Phone B</p>
          <h1>Monitor</h1>
        </header>

        <label className={styles.field}>
          <span>Pair Code</span>
          <div className={styles.codeInput}>
            <div
              className={styles.codePreview}
              aria-hidden="true"
              onClick={() => inputRef.current?.focus()}
            >
              {formattedCode.map((character, index) => (
                <span key={index}>{character.trim() || " "}</span>
              ))}
            </div>
            <input
              aria-label="Pair code"
              ref={inputRef}
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter code"
            />
          </div>
        </label>

        <button disabled={code.length !== 6} type="submit">
          Join
        </button>
      </form>
    </main>
  );
}
