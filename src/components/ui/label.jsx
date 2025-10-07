import * as React from "react";
import * as Primitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <Primitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = Primitive.Root.displayName;

export { Label };
