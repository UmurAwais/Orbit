import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Toolbar from './Toolbar'
import React from 'react'

describe('Toolbar Component', () => {
  it('submits a valid URL as is', () => {
    const onNavigate = vi.fn()
    render(<Toolbar url="https://google.com" onNavigate={onNavigate} />)
    
    const input = screen.getByPlaceholderText(/Search or enter website name/i)
    fireEvent.change(input, { target: { value: 'https://github.com' } })
    fireEvent.submit(screen.getByRole('textbox').closest('form'))
    
    expect(onNavigate).toHaveBeenCalledWith('https://github.com')
  })

  it('prefixes domain names with https://', () => {
    const onNavigate = vi.fn()
    render(<Toolbar url="" onNavigate={onNavigate} />)
    
    const input = screen.getByPlaceholderText(/Search or enter website name/i)
    fireEvent.change(input, { target: { value: 'example.com' } })
    fireEvent.submit(input.closest('form'))
    
    expect(onNavigate).toHaveBeenCalledWith('https://example.com')
  })

  it('converts non-domain text to Google search', () => {
    const onNavigate = vi.fn()
    render(<Toolbar url="" onNavigate={onNavigate} />)
    
    const input = screen.getByPlaceholderText(/Search or enter website name/i)
    fireEvent.change(input, { target: { value: 'hello orbit' } })
    fireEvent.submit(input.closest('form'))
    
    expect(onNavigate).toHaveBeenCalledWith('https://www.google.com/search?q=hello%20orbit')
  })
})
