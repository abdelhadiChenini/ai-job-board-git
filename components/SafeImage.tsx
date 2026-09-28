import Image from "next/image";

type SafeImageProps = {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
};

function isInlinable(src: string) {
  return src.startsWith("data:") || src.startsWith("blob:");
}

export default function SafeImage({
  src,
  alt,
  width = 64,
  height = 64,
  sizes,
  className,
  priority,
}: SafeImageProps) {
  if (!src) return null;

  // Legacy records still store base64 data URIs. The image optimizer cannot
  // fetch or resize those, so render them directly instead of going through
  // next/image, which rejects non-http(s) sources.
  if (isInlinable(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      priority={priority}
    />
  );
}
