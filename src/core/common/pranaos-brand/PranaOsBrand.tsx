import React from "react";

interface IPranaOsBrandProps {
  className?: string;
  size?: "default" | "lg";
  compact?: boolean;
}

const PranaOsBrand = ({
  className = "",
  size = "default",
  compact = false,
}: IPranaOsBrandProps) => {
  const classes = [
    "pranaos-brand",
    size === "lg" ? "pranaos-brand--lg" : "",
    compact ? "pranaos-brand--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <span className="pranaos-mark" aria-hidden="true">
        P
      </span>
      {!compact && (
        <span className="pranaos-text">
          <span className="pranaos-wordmark">
            Prana<span>Os</span>
          </span>
          <span className="pranaos-sub">JJM hospital</span>
        </span>
      )}
    </div>
  );
};

export default PranaOsBrand;
