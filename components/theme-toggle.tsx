"use client"
import { useEffect, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type ThemeChoice = 'fancy' | 'solid'

function applyThemeClass(choice: ThemeChoice) {
  const root = document.documentElement
  const map = {
    fancy: 'theme-fancy',
    solid: 'theme-solid',
  } as const
  const themeClass = map[choice]
  root.classList.remove('theme-fancy', 'theme-solid')
  root.classList.add(themeClass)
}

export default function ThemeToggle() {
  const [value, setValue] = useState<ThemeChoice>('fancy')

  useEffect(() => {
    try {
      const saved = (localStorage.getItem('theme') as ThemeChoice | null) || 'fancy'
      setValue(saved)
      applyThemeClass(saved)
    } catch {}
  }, [])

  function onValueChange(next: ThemeChoice) {
    setValue(next)
    applyThemeClass(next)
    try {
      localStorage.setItem('theme', next)
    } catch {}
  }

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => val && onValueChange(val as ThemeChoice)}
      variant="outline"
      size="sm"
      aria-label="Select theme"
    >
      <ToggleGroupItem value="fancy" aria-label="Fancy theme">
        Fancy
      </ToggleGroupItem>
      <ToggleGroupItem value="solid" aria-label="Solid theme">
        Solid
      </ToggleGroupItem>
    </ToggleGroup>
  )
}