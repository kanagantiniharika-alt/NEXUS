import React, { useRef, useState } from "react";
import "./SpotlightCard.css";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

const SpotlightCard = ({ children, className = "", spotlightColor = "rgba(255, 255, 255, 0.05)" }: SpotlightCardProps) => {
  return (
    <div className={`card-spotlight ${className}`}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${spotlightColor}, transparent 80%)`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default SpotlightCard;
