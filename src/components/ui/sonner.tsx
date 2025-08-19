import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={5000} // auto-hide after 5s
      style={{
        marginTop: "4.8rem",
        marginRight: "1.5rem",
      }}
      toastOptions={{
        success: {
          style: { background: "hsl(142, 71%, 45%)", color: "white" },
        },
        error: {
          style: { background: "hsl(0, 84%, 60%)", color: "white" },
        },
        warning: {
          style: { background: "hsl(38, 92%, 50%)", color: "black" },
        },
        info: {
          style: { background: "hsl(217, 91%, 60%)", color: "white" },
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
