import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="py-6 text-center text-xs text-on-canvas-muted">
      <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
      {' · '}
      <Link href="/tos" className="hover:underline">Terms of Service</Link>
    </footer>
  );
}
