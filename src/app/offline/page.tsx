"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <div className="mb-6 text-6xl" role="img" aria-label="Wi-Fi off">
          &#x1F4F6;
        </div>
        <h1 className="mb-3 text-2xl font-bold">You are offline</h1>
        <p className="mb-6 text-muted-foreground">
          Please check your internet connection and try again. Your study materials and
          courses will be available once you reconnect.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
