"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackSrc = "/logo.png",
  className,
  ...rest
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  return (
    <Image
      {...rest}
      src={hasError ? fallbackSrc : imgSrc}
      alt={alt || "Rango Electronics"}
      className={`${className || ""} ${hasError ? "p-4 object-contain opacity-80" : ""}`}
      onError={() => {
        setHasError(true);
        setImgSrc(fallbackSrc);
      }}
    />
  );
};
