'use client'

import React from 'react'
import Header from '@/components/header'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}
