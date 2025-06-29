import type { Meta, StoryObj } from '@storybook/react'
import { Switch } from './switch'
import { useState } from 'react'
import { Bell, BellOff, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react'

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente Switch flexível para alternar entre estados on/off.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success', 'warning'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    labelPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const WithLabel: Story = {
  args: {
    label: 'Enable notifications',
  },
}

export const WithDescription: Story = {
  args: {
    label: 'Email notifications',
    description: 'Receive emails about account activity',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <Switch size="sm" label="Small" />
      <Switch size="default" label="Default" />
      <Switch size="lg" label="Large" />
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch variant="default" label="Default" defaultChecked />
      <Switch variant="success" label="Success" defaultChecked />
      <Switch variant="warning" label="Warning" defaultChecked />
      <Switch variant="destructive" label="Destructive" defaultChecked />
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch showIcons label="Default icons" defaultChecked />
      <Switch 
        showIcons
        size="lg"
        label="Custom icons"
        checkedIcon={<Volume2 className="h-4 w-4" />}
        uncheckedIcon={<VolumeX className="h-4 w-4" />}
        defaultChecked
      />
    </div>
  ),
}

export const Loading: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch loading label="Processing..." />
      <Switch loading size="lg" label="Large loading" />
    </div>
  ),
}

export const LabelPositions: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch 
        label="Label on right" 
        description="This is the default position"
        labelPosition="right"
      />
      <Switch 
        label="Label on left" 
        description="Label appears on the left side"
        labelPosition="left"
      />
    </div>
  ),
}

export const Interactive: Story = {
  render: () => {
    const [notifications, setNotifications] = useState(true)
    const [sound, setSound] = useState(false)
    const [wifi, setWifi] = useState(true)
    
    return (
      <div className="space-y-6 w-80">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Settings</h3>
          
          <Switch
            checked={notifications}
            onCheckedChange={setNotifications}
            label="Push notifications"
            description="Receive push notifications on your device"
            showIcons
            checkedIcon={<Bell className="h-3 w-3" />}
            uncheckedIcon={<BellOff className="h-3 w-3" />}
          />
          
          <Switch
            checked={sound}
            onCheckedChange={setSound}
            label="Sound effects"
            description="Play sounds for interactions"
            variant="success"
            showIcons
            checkedIcon={<Volume2 className="h-3 w-3" />}
            uncheckedIcon={<VolumeX className="h-3 w-3" />}
          />
          
          <Switch
            checked={wifi}
            onCheckedChange={setWifi}
            label="Wi-Fi"
            description="Connect to available networks"
            size="lg"
            showIcons
            checkedIcon={<Wifi className="h-4 w-4" />}
            uncheckedIcon={<WifiOff className="h-4 w-4" />}
          />
        </div>
      </div>
    )
  },
}

export const FormIntegration: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      securityAlerts: true,
    })
    
    const updateSetting = (key: keyof typeof formData) => (checked: boolean) => {
      setFormData(prev => ({ ...prev, [key]: checked }))
    }
    
    return (
      <div className="space-y-6 w-96">
        <h3 className="text-lg font-semibold">Notification Preferences</h3>
        
        <div className="space-y-4">
          <Switch
            checked={formData.emailNotifications}
            onCheckedChange={updateSetting('emailNotifications')}
            label="Email notifications"
            description="Receive important updates via email"
          />
          
          <Switch
            checked={formData.smsNotifications}
            onCheckedChange={updateSetting('smsNotifications')}
            label="SMS notifications"
            description="Get urgent alerts via text message"
            variant="warning"
          />
          
          <Switch
            checked={formData.marketingEmails}
            onCheckedChange={updateSetting('marketingEmails')}
            label="Marketing emails"
            description="Receive newsletters and promotional content"
          />
          
          <Switch
            checked={formData.securityAlerts}
            onCheckedChange={updateSetting('securityAlerts')}
            label="Security alerts"
            description="Critical security notifications (recommended)"
            variant="destructive"
            disabled={formData.securityAlerts} // Force enabled for security
          />
        </div>
        
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Current Settings:</h4>
          <pre className="text-sm bg-muted p-2 rounded">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </div>
    )
  },
}

export const DisabledStates: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch disabled label="Disabled (unchecked)" />
      <Switch disabled defaultChecked label="Disabled (checked)" />
      <Switch loading label="Loading state" />
    </div>
  ),
}
