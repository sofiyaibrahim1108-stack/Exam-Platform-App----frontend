import React from 'react';

const Avatar = ({ photoUrl, name, size = 8, ring = true, role = 'Student' }) => {
  const initials = (name || role.charAt(0)).charAt(0).toUpperCase();
  const bgStyle = role === 'Student' 
    ? 'linear-gradient(135deg,#7A001F,#A11D42)' 
    : 'linear-gradient(135deg,#8C1D40,#B83A5F)';
  
  const sizeClasses = {
    6: 'w-6 h-6',
    7: 'w-7 h-7',
    8: 'w-8 h-8',
    10: 'w-10 h-10',
    12: 'w-12 h-12',
    16: 'w-16 h-16',
    20: 'w-20 h-20',
    24: 'w-24 h-24',
    32: 'w-32 h-32'
  };

  const selectedSizeClass = sizeClasses[size] || `w-${size} h-${size}`;

  return (
    <div
      className={`${selectedSizeClass} rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-xs
        ${ring ? 'ring-2 ring-[#8C1D40]/20' : ''}`}
      style={{ background: bgStyle }}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: size <= 7 ? '10px' : '13px' }}>{initials}</span>
      )}
    </div>
  );
};

export default Avatar;
