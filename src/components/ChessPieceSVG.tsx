"use client";

import React from "react";
import { PieceSymbol, Color } from "chess.js";

interface ChessPieceSVGProps {
  type: PieceSymbol;
  color: Color;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "board";
  className?: string;
}

export function ChessPieceSVG({
  type,
  color,
  size = "md",
  className = "",
}: ChessPieceSVGProps) {
  const isWhite = color === "w";

  // Visual Theme: Nexus Cyberpunk Staunton
  // White: Crisp porcelain white body with luminous cyan edges and glow
  // Black: Solid deep obsidian-violet body with radiant neon purple borders and bright lilac inner details
  const strokeColor = isWhite ? "#00F2FF" : "#C084FC";
  const fillColor = isWhite ? "#FFFFFF" : "#1D1533";
  const accentColor = isWhite ? "#00F2FF" : "#F5D0FE";
  const filterGlow = isWhite
    ? "drop-shadow(0 0 3px rgba(0,242,255,0.6)) drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
    : "drop-shadow(0 0 3.5px rgba(192,132,252,0.65)) drop-shadow(0 2px 4px rgba(0,0,0,0.8))";

  const sizeClass = {
    xs: "w-5 h-5",
    sm: "w-6 h-6 md:w-7 md:h-7",
    md: "w-8 h-8 md:w-10 md:h-10",
    lg: "w-10 h-10 md:w-12 md:h-12",
    xl: "w-12 h-12 md:w-14 md:h-14",
    board: "w-[84%] h-[84%] max-w-full max-h-full",
  }[size];

  // Authentic World-Standard Staunton vector geometry (45x45 viewBox)
  const renderPiece = () => {
    switch (type) {
      // ─── PAWN (عسكري / بيدق) ───
      // Classic compact Staunton silhouette with spherical head and tapered skirt
      case "p":
        return isWhite ? (
          <path
            d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M22.5 9a4 4 0 0 0-3.22 6.38 6.48 6.48 0 0 0-.87 10.65c-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47a6.46 6.46 0 0 0-.87-10.65A4.01 4.01 0 0 0 22.5 9z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );

      // ─── KNIGHT (حصان) ───
      // Authentic Staunton horse head: arched neck, pointed ears, muzzle, nostril, eye, and mane
      case "n":
        return (
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokeColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          >
            {/* Arched Neck & Body */}
            <path
              fill={fillColor}
              d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
            />
            {/* Snout, Ears & Jaw */}
            <path
              fill={fillColor}
              d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"
            />
            {/* Nostril & Eye */}
            <path
              fill={accentColor}
              stroke={accentColor}
              strokeWidth="0.5"
              d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0m5.433-9.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5"
            />
            {/* Knight Mane Highlight (crisp accent for black piece) */}
            {!isWhite && (
              <path
                fill={accentColor}
                stroke="none"
                d="m24.55 10.4-.45 1.45.5.15c3.15 1 5.65 2.49 7.9 6.75S35.75 29.06 35.25 39l-.05.5h2.25l.05-.5c.5-10.06-.88-16.85-3.25-21.34s-5.79-6.64-9.19-7.16z"
              />
            )}
          </g>
        );

      // ─── BISHOP (فيل) ───
      // Unmistakable authentic Staunton Bishop:
      // High teardrop mitre hat, distinctive forehead cross cut, curved pedestal base, waist rings, and top finial
      case "b":
        return (
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokeColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          >
            <g fill={fillColor} strokeLinecap="butt">
              {/* Stepped Pedestal Base (radically different from pawn base) */}
              <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z" />
              {/* Tall Mitre Body */}
              <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
              {/* Top Finial Orb */}
              <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
            </g>
            {/* Waist Rings + The Iconic Staunton Mitre Cross (+) */}
            <path
              stroke={accentColor}
              strokeWidth="1.6"
              strokeLinejoin="miter"
              d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5"
            />
          </g>
        );

      // ─── ROOK (طابية / رخ) ───
      // Authentic Staunton fortress tower with 4 clean crenellations / battlements and stonework bands
      case "r":
        return (
          <g
            fillRule="evenodd"
            stroke={strokeColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          >
            {/* Base & Plinth */}
            <path
              fill={fillColor}
              strokeLinecap="butt"
              d="M9 39h27v-3H9zm3-3v-4h21v4z"
            />
            {/* Castle Tower Wall */}
            <path
              fill={fillColor}
              strokeLinecap="butt"
              strokeLinejoin="miter"
              d="M14 29.5v-12.5h17v12.5z"
            />
            {/* Waist Ramp & Crenellated Parapet (Battlements) */}
            <path
              fill={fillColor}
              strokeLinecap="butt"
              d="M14 17 11 14h23l-3 3zM11 14V9h4v2h5V9h5v2h5V9h4v5z"
            />
            <path fill={fillColor} d="m31 29.5 1.5 2.5h-20l1.5-2.5" />
            <path fill="none" strokeLinejoin="miter" d="M11 14h23" />
            {/* Masonry joints accent */}
            <path
              fill="none"
              stroke={accentColor}
              strokeLinejoin="miter"
              strokeWidth="1.2"
              d="M12 35.5h21m-20-4h19m-18-2h17m-17-12.5h17"
            />
          </g>
        );

      // ─── QUEEN (وزير / ملكة) ───
      // Authentic Staunton Queen: 5-pointed crown coronet topped with 5 jewels/pearls and royal belt
      case "q":
        return (
          <g
            fillRule="evenodd"
            stroke={strokeColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          >
            {/* 5 Crown Jewels / Pearls */}
            <g stroke={strokeColor} strokeWidth="1" fill={accentColor}>
              <circle cx="6" cy="12" r="2.5" />
              <circle cx="14" cy="9" r="2.5" />
              <circle cx="22.5" cy="8" r="2.5" />
              <circle cx="31" cy="9" r="2.5" />
              <circle cx="39" cy="12" r="2.5" />
            </g>
            {/* Crown Spikes / Coronet */}
            <path
              fill={fillColor}
              strokeLinecap="butt"
              d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5z"
            />
            {/* Royal Waist Gown */}
            <path
              fill={fillColor}
              strokeLinecap="butt"
              d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"
            />
            {/* Belt Rings & Ribs */}
            <path
              fill="none"
              stroke={accentColor}
              strokeWidth="1.2"
              d="M11 29a35 35 1 0 1 23 0m-21.5 2.5h20m-21 3a35 35 1 0 0 22 0"
            />
          </g>
        );

      // ─── KING (ملك) ───
      // Authentic Staunton King: closed arched imperial crown topped by prominent Latin Cross (+)
      case "k":
        return (
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokeColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          >
            {/* Royal Latin Cross Finial (+) */}
            <path
              stroke={accentColor}
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
              d="M22.5 11.6V6M20 8h5"
            />
            {/* Center Crown Mound */}
            <path
              fill={fillColor}
              strokeLinecap="butt"
              strokeLinejoin="miter"
              d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
            />
            {/* Regal Mantle & Base */}
            <path
              fill={fillColor}
              d="M11.5 37a22.3 22.3 0 0 0 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10z"
            />
            {/* Imperial Crown Arches */}
            <path
              stroke={accentColor}
              strokeWidth="1.3"
              d="M32 29.5s8.5-4 6-9.7C34.1 14 25 18 22.5 24.6v2.1-2.1C20 18 9.9 14 7 19.9c-2.5 5.6 4.8 9 4.8 9"
            />
            {/* Robe Collar Ribs */}
            <path
              stroke={accentColor}
              strokeWidth="1.2"
              d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"
            />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 45 45"
      className={`${sizeClass} select-none transition-transform duration-150 block m-auto ${className}`}
      style={{ filter: filterGlow }}
    >
      {renderPiece()}
    </svg>
  );
}
