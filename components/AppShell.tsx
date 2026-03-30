'use client'

import { usePathname } from 'next/navigation'
import TopNav from '@/components/TopNav'

const HIDE_NAV_PATHS = new Set(['/login'])

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNav = pathname == null || !HIDE_NAV_PATHS.has(pathname)

  return (
    <>
      {showNav && <TopNav />}
      {children}
    </>
  )
}
