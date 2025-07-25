export function sendDemoSMS(to: string, message: string): boolean {
  // For MVP/demo, just log or show an alert
  alert(`DEMO: Message sent to ${to}: ${message}`);
  return true;
}
