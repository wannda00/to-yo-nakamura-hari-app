import { useState, useCallback } from 'react'

const DEFAULT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzw_I3EfON3SexemkpopGAzOv9B5uBo_0aAQFUlXG9OpBAlkhPtzd0UyAcuIwJ13quQ/exec'

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function generateId() {
  const a = Math.random().toString(36).slice(2, 8)
  const b = Math.random().toString(36).slice(2, 8)
  return `${a}-${b}`
}

export function useConsent() {
  // null=未回答, true=同意, false=拒否
  const [consent, setConsentState] = useState(() => load('dataConsent', null))
  const [endpointUrl, setEndpointUrlState] = useState(() => load('endpointUrl', DEFAULT_ENDPOINT))
  const [anonymousId] = useState(() => {
    const existing = load('anonymousId', null)
    if (existing) return existing
    const id = generateId()
    persist('anonymousId', id)
    return id
  })

  const setConsent = useCallback((value) => {
    persist('dataConsent', value)
    setConsentState(value)
  }, [])

  const setEndpointUrl = useCallback((url) => {
    persist('endpointUrl', url.trim())
    setEndpointUrlState(url.trim())
  }, [])

  return { consent, anonymousId, endpointUrl, setConsent, setEndpointUrl }
}

export async function sendToSheet({ endpointUrl, anonymousId, date, entries, symptoms }) {
  if (!endpointUrl || !entries.length) return

  const payload = {
    anonymousId,
    date,
    entries: entries.map(e => ({
      symptomName: symptoms.find(s => s.id === e.symptomId)?.name ?? '不明',
      value: e.value,
    })),
  }

  try {
    // no-cors: レスポンスは読めないが POST は届く（GAS の仕様）
    await fetch(endpointUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // オフライン等 — ローカル保存は完了しているため無視
  }
}
