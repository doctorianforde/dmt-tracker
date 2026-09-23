import type { Metadata } from 'next';
import Script from 'next/script';
import {
  Plus_Jakarta_Sans,
  Bricolage_Grotesque,
  Fraunces,
  Fredoka,
  Bebas_Neue,
  Space_Grotesk,
  Pixelify_Sans,
} from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { THEME_STORAGE_KEY } from '@/lib/themes';

// Body font plus one display font per theme (wired up in globals.css). Only
// the fonts a theme actually uses get downloaded by the browser.
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-fraunces', display: 'swap', preload: false });
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka', display: 'swap', preload: false });
const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-bebas', display: 'swap', preload: false });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap', preload: false });
const pixel = Pixelify_Sans({ subsets: ['latin'], variable: '--font-pixel', display: 'swap', preload: false });

const fontVariables = [jakarta, bricolage, fraunces, fredoka, bebas, space, pixel]
  .map((f) => f.variable)
  .join(' ');

export const metadata: Metadata = {
  title: 'VIS — Case Report Tracker',
  description: 'DM Emergency Medicine case report portal',
};

// Applies the last-used theme before first paint so there's no flash of the
// default theme. ThemeProvider takes over once React loads.
const themeBootScript = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={fontVariables} suppressHydrationWarning>
      <body>
        <Script id="theme-boot" strategy="beforeInteractive">{themeBootScript}</Script>
        <div className="app-canvas" aria-hidden />
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
