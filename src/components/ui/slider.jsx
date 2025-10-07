import * as React from "react";
import * as Primitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <Primitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <Primitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <Primitive.Range className="absolute h-full bg-primary" />
    </Primitive.Track>
    <Primitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </Primitive.Root>
));
Slider.displayName = Primitive.Root.displayName;

export { Slider };
