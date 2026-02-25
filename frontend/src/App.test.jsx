import { render, screen, act } from '@testing-library/react'
import { test, expect } from 'vitest'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import i18n from './i18n'

test('renders app and home', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
  expect(screen.getByText(/Safe Pocket Map/i)).toBeInTheDocument()
})

test('switching to Arabic sets document dir to rtl', async () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
  await act(async () => {
    await i18n.changeLanguage('ar')
  })
  expect(document.documentElement.dir).toBe('rtl')
})
