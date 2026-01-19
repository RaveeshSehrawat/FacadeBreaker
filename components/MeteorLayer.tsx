"use client";

import { useMemo } from "react";

interface MeteorLayerProps {
    count?: number;
    className?: string;
}

const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
};

const MeteorLayer = ({ count = 18, className = "" }: MeteorLayerProps) => {
    const configs = useMemo(
        () =>
            Array.from({ length: count }, (_, idx) => {
                const topSpread = pseudoRandom(idx + 1) * 100;
                const rightSpread = 5 + pseudoRandom(idx + 7) * 90;
                const delay = pseudoRandom(idx + 13) * 3.5;
                const duration = 4.5 + pseudoRandom(idx + 29) * 2.5;
                return { top: topSpread, right: rightSpread, delay, duration };
            }),
        [count]
    );

    return (
        <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden>
            {configs.map((cfg, idx) => (
                <span
                    key={idx}
                    className="meteor"
                    style={{
                        top: `${cfg.top}%`,
                        right: `${cfg.right}%`,
                        animationDelay: `${cfg.delay}s`,
                        animationDuration: `${cfg.duration}s`,
                    }}
                />
            ))}
        </div>
    );
};

export default MeteorLayer;
