interface AvatarProps {
  name?: string;
  photoURL?: string;
  size?: number;
  className?: string;
}

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.replace(/^(dr\.?|prof\.?)\s+/i, '').trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

export default function Avatar({ name, photoURL, size = 36, className = '' }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) };
  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small inline data URL
      <img
        src={photoURL}
        alt={name ? `${name}’s photo` : 'Profile photo'}
        style={style}
        className={`rounded-full object-cover ring-2 ring-surface flex-shrink-0 ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={style}
      className={`rounded-full bg-accent-soft text-accent font-bold flex items-center justify-center flex-shrink-0 ring-2 ring-surface ${className}`}
    >
      {initials(name)}
    </span>
  );
}
