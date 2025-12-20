"use client"

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts'

type MetricsResponse = {
  ok: boolean
  summary: { total: number; completed: number; open: number; createdToday: number }
  categoryCounts: Record<string, number>
  createdByDay: { date: string; created: number }[]
  categories: string[]
  // Use a union index signature to prevent 'date' from conflicting with string index number type
  createdByDayByCategory: Array<{ date: string } & Record<string, number | string>>
}

export default function DashboardOverview() {
  const [data, setData] = React.useState<MetricsResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/dashboard/metrics?days=30', { credentials: 'include' })
        const json = (await res.json()) as MetricsResponse
        if (!mounted) return
        if (!json.ok) {
          setError('Failed to load metrics')
        } else {
          setData(json)
        }
      } catch (e) {
        setError('Failed to load metrics')
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Build palette for categories (manifestation-themed colors)
  const palette = [
    '#7c3aed', // violet
    '#6366f1', // indigo
    '#d946ef', // fuchsia
    '#f43f5e', // rose
    '#f59e0b', // orange
    '#fbbf24', // amber
    '#10b981', // emerald
    '#14b8a6', // teal
    '#0ea5e9', // sky
    '#a855f7', // purple
    '#eab308', // gold
  ]

  const categoriesOriginal = data?.categories ?? []
  const categoriesSlug = categoriesOriginal.map((c) => c.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
  const slugToName = Object.fromEntries(categoriesSlug.map((s, i) => [s, categoriesOriginal[i]]))
  // Capitalize first letter for display labels
  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
  const colorForSlug: Record<string, string> = Object.fromEntries(
    categoriesSlug.map((s, i) => [s, palette[i % palette.length]])
  )

  // Transform per-category daily data to use slug keys
  const createdByDayByCategorySlug = (data?.createdByDayByCategory ?? []).map((row) => {
    const out: Record<string, number | string> = { date: row.date }
    for (let i = 0; i < categoriesOriginal.length; i++) {
      const name = categoriesOriginal[i]
      const slug = categoriesSlug[i]
      out[slug] = (row[name] as number) ?? 0
    }
    return out as { date: string } & Record<string, number>
  })

  // Chart config keyed by slugs
  const chartConfig: ChartConfig = Object.fromEntries(
    categoriesSlug.map((slug) => [slug, { label: capitalize(slugToName[slug]), color: colorForSlug[slug] }])
  )

  const [activeCategory, setActiveCategory] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!activeCategory && categoriesSlug.length > 0) setActiveCategory(categoriesSlug[0])
  }, [categoriesSlug, activeCategory])

  const totalsLastPeriod: Record<string, number> = React.useMemo(() => {
    const totals: Record<string, number> = {}
    for (const slug of categoriesSlug) totals[slug] = 0
    for (const row of createdByDayByCategorySlug) {
      for (const slug of categoriesSlug) {
        totals[slug] += (row[slug] as number) ?? 0
      }
    }
    return totals
  }, [createdByDayByCategorySlug, categoriesSlug])

  const categories = Object.entries(data?.categoryCounts ?? {})
    .map(([name, count]) => ({ name: capitalize(name), count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="grid gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          <>
            <Card className="p-4"><Skeleton className="h-5 w-24" /><Skeleton className="mt-2 h-8 w-16" /></Card>
            <Card className="p-4"><Skeleton className="h-5 w-28" /><Skeleton className="mt-2 h-8 w-16" /></Card>
            <Card className="p-4"><Skeleton className="h-5 w-20" /><Skeleton className="mt-2 h-8 w-16" /></Card>
          </>
        ) : error || !data ? (
          <Card className="p-4"><CardTitle className="text-sm">Unable to load metrics</CardTitle></Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.total}</div>
                <div className="text-xs text-muted-foreground">All time</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.completed}</div>
                <div className="text-xs text-muted-foreground">All time</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Open</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.open}</div>
                <div className="text-xs text-muted-foreground">Currently open</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts area: two-column grid for better UX */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tasks by Category (All time) now in grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Category (All time)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : categories.length === 0 ? (
              <div className="text-sm text-muted-foreground">No categories yet</div>
            ) : (
              <ChartContainer config={{ count: { label: 'Count', color: '#64748b' } }} className="aspect-auto h-[250px] w-full">
                <BarChart data={categories} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent className="w-[160px]" nameKey="count" />} />
                  <Bar dataKey="count">
                    {categories.map((c, i) => {
                      const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      return <Cell key={`cell-${c.name}`} fill={colorForSlug[slug] ?? palette[i % palette.length]} />
                    })}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie chart for category distribution (All time) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Share</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : categories.length === 0 ? (
              <div className="text-sm text-muted-foreground">No categories yet</div>
            ) : (
              <ChartContainer config={{ share: { label: 'Share', color: '#64748b' } }} className="aspect-auto h-[250px] w-full">
                <PieChart>
                  <Pie data={categories} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {categories.map((c, i) => {
                      const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      return <Cell key={`slice-${c.name}`} fill={colorForSlug[slug] ?? palette[i % palette.length]} />
                    })}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent className="w-[160px]" nameKey="count" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Created by day chart (30 days, category toggle) now full-width below */}
      <Card>
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
            <CardTitle className="text-base">Tasks Created (Last 30 days)</CardTitle>
            <CardDescription>Showing totals by category for the last 30 days</CardDescription>
          </div>
          <div className="flex">
            {categoriesSlug.map((slug) => (
              <button
                key={slug}
                data-active={activeCategory === slug}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveCategory(slug)}
              >
                <span className="text-muted-foreground text-xs">{capitalize(slugToName[slug])}</span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {totalsLastPeriod[slug]?.toLocaleString?.() ?? '0'}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : error || !data ? (
            <div className="text-sm text-muted-foreground">No data</div>
          ) : (
            <>
              <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                <BarChart data={createdByDayByCategorySlug} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent className="w-[160px]" nameKey={activeCategory ?? undefined} />} />
                  {activeCategory ? (
                    <Bar dataKey={activeCategory} fill={`var(--color-${activeCategory})`} />
                  ) : null}
                </BarChart>
              </ChartContainer>
            </>
          )}
        </CardContent>
      </Card>

      
    </div>
  )
}