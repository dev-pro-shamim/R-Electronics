import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export const Logo: React.FC<LogoProps> = ({ className = "h-auto w-36 md:w-52", variant = "light" }) => {
  const isLight = variant === "light";

  return (
    <Link href="/" className={`inline-flex items-center select-none ${className}`}>
      <div className={`p-1.5 rounded-lg transition-all ${isLight ? "bg-white shadow-sm" : "bg-transparent"}`}>
        <img
          src="/logo.png"
          alt="Rango Electronics"
          className="h-8 md:h-10 w-auto object-contain"
        />
      </div>
    </Link>
  );
};
