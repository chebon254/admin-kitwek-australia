'use client';

import Image from "next/image";
import { useState } from "react";

interface DocumentImagePreviewProps {
  src: string;
  alt: string;
  fileName: string;
}

export function DocumentImagePreview({ src, alt }: DocumentImagePreviewProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="relative h-32 w-full bg-gray-100 rounded">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover rounded"
          onError={() => setImageError(true)}
        />
      </div>
    </div>
  );
}