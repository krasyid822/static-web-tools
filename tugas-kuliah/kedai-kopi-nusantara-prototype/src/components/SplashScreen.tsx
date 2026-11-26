import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [hiding, setHiding] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => setHiding(true), 1000);
    const doneTimer = setTimeout(() => setDone(true), 1300);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (done) return null;

  return (
    <div className={`splash ${hiding ? "splash--hide" : ""}`} aria-labelledby="splash-title">
      <div className="splash__logo" aria-hidden="true">
        KN
      </div>
      <h1 className="splash__title" id="splash-title">
        Kedai Kopi Nusantara
      </h1>
      <div className="splash__progress" aria-hidden="true" />
      <p className="splash__message" role="status">
        Menyiapkan halaman...
      </p>
    </div>
  );
}
