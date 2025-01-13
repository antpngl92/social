"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "./ui/button"
import { ModeThemeToggleVariant } from './enums'

export function ModeThemeToggle(
  { variant } : { variant: ModeThemeToggleVariant.MOBILE | ModeThemeToggleVariant.DESKTOP }
) {
  const { theme, setTheme } = useTheme() 
  const isDesktop = variant === ModeThemeToggleVariant.DESKTOP

  return (
    <Button
      variant={isDesktop ? 'outline': 'ghost'}
      size='icon'
      onClick={() => setTheme(theme === "dark" ? "light" : 'dark')} 
      className={!isDesktop ? 'mr-2' : ''}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate90 dark:scale-0"/>
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
      <span className="sr-only">Toggle theme</span> 
    </Button>
  )
}
