'use client';
// Last-resort boundary for an error in the root layout itself: it replaces the whole document, so it brings its own
// <html>/<body> and stylesheet, then shows the same card as error.tsx (reload, call, LINE).
import RouteError from './error';
import './globals.css';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="th">
      <body>
        <title>โหลดหน้าไม่สำเร็จ · SBP AirCare</title>
        <main id="main">
          <RouteError error={error} reset={reset} />
        </main>
      </body>
    </html>
  );
}
