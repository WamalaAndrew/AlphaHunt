import React from 'react';

export const Spinner = ({ className = "" }: { className?: string }) => (
  <div className={`w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin ${className}`}></div>
);
