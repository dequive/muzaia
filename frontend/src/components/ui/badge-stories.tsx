import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'
import { Star, Crown, Shield, AlertTriangle } from 'lucide-react'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Badge',
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="default">Default</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge icon={<Star className="h-3 w-3" />}>Premium</Badge>
      <Badge icon={<Crown className="h-3 w-3" />} variant="warning">VIP</Badge>
      <Badge icon={<Shield className="h-3 w-3" />} variant="success">Verified</Badge>
      <Badge icon={<AlertTriangle className="h-3 w-3" />} variant="destructive">Alert</Badge>
    </div>
  ),
}

export const Removable: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge removable onRemove={() => alert('Removed!')}>
        Removable Tag
      </Badge>
      <Badge 
        removable 
        onRemove={() => alert('Removed!')} 
        variant="secondary"
      >
        Another Tag
      </Badge>
    </div>
  ),
}

export const Interactive: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge interactive onClick={() => alert('Clicked!')}>
        Clickable
      </Badge>
      <Badge 
        interactive 
        onClick={() => alert('Clicked!')}
        variant="outline"
      >
        Interactive
      </Badge>
    </div>
  ),
}

export const Complex: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge 
        icon={<Star className="h-3 w-3" />}
        removable
        onRemove={() => alert('Removed!')}
        variant="success"
        size="lg"
      >
        Premium Feature
      </Badge>
      <Badge 
        icon={<Crown className="h-3 w-3" />}
        interactive
        onClick={() => alert('Clicked!')}
        variant="warning"
      >
        VIP Status
      </Badge>
    </div>
  ),
}
