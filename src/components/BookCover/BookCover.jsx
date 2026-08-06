import {
  useEffect,
  useState,
} from "react";

import {
  BookOpen,
} from "lucide-react";

export default function BookCover({
  src,
  alt = "Capa da obra",
  className = "",
  iconSize = 28,
  loading = "lazy",
}) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  /*
    Quando a URL mudar, permitimos que a nova
    imagem seja testada normalmente.
  */
  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const showImage =
    Boolean(src) &&
    !imageFailed;

  const coverClassName = [
    className,
    showImage
      ? "has-cover"
      : "has-cover-fallback",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={coverClassName}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          referrerPolicy="no-referrer"
          onError={() => {
            setImageFailed(true);
          }}
        />
      ) : (
        <BookOpen
          size={iconSize}
          aria-hidden="true"
        />
      )}
    </span>
  );
}