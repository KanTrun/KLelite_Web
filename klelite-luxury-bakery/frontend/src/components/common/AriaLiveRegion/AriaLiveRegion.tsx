import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A component to announce page changes and other status updates to screen readers.
 * It uses an aria-live region that is visually hidden.
 */
export const AriaLiveRegion: React.FC = () => {
  const [message, setMessage] = useState('');
  const location = useLocation();

  // Announce page title/path changes
  useEffect(() => {
    // In a real app, you might map paths to human-readable names
    // For now, we'll just announce "Navigated to [Path]"
    const pathName = location.pathname === '/' ? 'Home' : location.pathname.replace('/', '');
    const formattedName = pathName.charAt(0).toUpperCase() + pathName.slice(1);

    setMessage(`Navigated to ${formattedName}`);

    // Clear message after announcement to allow re-announcement if needed
    // though for aria-live, replacing text usually triggers it
    const timer = setTimeout(() => setMessage(''), 1000);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {message}
    </div>
  );
};
