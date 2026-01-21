"use client"

import React, { useState } from "react"

type Joke = {
  id?: number
  type?: string
  setup?: string
  punchline?: string
  joke?: string
}

export default function JokeGenerator() {
  const [joke, setJoke] = useState<Joke | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchJoke() {
    setLoading(true)
    setError(null)
    setJoke(null)

    // Primary: Official Joke API (setup/punchline)
    // Fallback: icanhazdadjoke (single-line)
    try {
      const res = await fetch("https://official-joke-api.appspot.com/jokes/random", {
        headers: { Accept: "application/json" },
      })

      if (res.ok) {
        const data: Joke = await res.json()
        setJoke(data)
        setLoading(false)
        return
      }

      // fallback to icanhazdadjoke
      const res2 = await fetch("https://icanhazdadjoke.com/", {
        headers: { Accept: "application/json" },
      })
      if (res2.ok) {
        const data2 = await res2.json()
        setJoke({ joke: data2.joke })
        setLoading(false)
        return
      }

      throw new Error(`Joke APIs unavailable: ${res.status} / ${res2?.status}`)
    } catch (err: any) {
      console.error("Joke fetch failed", err)
      setError("Couldn't fetch a joke right now. Try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div>
        <button
          onClick={fetchJoke}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          type="button"
        >
          {loading ? "Loading..." : "Tell me a joke"}
        </button>
      </div>

      {joke && (
        <div className="max-w-xs rounded-md bg-slate-800/90 px-3 py-2 text-sm text-white shadow-md">
          {joke.setup ? (
            <>
              <div className="font-medium">{joke.setup}</div>
              <div className="mt-1 text-slate-200">{joke.punchline}</div>
            </>
          ) : (
            <div>{joke.joke}</div>
          )}
        </div>
      )}

      {error && <div className="text-sm text-red-400">{error}</div>}
    </div>
  )
}
