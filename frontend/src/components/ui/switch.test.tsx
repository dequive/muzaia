import { render, screen, fireEvent } from '@testing-library/react'
import { Switch } from './switch'
import { Check, X } from 'lucide-react'

describe('Switch Component', () => {
  it('should render with default props', () => {
    render(<Switch />)
    const switchElement = screen.getByRole('switch')
    
    expect(switchElement).toBeInTheDocument()
    expect(switchElement).toHaveClass('h-6', 'w-11')
  })

  it('should apply custom className correctly', () => {
    render(<Switch className="custom-class" />)
    const switchElement = screen.getByRole('switch')
    
    expect(switchElement).toHaveClass('custom-class')
  })

  it('should handle all size variants', () => {
    const sizes = ['sm', 'default', 'lg'] as const
    
    sizes.forEach(size => {
      const { rerender } = render(<Switch size={size} />)
      const switchElement = screen.getByRole('switch')
      
      const expectedClasses = {
        sm: ['h-4', 'w-7'],
        default: ['h-6', 'w-11'],
        lg: ['h-8', 'w-14']
      }
      
      expectedClasses[size].forEach(className => {
        expect(switchElement).toHaveClass(className)
      })
      
      rerender(<div />)
    })
  })

  it('should handle all variant styles', () => {
    const variants = ['default', 'destructive', 'success', 'warning'] as const
    
    variants.forEach(variant => {
      const { rerender } = render(<Switch variant={variant} />)
      const switchElement = screen.getByRole('switch')
      
      expect(switchElement).toBeInTheDocument()
      
      rerender(<div />)
    })
  })

  it('should render with label', () => {
    render(<Switch label="Enable notifications" />)
    
    expect(screen.getByText('Enable notifications')).toBeInTheDocument()
    expect(screen.getByLabelText('Enable notifications')).toBeInTheDocument()
  })

  it('should render with description', () => {
    render(
      <Switch 
        label="Notifications" 
        description="Receive email notifications"
      />
    )
    
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Receive email notifications')).toBeInTheDocument()
  })

  it('should handle checked state', () => {
    render(<Switch checked />)
    const switchElement = screen.getByRole('switch')
    
    expect(switchElement).toBeChecked()
  })

  it('should call onCheckedChange when clicked', () => {
    const handleChange = jest.fn()
    render(<Switch onCheckedChange={handleChange} />)
    
    const switchElement = screen.getByRole('switch')
    fireEvent.click(switchElement)
    
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('should call onCheckedChange when label is clicked', () => {
    const handleChange = jest.fn()
    render(
      <Switch 
        label="Test label" 
        onCheckedChange={handleChange}
        checked={false}
      />
    )
    
    const label = screen.getByText('Test label')
    fireEvent.click(label)
    
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('should not call onCheckedChange when label is not clickable', () => {
    const handleChange = jest.fn()
    render(
      <Switch 
        label="Test label" 
        onCheckedChange={handleChange}
        labelClickable={false}
        checked={false}
      />
    )
    
    const label = screen.getByText('Test label')
    fireEvent.click(label)
    
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('should show icons when showIcons is true', () => {
    render(<Switch showIcons checked />)
    const switchElement = screen.getByRole('switch')
    
    expect(switchElement.querySelector('svg')).toBeInTheDocument()
  })

  it('should render custom icons', () => {
    const CustomCheck = <div data-testid="custom-check">✓</div>
    const CustomX = <div data-testid="custom-x">✗</div>
    
    const { rerender } = render(
      <Switch 
        showIcons 
        checked 
        checkedIcon={CustomCheck}
        uncheckedIcon={CustomX}
      />
    )
    
    expect(screen.getByTestId('custom-check')).toBeInTheDocument()
    
    rerender(
      <Switch 
        showIcons 
        checked={false}
        checkedIcon={CustomCheck}
        uncheckedIcon={CustomX}
      />
    )
    
    expect(screen.getByTestId('custom-x')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<Switch loading />)
    const switchElement = screen.getByRole('switch')
    
    expect(switchElement).toBeDisabled()
    expect(switchElement.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Switch disabled />)
    const switchElement = screen.getByRole('switch')
    
    expect(switchElement).toBeDisabled()
  })

  it('should not call onChange when disabled', () => {
    const handleChange = jest.fn()
    render(<Switch disabled onCheckedChange={handleChange} />)
    
    const switchElement = screen.getByRole('switch')
    fireEvent.click(switchElement)
    
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('should not call onChange when loading', () => {
    const handleChange = jest.fn()
    render(<Switch loading onCheckedChange={handleChange} />)
    
    const switchElement = screen.getByRole('switch')
    fireEvent.click(switchElement)
    
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('should handle label position', () => {
    const { rerender } = render(
      <Switch label="Test" labelPosition="left" />
    )
    
    const container = screen.getByText('Test').parentElement?.parentElement
    expect(container).toHaveClass('flex-row-reverse')
    
    rerender(<Switch label="Test" labelPosition="right" />)
    
    expect(container).not.toHaveClass('flex-row-reverse')
  })

  it('should apply custom container className', () => {
    render(
      <Switch 
        label="Test" 
        containerClassName="custom-container"
      />
    )
    
    const container = screen.getByText('Test').parentElement?.parentElement
    expect(container).toHaveClass('custom-container')
  })

  it('should apply custom label className', () => {
    render(
      <Switch 
        label="Test" 
        labelClassName="custom-label"
      />
    )
    
    const label = screen.getByText('Test')
    expect(label).toHaveClass('custom-label')
  })

  it('should apply custom description className', () => {
    render(
      <Switch 
        label="Test"
        description="Description" 
        descriptionClassName="custom-description"
      />
    )
    
    const description = screen.getByText('Description')
    expect(description).toHaveClass('custom-description')
  })

  it('should generate unique ID when not provided', () => {
    render(<Switch label="Test 1" />)
    render(<Switch label="Test 2" />)
    
    const switches = screen.getAllByRole('switch')
    expect(switches[0]).toHaveAttribute('id')
    expect(switches[1]).toHaveAttribute('id')
    expect(switches[0].id).not.toBe(switches[1].id)
  })

  it('should use provided ID', () => {
    render(<Switch id="custom-id" label="Test" />)
    
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('id', 'custom-id')
  })

  it('should have proper accessibility attributes', () => {
    render(<Switch label="Test switch" />)
    
    const switchElement = screen.getByRole('switch')
    const label = screen.getByText('Test switch')
    
    expect(switchElement).toHaveAttribute('id')
    expect(label).toHaveAttribute('for', switchElement.id)
  })
})
