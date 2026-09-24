import Link from 'next/link';
import { BrandMark } from '@/components/Navbar';

export const LEGAL_CONTACT_EMAIL = 'VISTrackerTT@proton.me';
export const LEGAL_EFFECTIVE_DATE = '24 September 2026';

// Shared shell for the public Privacy Policy and Terms of Service pages.
export default function LegalPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen p-5 sm:p-10">
      <div className="max-w-3xl mx-auto">
        <Link href="/" aria-label="VIS home">
          <BrandMark className="text-on-canvas mb-8" />
        </Link>
        <article className="card p-7 sm:p-10">
          <p className="eyebrow text-muted">{eyebrow}</p>
          <h1 className="display text-4xl text-ink mt-2">{title}</h1>
          <p className="text-sm text-muted mt-2">Effective {LEGAL_EFFECTIVE_DATE}</p>
          <div className="legal mt-8 text-ink text-[15px] leading-relaxed">{children}</div>
          <div className="mt-10 pt-6 border-t border-line flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/" className="text-accent font-semibold hover:underline">← Back to VIS</Link>
            <Link href="/privacy" className="text-accent font-semibold hover:underline">Privacy Policy</Link>
            <Link href="/tos" className="text-accent font-semibold hover:underline">Terms of Service</Link>
          </div>
        </article>
      </div>
    </div>
  );
}
