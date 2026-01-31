import React from 'react';

const OrientationLock: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex flex-col justify-center items-center text-center p-8 landscape:hidden">
      {/* Animated phone icon */}
      <div className="w-20 h-36 border-4 border-gray-500 rounded-2xl p-2 flex items-center justify-center animate-rotate-device mb-8">
        <div className="w-full h-2/3 bg-gray-600 rounded-lg"></div>
      </div>
      <h2 className="text-3xl font-bold text-white mb-3">Gire seu dispositivo</h2>
      <p className="text-lg text-gray-300">Para a melhor experiência, use o app no modo paisagem.</p>
    </div>
  );
};

export default OrientationLock;
