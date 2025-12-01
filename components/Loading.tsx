import React from 'react';

interface LoadingProps {
  message: string;
}

export const Loading: React.FC<LoadingProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-6 animate-fade-in">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl">✨</span>
      </div>
    </div>
    <p className="text-lg font-medium text-slate-600 animate-pulse">{message}</p>
  </div>
);