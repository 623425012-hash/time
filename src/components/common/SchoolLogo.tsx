import React, { useState, useEffect } from 'react';
import { School } from 'lucide-react';

interface SchoolLogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  fallbackIconClassName?: string;
  schoolName?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  src,
  alt = 'School Logo',
  className = 'w-10 h-10 object-contain rounded-xl',
  fallbackClassName = 'w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xs shrink-0',
  fallbackIconClassName = 'w-5 h-5 text-white',
  schoolName,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className={fallbackClassName} title={schoolName || alt}>
        <School className={fallbackIconClassName} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => {
        setHasError(true);
      }}
      className={className}
    />
  );
};
