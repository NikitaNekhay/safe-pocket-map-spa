import { render, screen, fireEvent } from '@testing-library/react'
import { test, expect } from 'vitest'
import LanguageSwitcher from './components/LanguageSwitcher'
import i18n from './i18n'

test('switching to Arabic sets document direction to rtl', async () => {
  render(<LanguageSwitcher />)
  const arButton = screen.getByText(/AR/i)
  fireEvent.click(arButton)
  // wait for language change
  await new Promise(r => setTimeout(r, 50))
  expect(document.documentElement.dir).toBe('rtl')
  // switch back to en
  const enButton = screen.getByText(/EN/i)
  fireEvent.click(enButton)
  await new Promise(r => setTimeout(r, 50))
  expect(document.documentElement.dir).toBe('ltr')
  // restore language
  i18n.changeLanguage('en')
})
