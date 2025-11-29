import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-3 rounded-xl transition-all duration-300",
        "bg-neutral-200 dark:bg-neutral-700",
        "hover:bg-neutral-300 dark:hover:bg-neutral-600",
        "shadow-md hover:shadow-lg",
        "flex items-center justify-center"
      )}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <IconMoon className="h-5 w-5 text-neutral-800 dark:text-neutral-200 transition-transform duration-300 hover:scale-110" />
      ) : (
        <IconSun className="h-5 w-5 text-neutral-800 dark:text-neutral-200 transition-transform duration-300 hover:scale-110" />
      )}
    </button>
  );
}
