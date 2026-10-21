import React from 'react';

// Authentic Solar Icons from https://solar-icons.dev/ (1.5px Linear style, 24x24 grid)

export const SolarCalculator = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M6 2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z" />
      <path d="M7 7h10M7 11h2m3 0h2m3 0h2M7 15h2m3 0h2m3 0h2M7 19h2m3 0h2m3 0h2" />
    </g>
  </svg>
);

export const SolarCardSearch = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <g stroke={color} strokeLinecap="round" strokeWidth="1.5">
      <path d="M2 9h20M2 13v-3c0-2.828 0-4.243.879-5.121C3.757 4 5.172 4 8 4h8c2.828 0 4.243 0 5.121.879C22 5.757 22 7.172 22 10v4c0 2.828 0 4.243-.879 5.121C20.243 20 18.828 20 16 20H8c-2.828 0-4.243 0-5.121-.879C2 18.243 2 16.828 2 14v-1Z" />
      <path d="M6 16h3" />
      <path d="m18 19l2.5 2.5M19 16.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SolarBagPlus = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M3.794 12.029c.537-2.686.806-4.029 1.693-4.894C5.651 6.975 5.83 6.83 6.018 6.7C7.234 5.868 8.948 5.75 12 5.75c3.052 0 4.766.118 5.982.95c.189.13.367.276.53.436.888.865 1.156 2.008 1.694 4.894.635 3.175.952 4.762.095 5.866-.857 1.104-2.48 1.104-5.725 1.104H9.424c-3.245 0-4.868 0-5.725-1.104-.775-.991-.49-2.446.095-5.867Z" />
      <path d="M8 7V5.5C8 4.12 9.12 3 10.5 3h3C14.88 3 16 4.12 16 5.5V7" />
      <path d="M12 11v4m-2-2h4" />
    </g>
  </svg>
);

export const SolarChatRoundDots = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <g stroke={color} strokeLinecap="round" strokeWidth="1.5">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.6.376 3.112 1.043 4.453.178.356.237.763.134 1.148l-.595 2.226c-.259.966.625 1.85 1.591 1.591l2.226-.595c.385-.103.792-.044 1.148.134A9.958 9.958 0 0 0 12 22Z" />
      <path strokeLinejoin="round" d="M8 12h.01m3.99 0h.01m3.99 0h.01" />
    </g>
  </svg>
);

export const SolarCalendarDate = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <g stroke={color} strokeLinecap="round" strokeWidth="1.5">
      <path d="M2 12c0-3.771 0-5.657 1.172-6.828C4.343 4 6.229 4 10 4h4c3.771 0 5.657 0 6.828 1.172C22 6.343 22 8.229 22 12v2c0 3.771 0 5.657-1.172 6.828C19.657 22 17.771 22 14 22h-4c-3.771 0-5.657 0-6.828-1.172C2 19.657 2 17.771 2 14v-2Z" />
      <path d="M7 2v4m10-4v4M2 9.5h20" />
      <path d="M8 14h.01m3.99 0h.01m3.99 0h.01M8 18h.01m3.99 0h.01m3.99 0h.01" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SolarShieldCheck = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M12 2c2.5 2 5.5 3 8 3v7.5c0 5-3.5 8.5-8 9.5-4.5-1-8-4.5-8-9.5V5c2.5 0 5.5-1 8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </g>
  </svg>
);

export const SolarTrendingUp = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m21 7-7.5 7.5-4-4L2 18m19-11h-6m6 0v6"
    />
  </svg>
);

export const SolarSend = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <path
      d="M11.5 12H5.42M5.24 12.25L4.3 15.27c-.7 2.25-1.05 3.38-.64 3.96.41.59 1.52.37 3.73-.06L17.89 17.14c2.2-.42 3.3-.64 3.66-1.28.36-.64-.22-1.58-1.4-3.45L20 12.18c-.1-.15-.14-.23-.16-.31a.8.8 0 0 1 0-.21c.02-.08.06-.16.16-.31l.15-.24c1.17-1.87 1.76-2.81 1.4-3.45-.36-.64-1.46-.85-3.66-1.28L7.39 4.36c-2.21-.43-3.32-.64-3.73-.06-.41.59-.06 1.71.64 3.96l.95 3.02c.12.39.18.58.18.79s-.06.4-.18.79"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SolarTrashBinTrash = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M20.5 6h-17m14.879 3.5-1.042 10.417A2 2 0 0 1 15.344 22H8.656a2 2 0 0 1-1.993-2.083L5.621 9.5M9.5 16.5v-4m5 4v-4M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
    />
  </svg>
);

export const SolarDangerCircle = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <g stroke={color} strokeLinecap="round" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7v6m0 4h.01" />
    </g>
  </svg>
);

export const SolarQuestionCircle = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <g stroke={color} strokeLinecap="round" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M10 9a2 2 0 1 1 3.5 1.4c-.6.6-1.5 1.1-1.5 2.6m0 4h.01" />
    </g>
  </svg>
);

export const SolarLogout3 = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12 20a8 8 0 1 0 0-16m3 8H3m0 0 3-3m-3 3 3 3"
    />
  </svg>
);

export const SolarAddCircle = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
    </g>
  </svg>
);

export const SolarMeal = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M5 3v6a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V3M8 3v18" />
      <path d="M16 3v18m3-18v6a3 3 0 0 1-3 3h0" />
    </g>
  </svg>
);

export const SolarBus = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M4 16h16V6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v10Zm0 0v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3m10 0v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3M4 11h16" />
      <path d="M7 14h.01m9.99 0h.01" />
    </g>
  </svg>
);

export const SolarBookBookmark = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 18h14M14 2v8l3-2 3 2V2" />
    </g>
  </svg>
);

export const SolarBagSmile = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <g stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M3.794 12.029c.537-2.686.806-4.029 1.693-4.894C5.651 6.975 5.83 6.83 6.018 6.7C7.234 5.868 8.948 5.75 12 5.75c3.052 0 4.766.118 5.982.95c.189.13.367.276.53.436.888.865 1.156 2.008 1.694 4.894.635 3.175.952 4.762.095 5.866-.857 1.104-2.48 1.104-5.725 1.104H9.424c-3.245 0-4.868 0-5.725-1.104-.775-.991-.49-2.446.095-5.867Z" />
      <path d="M8 7V5.5C8 4.12 9.12 3 10.5 3h3C14.88 3 16 4.12 16 5.5V7" />
      <path d="M9 13.5a3 3 0 0 0 6 0" />
    </g>
  </svg>
);

export const SolarAltArrowDown = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m19 9-7 6-7-6"
    />
  </svg>
);

export const SolarAltArrowUp = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m19 15-7-6-7 6"
    />
  </svg>
);

export const SolarAltArrowLeft = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m15 19-7-7 7-7"
    />
  </svg>
);

export const SolarAltArrowRight = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...props}
  >
    <path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m9 5 7 7-7 7"
    />
  </svg>
);

export default {
  SolarCalculator,
  SolarCardSearch,
  SolarBagPlus,
  SolarChatRoundDots,
  SolarCalendarDate,
  SolarShieldCheck,
  SolarTrendingUp,
  SolarSend,
  SolarTrashBinTrash,
  SolarDangerCircle,
  SolarQuestionCircle,
  SolarLogout3,
  SolarAddCircle,
  SolarMeal,
  SolarBus,
  SolarBookBookmark,
  SolarBagSmile,
  SolarAltArrowDown,
  SolarAltArrowUp,
  SolarAltArrowLeft,
  SolarAltArrowRight,
};
