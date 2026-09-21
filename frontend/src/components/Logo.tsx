import Image from "next/image";
import Link from "next/link";

// public/Cheating.me.png is the Cheating.me logo (brain + book + wordmark) with a
// transparent background, cropped to its content. The wordmark is part of the
// image, so it replaces the old graduation-cap icon + text lockup entirely —
// don't put text next to it.
const RATIO = 1055 / 890;

export function Logo({ height = 40, onDark = false, href }: {
  height?: number;
  // The artwork has a black book and dark eyes that vanish on a dark background.
  // On dark surfaces it gets a thin white outline that follows its shape (like
  // a sticker) instead of sitting in a white box.
  onDark?: boolean;
  // Makes the logo a link (e.g. "/" for the landing page). Left off where
  // navigating away would be harmful — mid-exam screens — so it stays plain there.
  href?: string;
}) {
  const o = Math.max(1, height / 30);
  const outline = `drop-shadow(${o}px 0 0 #fff) drop-shadow(-${o}px 0 0 #fff) drop-shadow(0 ${o}px 0 #fff) drop-shadow(0 -${o}px 0 #fff)`;
  const img = (
    <Image
      src="/Cheating.me.png"
      alt="Cheating.me"
      width={Math.round(height * RATIO)}
      height={height}
      priority
      style={{ height, width: "auto", ...(onDark ? { filter: outline } : {}) }}
    />
  );
  if (!href) return img;
  return (
    <Link href={href} aria-label="Cheating.me — home" className="inline-flex transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 rounded-lg">
      {img}
    </Link>
  );
}
