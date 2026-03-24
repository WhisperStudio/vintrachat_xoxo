'use client'

import Header from '@/components/header'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = login(email, password)

    if (!result.ok) {
      setError(result.message || 'Noe gikk galt.')
      return
    }

    router.push('/landings/user')
  }

  return (
    <>
      <Header />
      <main className="authPage">
        <form className="authCard" onSubmit={handleSubmit}>
          <h1>Log In</h1>
          <p>Logg inn med en lokal bruker lagret i nettleseren.</p>

          <label>
            <span>Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="name@email.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="********"
              required
            />
          </label>

          {error && <div className="errorBox">{error}</div>}

          <button className="primaryBtn fullWidth" type="submit">
            Log In
          </button>

          <p className="authSwitch">
            Har du ikke bruker? <Link href="/auth/signup">Sign up</Link>
          </p>
        </form>
      </main>
    </>
  )
}