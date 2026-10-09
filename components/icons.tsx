type IconProps = { size?: number };

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ScaleIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
      <path d="M12 3v18" />
      <path d="M7 7h10" />
      <path d="M12 7 5 7l-3 7a4 4 0 0 0 8 0Z" />
      <path d="M12 7l7 0 3 7a4 4 0 0 1-8 0Z" />
      <path d="M8 21h8" />
    </svg>
  );
}

export function CalculatorIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="11" x2="8" y2="11" />
      <line x1="12" y1="11" x2="12" y2="11" />
      <line x1="16" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="8" y2="15" />
      <line x1="12" y1="15" x2="12" y2="15" />
      <line x1="16" y1="15" x2="16" y2="18" />
      <line x1="8" y1="18" x2="8" y2="18" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  );
}

export function ReceiptIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
      <path d="M6 2h12v18l-3-2-3 2-3-2-3 2V2Z" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="12" y2="15" />
    </svg>
  );
}

export function ListChecksIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
      <path d="m3 7 2 2 3-3" />
      <path d="m3 15 2 2 3-3" />
      <line x1="11" y1="7" x2="21" y2="7" />
      <line x1="11" y1="15" x2="21" y2="15" />
    </svg>
  );
}

export function BookOpenIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
      <path d="M2 5c2-1.2 5-1.5 7 0v13c-2-1.5-5-1.2-7 0Z" />
      <path d="M22 5c-2-1.2-5-1.5-7 0v13c2-1.5 5-1.2 7 0Z" />
    </svg>
  );
}

export function ShieldIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...common}>
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export const ICONS = {
  scale: ScaleIcon,
  calculator: CalculatorIcon,
  receipt: ReceiptIcon,
  checklist: ListChecksIcon,
  book: BookOpenIcon,
  shield: ShieldIcon,
};

export type IconName = keyof typeof ICONS;
