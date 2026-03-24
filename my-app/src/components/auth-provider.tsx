'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Purchases = {
  websites: boolean
  chatWidget: boolean
}

type UserData = {
  name: string
  email: string
  password: string
  purchases: Purchases
}

type AuthContextType = {
  user: UserData | null
  isLoggedIn: boolean
  login: (email: string, password: string) => { ok: boolean; message?: string }
  signup: (name: string, email: string, password: string) => { ok: boolean; message?: string }
  logout: () => void
  updatePurchases: (purchases: Purchases) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'vote_current_user'
const USERS_KEY = 'vote_users'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setUser(JSON.parse(saved))
    }
  }, [])

  const signup = (name: string, email: string, password: string) => {
    const rawUsers = localStorage.getItem(USERS_KEY)
    const users: UserData[] = rawUsers ? JSON.parse(rawUsers) : []

    const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (exists) {
      return { ok: false, message: 'Bruker finnes allerede.' }
    }

    const newUser: UserData = {
      name,
      email,
      password,
      purchases: {
        websites: true,
        chatWidget: true,
      },
    }

    const updatedUsers = [...users, newUser]
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    setUser(newUser)

    return { ok: true }
  }

  const login = (email: string, password: string) => {
    const rawUsers = localStorage.getItem(USERS_KEY)
    const users: UserData[] = rawUsers ? JSON.parse(rawUsers) : []

    const found = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    )

    if (!found) {
      return { ok: false, message: 'Feil e-post eller passord.' }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(found))
    setUser(found)
    return { ok: true }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  const updatePurchases = (purchases: Purchases) => {
    if (!user) return

    const updatedUser = { ...user, purchases }
    setUser(updatedUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser))

    const rawUsers = localStorage.getItem(USERS_KEY)
    const users: UserData[] = rawUsers ? JSON.parse(rawUsers) : []

    const updatedUsers = users.map((u) =>
      u.email === updatedUser.email ? updatedUser : u
    )

    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers))
  }

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      login,
      signup,
      logout,
      updatePurchases,
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}