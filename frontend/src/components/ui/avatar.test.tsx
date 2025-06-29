import { render, screen, fireEvent } from '@testing-library/react'
import { 
  Avatar, 
  AvatarImage, 
  AvatarFallback, 
  AvatarGroup,
  UserAvatar,
  generateInitials,
  generateColorFromName
} from './avatar'
import { User, Crown } from 'lucide-react'

describe('Avatar Component', () => {
  it('should render with default props', () => {
    render(
      <Avatar>
        <AvatarImage src="/test.jpg" alt="Test" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    
    const avatar = screen.getByRole('img', { hidden: true })
    expect(avatar).toBeInTheDocument()
  })

  it('should apply custom className correctly', () => {
    render(
      <Avatar className="custom-avatar">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    
    const avatar = document.querySelector('.custom-avatar')
    expect(avatar).toBeInTheDocument()
  })

  it('should handle all size variants', () => {
    const sizes = ['xs', 'sm', 'default', 'lg', 'xl', '2xl', '3xl'] as const
    
    sizes.forEach(size => {
      const { rerender } = render(
        <Avatar size={size}>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )
      
      const avatar = document.querySelector('[class*="h-"]')
      expect(avatar).toBeInTheDocument()
      
      rerender(<div />)
    })
  })

  it('should handle all shape variants', () => {
    const shapes = ['circle', 'rounded', 'square'] as const
    
    shapes.forEach(shape => {
      const { rerender } = render(
        <Avatar shape={shape}>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )
      
      const avatar = document.querySelector('[class*="rounded"]')
      expect(avatar).toBeInTheDocument()
      
      rerender(<div />)
    })
  })

  it('should handle all variant styles', () => {
    const variants = ['default', 'outline', 'ghost'] as const
    
    variants.forEach(variant => {
      const { rerender } = render(
        <Avatar variant={variant}>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )
      
      expect(document.querySelector('[class*="relative"]')).toBeInTheDocument()
      
      rerender(<div />)
    })
  })

  it('should show status indicator', () => {
    render(
      <Avatar status="online">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    
    const statusIndicator = document.querySelector('.bg-green-500')
    expect(statusIndicator).toBeInTheDocument()
  })

  it('should show badge', () => {
    render(
      <Avatar badge={<Crown data-testid="crown-badge" />}>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    
    expect(screen.getByTestId('crown-badge')).toBeInTheDocument()
  })

  it('should handle click when clickable', () => {
    const handleClick = jest.fn()
    
    render(
      <Avatar clickable onClick={handleClick}>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    
    const avatar = document.querySelector('.cursor-pointer')
    expect(avatar).toBeInTheDocument()
    
    if (avatar) {
      fireEvent.click(avatar)
      expect(handleClick).toHaveBeenCalledTimes(1)
    }
  })

  it('should show loading state', () => {
    render(
      <Avatar loading>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    
    const loadingSpinner = document.querySelector('.animate-spin')
    expect(loadingSpinner).toBeInTheDocument()
  })

  it('should show tooltip on hover', () => {
    render(
      <Avatar tooltip="John Doe">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    
    const avatar = document.querySelector('[class*="relative"]')
    if (avatar) {
      fireEvent.mouseEnter(avatar)
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      
      fireEvent.mouseLeave(avatar)
    }
  })

  describe('AvatarImage', () => {
    it('should render image with correct props', () => {
      render(
        <Avatar>
          <AvatarImage src="/test.jpg" alt="Test User" />
          <AvatarFallback>TU</AvatarFallback>
        </Avatar>
      )
      
      const image = screen.getByAltText('Test User')
      expect(image).toHaveAttribute('src', '/test.jpg')
    })

    it('should handle error callback', () => {
      const handleError = jest.fn()
      
      render(
        <Avatar>
          <AvatarImage src="/invalid.jpg" alt="Test" onError={handleError} />
          <AvatarFallback>TU</AvatarFallback>
        </Avatar>
      )
      
      const image = screen.getByAltText('Test')
      fireEvent.error(image)
      
      expect(handleError).toHaveBeenCalledTimes(1)
    })

    it('should handle load callback', () => {
      const handleLoad = jest.fn()
      
      render(
        <Avatar>
          <AvatarImage src="/test.jpg" alt="Test" onLoad={handleLoad} />
          <AvatarFallback>TU</AvatarFallback>
        </Avatar>
      )
      
      const image = screen.getByAltText('Test')
      fireEvent.load(image)
      
      expect(handleLoad).toHaveBeenCalledTimes(1)
    })
  })

  describe('AvatarFallback', () => {
    it('should render fallback text', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )
      
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('should generate initials automatically', () => {
      render(
        <Avatar>
          <AvatarFallback autoInitials name="John Doe" />
        </Avatar>
      )
      
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('should render with icon', () => {
      render(
        <Avatar>
          <AvatarFallback icon={<User data-testid="user-icon" />} />
        </Avatar>
      )
      
      expect(screen.getByTestId('user-icon')).toBeInTheDocument()
    })

    it('should render default user icon', () => {
      render(
        <Avatar>
          <AvatarFallback defaultIcon />
        </Avatar>
      )
      
      const userIcon = document.querySelector('svg')
      expect(userIcon).toBeInTheDocument()
    })

    it('should handle all fallback variants', () => {
      const variants = ['default', 'primary', 'secondary', 'success', 'warning', 'destructive', 'gradient'] as const
      
      variants.forEach(variant => {
        const { rerender } = render(
          <Avatar>
            <AvatarFallback variant={variant}>JD</AvatarFallback>
          </Avatar>
        )
        
        expect(screen.getByText('JD')).toBeInTheDocument()
        
        rerender(<div />)
      })
    })
  })

  describe('AvatarGroup', () => {
    it('should render multiple avatars', () => {
      render(
        <AvatarGroup>
          <Avatar><AvatarFallback>A</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>B</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>C</AvatarFallback></Avatar>
        </AvatarGroup>
      )
      
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
      expect(screen.getByText('C')).toBeInTheDocument()
    })

    it('should show excess count when max is exceeded', () => {
      render(
        <AvatarGroup max={2}>
          <Avatar><AvatarFallback>A</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>B</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>C</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>D</AvatarFallback></Avatar>
        </AvatarGroup>
      )
      
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
      expect(screen.getByText('+2')).toBeInTheDocument()
      expect(screen.queryByText('C')).not.toBeInTheDocument()
    })

    it('should handle excess click', () => {
      const handleExcessClick = jest.fn()
      
      render(
        <AvatarGroup max={1} onExcessClick={handleExcessClick}>
          <Avatar><AvatarFallback>A</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>B</AvatarFallback></Avatar>
        </AvatarGroup>
      )
      
      const excessAvatar = screen.getByText('+1').closest('[class*="cursor-pointer"]')
      if (excessAvatar) {
        fireEvent.click(excessAvatar)
        expect(handleExcessClick).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('UserAvatar', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '/john.jpg',
      status: 'online' as const,
      role: 'admin' as const,
    }

    it('should render user avatar with all props', () => {
      render(
        <UserAvatar 
          user={mockUser} 
          showStatus 
          showRole 
        />
      )
      
      expect(screen.getByAltText('John Doe')).toBeInTheDocument()
      
      // Should show status (green dot)
      const statusIndicator = document.querySelector('.bg-green-500')
      expect(statusIndicator).toBeInTheDocument()
      
      // Should show role badge (crown)
      const roleBadge = document.querySelector('svg')
      expect(roleBadge).toBeInTheDocument()
    })

    it('should generate fallback initials from name', () => {
      const userWithoutAvatar = { ...mockUser, avatar: undefined }
      
      render(<UserAvatar user={userWithoutAvatar} />)
      
      expect(screen.getByText('JD')).toBeInTheDocument()
    })
  })

  describe('Utility Functions', () => {
    describe('generateInitials', () => {
      it('should generate initials from single name', () => {
        expect(generateInitials('John')).toBe('J')
      })

      it('should generate initials from full name', () => {
        expect(generateInitials('John Doe')).toBe('JD')
      })

      it('should handle multiple names', () => {
        expect(generateInitials('John Michael Doe')).toBe('JM')
      })

      it('should handle empty string', () => {
        expect(generateInitials('')).toBe('')
      })

      it('should handle whitespace', () => {
        expect(generateInitials('  John   Doe  ')).toBe('JD')
      })
    })

    describe('generateColorFromName', () => {
      it('should generate consistent colors for same name', () => {
        const color1 = generateColorFromName('John Doe')
        const color2 = generateColorFromName('John Doe')
        expect(color1).toBe(color2)
      })

      it('should generate different colors for different names', () => {
        const color1 = generateColorFromName('John Doe')
        const color2 = generateColorFromName('Jane Smith')
        expect(color1).not.toBe(color2)
      })

      it('should handle empty string', () => {
        expect(generateColorFromName('')).toBe('bg-muted')
      })
    })
  })

  it('should have proper accessibility attributes', () => {
    render(
      <Avatar>
        <AvatarImage src="/test.jpg" alt="User avatar" />
        <AvatarFallback>UA</AvatarFallback>
      </Avatar>
    )
    
    const image = screen.getByAltText('User avatar')
    expect(image).toHaveAttribute('alt', 'User avatar')
  })
})
