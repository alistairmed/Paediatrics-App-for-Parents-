import React from 'react';

/**
 * Shown instead of a premium AI feature while premium is switched off
 * (PREMIUM_ENABLED). There are no payments yet.
 */
export const PremiumComingSoon: React.FC<{ feature: string; compact?: boolean }> = ({ feature, compact }) => (
  <div role="note" aria-label={`${feature}: Premium, coming soon`}
    className={`bg-terracotta-50 border-2 border-dashed border-terracotta-200 rounded-2xl ${compact ? 'px-4 py-3' : 'px-5 py-4'} space-y-1`}>
    <p className="text-sm font-black text-terracotta-900">
      <span aria-hidden="true">⭐ </span>Premium (coming soon)
    </p>
    {!compact && (
      <p className="text-sm font-medium text-terracotta-900">
        {feature} will be a premium feature. It isn't available yet, and nothing is sent.
      </p>
    )}
  </div>
);
