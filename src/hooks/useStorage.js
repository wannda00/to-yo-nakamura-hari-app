import { useState, useCallback } from 'react'

export const COLORS = [
  '#ef4444','#f97316','#eab308','#84cc16','#22c55e',
  '#06b6d4','#6366f1','#ec4899','#14b8a6','#8b5cf6','#f59e0b','#0ea5e9',
]

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function useSymptoms() {
  const [symptoms, setSymptoms] = useState(() => load('symptoms', []))

  const addSymptom = useCallback((name) => {
    setSymptoms(prev => {
      const usedColors = prev.map(s => s.color)
      const unused = COLORS.filter(c => !usedColors.includes(c))
      const color = unused.length > 0 ? unused[0] : COLORS[prev.length % COLORS.length]
      const next = { id: crypto.randomUUID(), name: name.trim(), color }
      const updated = [...prev, next]
      save('symptoms', updated)
      return updated
    })
  }, [])

  const removeSymptom = useCallback((id) => {
    setSymptoms(prev => {
      const updated = prev.filter(s => s.id !== id)
      save('symptoms', updated)
      return updated
    })
  }, [])

  const updateSymptomColor = useCallback((id, color) => {
    setSymptoms(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, color } : s)
      save('symptoms', updated)
      return updated
    })
  }, [])

  const moveSymptom = useCallback((id, dir) => {
    setSymptoms(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if (idx < 0) return prev
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const updated = [...prev]
      ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
      save('symptoms', updated)
      return updated
    })
  }, [])

  return { symptoms, addSymptom, removeSymptom, updateSymptomColor, moveSymptom }
}

export function useRecords() {
  const [records, setRecords] = useState(() => load('records', []))

  const saveRecord = useCallback((date, entries, note = '') => {
    setRecords(prev => {
      const updated = prev.find(r => r.date === date)
        ? prev.map(r => r.date === date ? { ...r, entries, note } : r)
        : [...prev, { id: Date.now().toString(), date, entries, note }]
      save('records', updated)
      return updated
    })
  }, [])

  return { records, saveRecord }
}

export function useTreatmentDates() {
  const [dates, setDates] = useState(() => load('treatmentDates', []))

  const toggleDate = useCallback((date) => {
    setDates(prev => {
      const updated = prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date].sort()
      save('treatmentDates', updated)
      return updated
    })
  }, [])

  return { treatmentDates: dates, toggleTreatmentDate: toggleDate }
}

export function exportAllData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    symptoms: load('symptoms', []),
    records: load('records', []),
    treatmentDates: load('treatmentDates', []),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  a.download = `症状記録_${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importAllData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!data.version || !Array.isArray(data.symptoms) || !Array.isArray(data.records)) {
          throw new Error('invalid format')
        }
        save('symptoms', data.symptoms)
        save('records', data.records)
        if (Array.isArray(data.treatmentDates)) save('treatmentDates', data.treatmentDates)
        resolve({ symptoms: data.symptoms.length, records: data.records.length })
      } catch {
        reject(new Error('ファイルの形式が正しくありません'))
      }
    }
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsText(file)
  })
}
