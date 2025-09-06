// C:\Users\markn\Desktop\dashboard-obgyn\frontend\src\components\ui\badge.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",

        // Statuses for Appointments
        pending: "bg-[#FCFBDC] text-[#A9A523] border border-[#E6E389]",
        accepted: "bg-[#E6FCDC] text-[#166534] border border-[#BCFFAC]",
        cancelled: "bg-red-100 text-red-800 border border-red-300",
        done: "bg-[#F3F3F3] text-[#616161] border border-[#E5E5E5]",
        rescheduled: "bg-[#FCEEDC] text-[#ED9237] border border-[#FFD49D]",
         "scheduled for follow-up": "bg-blue-100 text-blue-800",
        

        //Statuses for Patient Directory
        Inactive: "bg-[#F3F3F3] text-[#616161] border-[#E5E5E5]",
        Active: "bg-[#E6FCDC] text-[#166534] border-[#BCFFAC]",

        // Risk level badge
        High: "bg-[#FFE3E3] text-[#C03636] border-[#FFCBCB]",
        Moderate: "bg-[#FCFBDC] text-[#E2BC4A] border-[#F0EEAE]",
        Low: "bg-[#E6FCDC] text-[#166534] border-[#BCFFAC]",

        // Allergy
        allergy: "bg-[#FFFFFF] text-[#616161] border-[#E5E5E5]",

        // Pre-existing Condition badges
        conditions: "bg-[#FFFFFF] text-[#616161] border-[#E5E5E5]",

        // Moods
        moodAnxious: "bg-[#FEF9C3] text-[#854D0E] border-[#E5E7EB]",
        moodHappy: "bg-[#E6FCDC] text-[#166534] border-[#BCFFAC]",
        moodSad: "bg-[#F3F3F3] text-[#616161] border-[#E5E5E5]",
        moodCalm: "bg-[#E0F7FA] text-[#00796B] border-[#B2EBF2]",
        moodNeutral: "bg-[#F5F5F5] text-[#424242] border-[#E0E0E0]",
        moodTired: "bg-[#FFF8E1] text-[#F57C00] border-[#FFE0B2]",
        moodContent: "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]",
        moodIrritable: "bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]",


        // USER BADGES
        obgyn: "bg-pink-100 text-pink-800 border border-pink-300",
        secretary: "bg-green-100 text-green-800 border border-green-300",



      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)


function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
