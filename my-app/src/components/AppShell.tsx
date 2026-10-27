'use client'

import React from 'react'
import Header from '@/components/header'
import { usePathname } from 'next/navigation'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <>
      {pathname !== '/admin' && <Header />}
      {children}
    </>
  )
}
