"use client";

/** Last-resort error boundary (errors in the root layout). Uses inline styles: globals may not have loaded. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          background: "#f6f3ef",
          color: "#1b2632",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#5f6874", fontSize: 14 }}>
            The application failed to load. Please try again.
            {error.digest ? ` Reference: ${error.digest}` : ""}
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#2f4156",
              color: "#ffffff",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
