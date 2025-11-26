// components/ui/Card.tsx
import { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    hover?: boolean;
}

export default function Card({
    children,
    className = "",
    onClick,
    hover = false,
}: CardProps) {
    const baseStyles =
        "bg-[#14141f] border border-white/10 rounded-2xl p-4 transition-all duration-200";
    const hoverStyles = hover
        ? "hover:bg-[#1a1a28] hover:border-white/20 hover:shadow-lg cursor-pointer active:scale-[0.98]"
        : "";
    const clickableStyles = onClick ? "cursor-pointer" : "";

    return (
        <div
            className={`${baseStyles} ${hoverStyles} ${clickableStyles} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
