import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './button'
import { Link } from 'react-router-dom'

describe('Button Component', () => {
  it('should render with default variant and size', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary', 'h-10', 'px-4', 'py-2')
  })

  it('should apply custom className correctly', () => {
    render(<Button className="custom-class">Test</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('custom-class')
  })

  it('should forward ref properly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Test</Button>)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('should render as different element when asChild is true', () => {
    render(
      <Button asChild>
        <Link to="/test">Test Link</Link>
      </Button>
    )
    
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('should be disabled when loading', () => {
    render(<Button loading>Loading</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toBeDisabled()
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('should show loading spinner when loading', () => {
    render(<Button loading>Save</Button>)
    
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should show loading text when provided', () => {
    render(
      <Button loading loadingText="Saving...">
        Save
      </Button>
    )
    
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(screen.queryByText('Save')).not.toBeInTheDocument()
  })

  it('should handle all variant styles', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
    
    variants.forEach(variant => {
      const { rerender } = render(<Button variant={variant}>Test</Button>)
      const button = screen.getByRole('button')
      
      // Verifica se a classe da variante está aplicada
      expect(button).toHaveClass(expect.stringMatching(/bg-|border|hover:/))
      
      rerender(<div />)
    })
  })

  it('should handle all size variants', () => {
    const sizes = ['xs', 'sm', 'default', 'lg', 'icon'] as const
    
    sizes.forEach(size => {
      const { rerender } = render(<Button size={size}>Test</Button>)
      const button = screen.getByRole('button')
      
      // Verifica se a classe de altura está aplicada
      expect(button).toHaveClass(expect.stringMatching(/h-8|h-9|h-10|h-11/))
      
      rerender(<div />)
    })
  })

  it('should handle click events when not loading', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should not handle click events when loading', () => {
    const handleClick = jest.fn()
    render(<Button loading onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should render custom loading icon', () => {
    const CustomIcon = <div data-testid="custom-icon">Loading...</div>
    render(
      <Button loading loadingIcon={CustomIcon}>
        Save
      </Button>
    )
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toBeDisabled()
  })
})
