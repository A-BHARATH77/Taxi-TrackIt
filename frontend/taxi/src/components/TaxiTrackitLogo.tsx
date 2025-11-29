interface TaxiTrackitLogoProps {
  className?: string;
  size?: number;
}

export function TaxiTrackitLogo({ className = "", size = 40 }: TaxiTrackitLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer zone circle - represents geographic boundary */}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="8 4"
        opacity="0.6"
      />
      
      {/* Inner zone circle */}
      <circle
        cx="50"
        cy="50"
        r="32"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="6 3"
        opacity="0.4"
      />
      
      {/* GPS tracking marker/pin in center */}
      <g transform="translate(50, 30)">
        <path
          d="M0 0 C-6 0 -10 4 -10 10 C-10 18 0 28 0 28 C0 28 10 18 10 10 C10 4 6 0 0 0Z"
          fill="currentColor"
        />
        <circle cx="0" cy="10" r="4" fill="white" />
      </g>
      
      {/* Taxi/Vehicle icon */}
      <g transform="translate(50, 62)">
        {/* Car body */}
        <rect x="-10" y="-4" width="20" height="8" rx="1.5" fill="currentColor" />
        {/* Car windows */}
        <rect x="-7" y="-3" width="5" height="3" rx="0.5" fill="white" opacity="0.9" />
        <rect x="2" y="-3" width="5" height="3" rx="0.5" fill="white" opacity="0.9" />
        {/* Wheels */}
        <circle cx="-6" cy="5" r="2.5" fill="currentColor" />
        <circle cx="6" cy="5" r="2.5" fill="currentColor" />
        <circle cx="-6" cy="5" r="1" fill="white" />
        <circle cx="6" cy="5" r="1" fill="white" />
      </g>
      
      {/* GPS signal waves */}
      <g transform="translate(50, 50)">
        <path
          d="M-25 -25 Q-20 -30, -15 -25"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.3"
        />
        <path
          d="M25 -25 Q20 -30, 15 -25"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.3"
        />
        <path
          d="M-20 -20 Q-17 -23, -14 -20"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M20 -20 Q17 -23, 14 -20"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
      </g>
      
      {/* Zone crossing indicator dots */}
      <circle cx="50" cy="18" r="2" fill="currentColor" opacity="0.8">
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="82" cy="50" r="2" fill="currentColor" opacity="0.8">
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="2s"
          begin="0.5s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="18" cy="50" r="2" fill="currentColor" opacity="0.8">
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="2s"
          begin="1s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
