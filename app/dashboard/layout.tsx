"use client"
import Navbar from '@/components/navbar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { FocusTimerProvider } from '@/components/FocusTimerProvider'
import { Toaster } from 'sonner'
import * as React from 'react'
import { cn } from '@/lib/utils'
// Removed Card wrapper for sidebar per request
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AccordionMenu,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel,
  AccordionMenuSeparator,
  AccordionMenuSub,
  AccordionMenuSubContent,
  AccordionMenuSubTrigger,
  AccordionMenuIndicator,
} from '@/components/ui/accordion-menu'
import { Button } from '@/components/ui/button'
import { Button as BaseButton } from '@/components/ui/base-button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/base-tooltip'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardIcon,
  HomeIcon,
  FileTextIcon,
  LayersIcon,
  HeartIcon,
  EyeOpenIcon,
  MagicWandIcon,
  ClockIcon,
  CalendarIcon,
} from '@radix-ui/react-icons'

function titleFromPath(pathname: string): string {
  // Normalize to remove trailing slashes
  const path = pathname.replace(/\/$/, '')
  if (path === '/dashboard') return 'Dashboard'
  if (path.startsWith('/dashboard/')) {
    const sub = path.slice('/dashboard/'.length)
    switch (sub) {
      case 'tasks':
        return 'Tasks'
      case 'gratitude':
        return 'Gratitude'
      case 'vision':
        return 'Vision Board'
      case 'method-369':
        return '369 Method'
      case 'focus-timer':
        return 'Focus Timer'
      default:
        return sub.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
  }
  return 'Dashboard'
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const header = titleFromPath(pathname || '/dashboard')
  const [collapsed, setCollapsed] = React.useState(false)

  // Only treat known group prefixes as "active" when the current path starts with them.
  // This prevents sibling items like "Table View" from highlighting when "Kanban" is active.
  const groupPrefixes = ['/dashboard/tasks']
  const matchPath = (path: string) => {
    if (!path) return false
    if (groupPrefixes.includes(path)) {
      return (pathname || '').startsWith(path)
    }
    // For leaf items, rely on exact match via selectedValue
    return false
  }
  return (
    <div>
      <Navbar />
      <FocusTimerProvider>
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-[auto,1fr] gap-5">
            {/* Sidebar */}
            <div className={collapsed ? 'w-14' : 'w-[220px]'}>
              <div className="sticky top-24 h-full">
                <ScrollArea
                  className={cn('h-[calc(100vh-220px)]')}
                  viewportClassName={cn(collapsed ? 'pe-2' : 'pe-3.5')}
                >
                    {collapsed ? (
                      <div className="flex flex-col items-center gap-3 py-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger render={<BaseButton variant="outline" onClick={() => setCollapsed(false)} />}> 
                                <ChevronRightIcon className="size-5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>Expand Menu</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger render={<BaseButton variant="outline" onClick={() => router.push('/dashboard')} />}> 
                                <HomeIcon className="size-5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>Dashboard</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger render={<BaseButton variant="outline" onClick={() => router.push('/dashboard/tasks')} />}> 
                                <FileTextIcon className="size-5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>Table View</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger render={<BaseButton variant="outline" onClick={() => router.push('/dashboard/tasks/kanban')} />}> 
                                <LayersIcon className="size-5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>Kanban View</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger render={<BaseButton variant="outline" onClick={() => router.push('/dashboard/gratitude')} />}> 
                                <HeartIcon className="size-5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>Gratitude</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger render={<BaseButton variant="outline" onClick={() => router.push('/dashboard/vision')} />}> 
                                <EyeOpenIcon className="size-5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>Vision Board</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger render={<BaseButton variant="outline" onClick={() => router.push('/dashboard/method-369')} />}> 
                                <MagicWandIcon className="size-5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>369 Method</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger render={<BaseButton variant="outline" onClick={() => router.push('/dashboard/focus-timer')} />}> 
                                <ClockIcon className="size-5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>Focus Timer</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                      </div>
                    ) : (
                      <div className="overflow-hidden border border-border rounded-md p-2">
                        <AccordionMenu
                          type="multiple"
                          defaultValue={["/dashboard/tasks"]}
                          selectedValue={pathname}
                          matchPath={matchPath}
                          onItemClick={(value) => {
                            if (value && value.startsWith('/')) {
                              router.push(value)
                            }
                          }}
                          classNames={{ separator: '-mx-2 mb-2.5' }}
                        >
                          <AccordionMenuLabel>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">Menu Items</span>
                              <Button
                                size="sm"
                                mode="icon"
                                variant="outline"
                                aria-label={'Collapse sidebar'}
                                onClick={() => setCollapsed(true)}
                              >
                                <ChevronLeftIcon />
                              </Button>
                            </div>
                          </AccordionMenuLabel>
                          <AccordionMenuSeparator />

                          <AccordionMenuGroup>
                            <AccordionMenuItem value="/dashboard">
                              <HomeIcon />
                              <span>Dashboard</span>
                            </AccordionMenuItem>

                            <AccordionMenuSub value="/dashboard/tasks">
                              <AccordionMenuSubTrigger value="/dashboard/tasks">
                                <ClipboardIcon />
                                <span>Tasks</span>
                                <AccordionMenuIndicator />
                              </AccordionMenuSubTrigger>
                              <AccordionMenuSubContent type="single" collapsible parentValue="/dashboard/tasks">
                                <AccordionMenuGroup>
                                  <AccordionMenuItem value="/dashboard/tasks">
                                    <FileTextIcon />
                                    <span>Table View</span>
                                  </AccordionMenuItem>
                                  <AccordionMenuItem value="/dashboard/tasks/kanban">
                                    <LayersIcon />
                                    <span>Kanban View</span>
                                  </AccordionMenuItem>
                                  <AccordionMenuItem value="/dashboard/tasks/calendar">
                                    <CalendarIcon />
                                    <span>Calendar View</span>
                                  </AccordionMenuItem>
                                </AccordionMenuGroup>
                              </AccordionMenuSubContent>
                            </AccordionMenuSub>

                            <AccordionMenuItem value="/dashboard/gratitude">
                              <HeartIcon />
                              <span>Gratitude</span>
                            </AccordionMenuItem>
                            <AccordionMenuItem value="/dashboard/vision">
                              <EyeOpenIcon />
                              <span>Vision Board</span>
                            </AccordionMenuItem>
                            <AccordionMenuItem value="/dashboard/method-369">
                              <MagicWandIcon />
                              <span>369 Method</span>
                            </AccordionMenuItem>
                            <AccordionMenuItem value="/dashboard/focus-timer">
                              <ClockIcon />
                              <span>Focus Timer</span>
                            </AccordionMenuItem>
                          </AccordionMenuGroup>
                        </AccordionMenu>
                      </div>
                    )}
                </ScrollArea>
              </div>
            </div>

            {/* Main content */}
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">{header}</h1>
              </div>
              {children}
            </div>
          </div>
        </main>
      </FocusTimerProvider>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}