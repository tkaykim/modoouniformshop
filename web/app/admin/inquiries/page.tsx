export default function InquiriesRedirect() {
  if (typeof window !== 'undefined') {
    window.location.href = '/admin';
  }
  return null;
}



