export function getQrBaseUrl(): string {
  return (
    import.meta.env.VITE_QR_BASE_URL?.replace(/\/$/, "") ||
    import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    window.location.origin
  );
}
