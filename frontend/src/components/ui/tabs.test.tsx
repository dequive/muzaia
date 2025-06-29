import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
import { Mail, Settings, X } from 'lucide-react'

describe('Tabs Component', () => {
  const BasicTabs = () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
    </Tabs>
  )

  it('should render with default props', () => {
    render(<BasicTabs />)
    
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument()
    expect(screen.getByText('Content 1')).toBeInTheDocument()
  })

  it('should switch tabs when clicked', () => {
    render(<BasicTabs />)
    
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
    
    fireEvent.click(screen.getByRole('tab', { name: 'Tab 2' }))
    
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
  })

  it('should handle all TabsList variants', () => {
    const variants = ['default', 'underline', 'pills', 'contained', 'minimal'] as const
    
    variants.forEach(variant => {
      const { rerender } = render(
        <Tabs defaultValue="tab1">
          <TabsList variant={variant}>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      
      expect(screen.getByRole('tab')).toBeInTheDocument()
      
      rerender(<div />)
    })
  })

  it('should handle all TabsList sizes', () => {
    const sizes = ['sm', 'default', 'lg'] as const
    
    sizes.forEach(size => {
      const { rerender } = render(
        <Tabs defaultValue="tab1">
          <TabsList size={size}>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      
      expect(screen.getByRole('tab')).toBeInTheDocument()
      
      rerender(<div />)
    })
  })

  it('should render with icon', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" icon={<Mail data-testid="mail-icon" />}>
            Mail
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )
    
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument()
    expect(screen.getByText('Mail')).toBeInTheDocument()
  })

  it('should render with badge', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" badge={5}>
            Inbox
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )
    
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Inbox')).toBeInTheDocument()
  })

  it('should handle closable tabs', () => {
    const handleClose = jest.fn()
    
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" closable onClose={handleClose}>
            Closable Tab
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )
    
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)
    
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('should show loading state', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" loading>
            Loading Tab
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )
    
    expect(screen.getByText('Loading Tab')).toBeInTheDocument()
    // Loading spinner should be present
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should show tooltip on hover', async () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" tooltip="This is a tooltip">
            Tab with tooltip
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )
    
    const tab = screen.getByRole('tab')
    fireEvent.mouseEnter(tab)
    
    await waitFor(() => {
      expect(screen.getByText('This is a tooltip')).toBeInTheDocument()
    })
    
    fireEvent.mouseLeave(tab)
  })

  it('should handle disabled state', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" disabled>
            Disabled Tab
          </TabsTrigger>
          <TabsTrigger value="tab2">Active Tab</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    
    const disabledTab = screen.getByRole('tab', { name: 'Disabled Tab' })
    expect(disabledTab).toBeDisabled()
  })

  it('should handle fullWidth prop', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList fullWidth>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    
    const tabsList = screen.getByRole('tablist')
    expect(tabsList).toHaveClass('w-full')
  })

  it('should handle lazy loading', async () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2" lazy>
          Lazy Content 2
        </TabsContent>
      </Tabs>
    )
    
    // Lazy content should not be rendered initially
    expect(screen.queryByText('Lazy Content 2')).not.toBeInTheDocument()
    
    // Switch to lazy tab
    fireEvent.click(screen.getByRole('tab', { name: 'Tab 2' }))
    
    // Content should now be rendered
    await waitFor(() => {
      expect(screen.getByText('Lazy Content 2')).toBeInTheDocument()
    })
  })

  it('should handle padded content', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" padded>
          Padded Content
        </TabsContent>
      </Tabs>
    )
    
    const content = screen.getByText('Padded Content').parentElement
    expect(content).toHaveClass('p-4')
  })

  it('should handle animated content', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" animated>
          Animated Content
        </TabsContent>
      </Tabs>
    )
    
    const content = screen.getByText('Animated Content').parentElement
    expect(content).toHaveClass('transition-all')
  })

  it('should apply custom classes', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-list">
          <TabsTrigger 
            value="tab1" 
            className="custom-trigger"
            iconClassName="custom-icon"
            badgeClassName="custom-badge"
            icon={<Settings data-testid="settings-icon" />}
            badge="new"
          >
            Custom Tab
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content">
          Custom Content
        </TabsContent>
      </Tabs>
    )
    
    expect(screen.getByRole('tablist')).toHaveClass('custom-list')
    expect(screen.getByRole('tab')).toHaveClass('custom-trigger')
    expect(screen.getByText('Custom Content').parentElement).toHaveClass('custom-content')
  })

  it('should handle complex tab with all features', () => {
    const handleClose = jest.fn()
    
    render(
      <Tabs defaultValue="complex">
        <TabsList variant="pills" size="lg">
          <TabsTrigger
            value="complex"
            icon={<Mail className="w-4 h-4" />}
            badge={3}
            closable
            onClose={handleClose}
            tooltip="Complex tab with all features"
          >
            Complex Tab
          </TabsTrigger>
        </TabsList>
        <TabsContent value="complex" padded animated>
          Complex content with padding and animation
        </TabsContent>
      </Tabs>
    )
    
    expect(screen.getByText('Complex Tab')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Complex content with padding and animation')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<BasicTabs />)
    
    const tablist = screen.getByRole('tablist')
    const tabs = screen.getAllByRole('tab')
    const tabpanel = screen.getByRole('tabpanel')
    
    expect(tablist).toBeInTheDocument()
    expect(tabs).toHaveLength(2)
    expect(tabpanel).toBeInTheDocument()
    
    // Check ARIA attributes
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
  })
})
