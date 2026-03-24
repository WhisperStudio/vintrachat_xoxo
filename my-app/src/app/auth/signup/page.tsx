'use client'

import Header from '@/components/header'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function SignupPage() {
  const { signup } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = signup(name, email, password)

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
          <h1>Sign Up</h1>
          <p>Opprett en lokal testbruker. Dette kan byttes til backend senere.</p>

          <label>
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Ditt navn"
              required
            />
          </label>

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
            Create account
          </button>

          <p className="authSwitch">
            Har du allerede bruker? <Link href="/auth/login">Log in</Link>
          </p>
        </form>
      </main>
    </>
  )
}