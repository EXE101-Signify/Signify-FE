interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

const statusClasses = {
  online: 'bg-emerald-500',
  offline: 'bg-gray-400',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
};

export function Avatar({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  status,
  className = '',
}: AvatarProps) {
  const getInitials = (n?: string) => {
    if (!n) return '?';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`rounded-full border border-brand-border-high object-cover ${sizeClasses[size]}`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`flex items-center justify-center rounded-full bg-brand-primary-light font-bold text-brand-primary ${sizeClasses[size]}`}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${statusClasses[status]}`}
          aria-label={`Trạng thái: ${status}`}
        />
      )}
    </div>
  );
}

export default Avatar;
