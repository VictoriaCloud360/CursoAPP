import React from 'react';

export const MentorAvatar = () => (
  <div className="relative">
    <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg border-4 border-white">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.221 69.14 69.14 0 00-2.923.295m-18.259 3.018a2.25 2.25 0 00-.65 4.144c.545.247 1.134.464 1.765.655m17.5 0a2.25 2.25 0 001.115-4.144c-.545-.247-1.134-.464-1.765-.655m-2.678 10.02a2.25 2.25 0 01-2.07 1.83 23.328 23.328 0 01-4.75 0 2.25 2.25 0 01-2.07-1.83m6.82-10.02a2.25 2.25 0 012.25-2.25h.008c1.1 0 1.96.8 2.14 1.88a11.96 11.96 0 00-4.398 0c.18-1.08 1.04-1.88 2.14-1.88h.008z" />
      </svg>
    </div>
    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
  </div>
);