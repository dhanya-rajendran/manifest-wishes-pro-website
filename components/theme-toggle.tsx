"use client"
import { useEffect, useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type ThemeChoice = 'fancy' | 'solid' | 'purple'

function applyThemeClass(choice: ThemeChoice) {
  const root = document.documentElement
  const map = {
    fancy: 'theme-fancy',
    solid: 'theme-solid',
    purple: 'theme-purple',
  } as const
  const themeClass = map[choice]
  root.classList.remove('theme-fancy', 'theme-solid', 'theme-purple')
  root.classList.add(themeClass)
}

export default function ThemeToggle() {
  const [value, setValue] = useState<ThemeChoice>(() => {
    try {
      return (localStorage.getItem('theme') as ThemeChoice | null) || 'purple'
    } catch {
      return 'purple'
    }
  })

  useEffect(() => {
    applyThemeClass(value)
  }, [value])

  function onValueChange(next: ThemeChoice) {
    setValue(next)
    try {
      localStorage.setItem('theme', next)
    } catch {
      void 0
    }
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
      <ToggleGroupItem value="purple" aria-label="Purple theme">
        Purple
      </ToggleGroupItem>
    </ToggleGroup>
  )
}