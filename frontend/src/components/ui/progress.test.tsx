import { render, screen } from '@testing-library/react'
import { Progress } from './progress'

describe('Progress Component', () => {
  it('should render with default props', () => {
    render(<Progress value={50} />)
    const progress = screen.getByRole('progressbar')
    
    expect(progress).toBeInTheDocument()
    expect(progress).toHaveAttribute('aria-valuenow', '50')
    expect(progress).toHaveClass('h-4')
  })

  it('should apply custom className correctly', () => {
    render(<Progress value={30} className="custom-class" />)
    const progress = screen.getByRole('progressbar')
    
    expect(progress).toHaveClass('custom-class')
  })

  it('should handle all size variants', () => {
    const sizes = ['sm', 'default', 'lg'] as const
    
    sizes.forEach(size => {
      const { rerender } = render(<Progress value={50} size={size} />)
      const progress = screen.getByRole('progressbar')
      
      const expectedClass = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-6' : 'h-4'
      expect(progress).toHaveClass(expectedClass)
      
      rerender(<div />)
    })
  })

  it('should display value when showValue is true', () => {
    render(<Progress value={75} showValue />)
    
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('should display custom label', () => {
    render(<Progress value={60} label="Loading files..." />)
    
    expect(screen.getByText('Loading files...')).toBeInTheDocument()
  })

  it('should format value with custom formatter', () => {
    const formatValue = (value: number) => `${value}/100`
    render(<Progress value={45} showValue formatValue={formatValue} />)
    
    expect(screen.getByText('45/100')).toBeInTheDocument()
  })

  it('should show label in different positions', () => {
    const positions = ['top', 'bottom', 'inside'] as const
    
    positions.forEach(position => {
      const { rerender } = render(
        <Progress 
          value={50} 
          showValue 
          labelPosition={position}
          label="Test"
        />
      )
      
      expect(screen.getByText('Test')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
      
      rerender(<div />)
    })
  })

  it('should handle indeterminate state', () => {
    render(<Progress indeterminate />)
    const progress = screen.getByRole('progressbar')
    
    expect(progress).not.toHaveAttribute('aria-valuenow')
  })

  it('should clamp values between 0 and 100', () => {
    const { rerender } = render(<Progress value={150} />)
    let progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '100')
    
    rerender(<Progress value={-10} />)
    progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '0')
  })

  it('should handle all variant styles', () => {
    const variants = ['default', 'success', 'warning', 'destructive'] as const
    
    variants.forEach(variant => {
      const { rerender } = render(<Progress value={50} variant={variant} />)
      const progress = screen.getByRole('progressbar')
      
      expect(progress).toBeInTheDocument()
      
      rerender(<div />)
    })
  })

  it('should apply custom indicator color', () => {
    render(<Progress value={50} indicatorColor="#ff0000" />)
    const progress = screen.getByRole('progressbar')
    
    expect(progress).toBeInTheDocument()
  })

  it('should apply custom indicator className', () => {
    render(<Progress value={50} indicatorClassName="custom-indicator" />)
    const progress = screen.getByRole('progressbar')
    
    expect(progress).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<Progress value={75} />)
    const progress = screen.getByRole('progressbar')
    
    expect(progress).toHaveAttribute('aria-valuenow', '75')
    expect(progress).toHaveAttribute('aria-valuemin', '0')
    expect(progress).toHaveAttribute('aria-valuemax', '100')
  })

  it('should not show inside label for small size', () => {
    render(
      <Progress 
        value={50} 
        size="sm" 
        labelPosition="inside" 
        showValue 
      />
    )
    
    // Inside label should not be visible for small size
    const progressContainer = screen.getByRole('progressbar').parentElement
    expect(progressContainer?.querySelector('.absolute')).not.toBeInTheDocument()
  })

  it('should handle animated prop', () => {
    render(<Progress value={50} animated />)
    const progress = screen.getByRole('progressbar')
    
    expect(progress).toBeInTheDocument()
  })
})
