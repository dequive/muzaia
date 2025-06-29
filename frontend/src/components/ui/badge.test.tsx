import { render, screen, fireEvent } from '@testing-library/react'
import { Badge } from './badge'
import { Star, X } from 'lucide-react'

describe('Badge Component', () => {
  it('should render with default variant and size', () => {
    render(<Badge>Test Badge</Badge>)
    const badge = screen.getByText('Test Badge')
    
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-primary', 'px-2.5', 'py-0.5', 'text-xs')
  })

  it('should apply custom className correctly', () => {
    render(<Badge className="custom-class">Test</Badge>)
    const badge = screen.getByText('Test')
    
    expect(badge).toHaveClass('custom-class')
  })

  it('should handle all variant styles', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info'] as const
    
    variants.forEach(variant => {
      const { rerender } = render(<Badge variant={variant}>Test</Badge>)
      const badge = screen.getByText('Test')
      
      expect(badge).toHaveClass(expect.stringMatching(/bg-|border/))
      
      rerender(<div />)
    })
  })

  it('should handle all size variants', () => {
    const sizes = ['sm', 'default', 'lg'] as const
    
    sizes.forEach(size => {
      const { rerender } = render(<Badge size={size}>Test</Badge>)
      const badge = screen.getByText('Test')
      
      expect(badge).toHaveClass(expect.stringMatching(/px-2|px-2.5|px-3/))
      
      rerender(<div />)
    })
  })

  it('should render with icon', () => {
    render(
      <Badge icon={<Star data-testid="star-icon" />}>
        Premium
      </Badge>
    )
    
    expect(screen.getByTestId('star-icon')).toBeInTheDocument()
    expect(screen.getByText('Premium')).toBeInTheDocument()
  })

  it('should be removable when removable prop is true', () => {
    const handleRemove = jest.fn()
    render(
      <Badge removable onRemove={handleRemove}>
        Removable Tag
      </Badge>
    )
    
    const removeButton = screen.getByRole('button', { name: /remove/i })
    expect(removeButton).toBeInTheDocument()
    
    fireEvent.click(removeButton)
    expect(handleRemove).toHaveBeenCalledTimes(1)
  })

  it('should render custom remove icon', () => {
    const CustomRemoveIcon = <span data-testid="custom-remove">×</span>
    render(
      <Badge 
        removable 
        onRemove={() => {}} 
        removeIcon={CustomRemoveIcon}
      >
        Test
      </Badge>
    )
    
    expect(screen.getByTestId('custom-remove')).toBeInTheDocument()
  })

  it('should be interactive when interactive prop is true', () => {
    render(<Badge interactive>Interactive Badge</Badge>)
    const badge = screen.getByText('Interactive Badge')
    
    expect(badge).toHaveClass('cursor-pointer')
  })

  it('should handle click events when onClick is provided', () => {
    const handleClick = jest.fn()
    render(<Badge onClick={handleClick}>Clickable</Badge>)
    
    const badge = screen.getByRole('button')
    fireEvent.click(badge)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should handle keyboard events for clickable badges', () => {
    const handleClick = jest.fn()
    render(<Badge onClick={handleClick}>Clickable</Badge>)
    
    const badge = screen.getByRole('button')
    
    fireEvent.keyDown(badge, { key: 'Enter' })
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    fireEvent.keyDown(badge, { key: ' ' })
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('should stop propagation when remove button is clicked', () => {
    const handleClick = jest.fn()
    const handleRemove = jest.fn()
    
    render(
      <Badge onClick={handleClick} removable onRemove={handleRemove}>
        Test
      </Badge>
    )
    
    const removeButton = screen.getByRole('button', { name: /remove/i })
    fireEvent.click(removeButton)
    
    expect(handleRemove).toHaveBeenCalledTimes(1)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should have proper accessibility attributes', () => {
    render(<Badge onClick={() => {}}>Accessible</Badge>)
    const badge = screen.getByRole('button')
    
    expect(badge).toHaveAttribute('tabIndex', '0')
    expect(badge).toHaveAttribute('role', 'button')
  })

  it('should use custom remove aria label', () => {
    render(
      <Badge removable onRemove={() => {}} removeAriaLabel="Delete tag">
        Test
      </Badge>
    )
    
    const removeButton = screen.getByRole('button', { name: 'Delete tag' })
    expect(removeButton).toBeInTheDocument()
  })

  it('should not be clickable when only removable', () => {
    render(
      <Badge removable onRemove={() => {}}>
        Test
      </Badge>
    )
    
    const badge = screen.getByText('Test').parentElement
    expect(badge).not.toHaveAttribute('role', 'button')
  })
})
