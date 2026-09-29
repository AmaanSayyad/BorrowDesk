type TokenLogoProps = {
  src: string;
  symbol: string;
  size?: number;
  className?: string;
};

/** Transparent company logo - no white plate behind it. */
export function TokenLogo({
  src,
  symbol,
  size = 28,
  className = "",
}: TokenLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
      decoding="async"
    />
  );
}
