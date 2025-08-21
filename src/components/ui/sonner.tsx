"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = (props: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      duration={5000}                 // auto-hide after 5s
      className="toaster group"       // keep this class for styling hooks
      style={{
        marginTop: "4.8rem",          // ✅ margins intact
        marginRight: "1.5rem",
      }}
      {...props}
    />
  )
}

export { Toaster }
