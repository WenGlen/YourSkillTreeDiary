import * as React from "react";
import * as Primitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => (
  <Primitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
    <Primitive.Viewport className="h-full w-full rounded-[inherit]">{children}</Primitive.Viewport>
    <ScrollBar />
    <Primitive.Corner />
  </Primitive.Root>
));
ScrollArea.displayName = Primitive.Root.displayName;

const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => (
  <Primitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className,
    )}
    {...props}
  >
    <Primitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </Primitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = Primitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
