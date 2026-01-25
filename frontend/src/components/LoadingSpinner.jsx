const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-[6px]'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-[#22333b] border-t-[#c6ac8f] rounded-full shadow-[0_0_20px_rgba(198,172,143,0.2)]`}
        style={{
          animation: 'spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite'
        }}
      ></div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
