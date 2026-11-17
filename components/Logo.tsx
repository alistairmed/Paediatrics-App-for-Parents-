import React from 'react';

/** The Paeds Pouch mark: a kangaroo with a joey in its pouch. Decorative; the name is always shown beside it. */
export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className={className}>
    <ellipse cx="57" cy="13" rx="4" ry="10" fill="#C2603C" transform="rotate(-12 57 13)" />
    <ellipse cx="66" cy="12" rx="4" ry="10" fill="#C2603C" transform="rotate(10 66 12)" />
    <ellipse cx="63" cy="28" rx="13" ry="10" fill="#C2603C" />
    <ellipse cx="74" cy="31" rx="9" ry="6" fill="#C2603C" />
    <ellipse cx="50" cy="60" rx="23" ry="28" fill="#C2603C" />
    <path d="M30 78 Q16 90 6 92" stroke="#C2603C" strokeWidth="7" strokeLinecap="round" fill="none" />
    <ellipse cx="58" cy="90" rx="17" ry="5" fill="#C2603C" />
    <path d="M44 62 Q57 82 70 62 Z" fill="#FBF6EE" />
    <circle cx="57" cy="60" r="7" fill="#8E3F22" />
    <ellipse cx="53" cy="53" rx="2" ry="4" fill="#8E3F22" />
    <ellipse cx="61" cy="53" rx="2" ry="4" fill="#8E3F22" />
  </svg>
);
