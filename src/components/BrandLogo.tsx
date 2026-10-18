import Image from "next/image";

export function BrandLogo({
  size = 40,
  showName = true,
  className = "",
}: {
  size?: number;
  showName?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/usahabit-logo.png"
        alt=""
        width={size}
        height={size}
        priority
        className="rounded-xl object-contain"
      />
      {showName && (
        <span className="font-brand text-xl font-semibold tracking-tight text-primary">
          UsahaBit
        </span>
      )}
    </span>
  );
}
