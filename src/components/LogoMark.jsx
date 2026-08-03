/**
 * OceanTools brand mark used in the navbar and hero.
 * Renders the shared logo.png asset from the public folder.
 */
export default function LogoMark({ size = 28, className = '', title = 'OceanTools logo' }) {
  return (
    <img
      src="/logo.png"
      width={size}
      height={size}
      alt={title}
      aria-label={title}
      className={`block object-contain ${className}`}
    />
  );
}
