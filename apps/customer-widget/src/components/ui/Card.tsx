import * as React from "react";
import { cn } from "./utils";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-white rounded-2xl border border-gray-200 shadow-sm p-4",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-0", className)} {...props} />
));
CardContent.displayName = "CardContent";
