import type { Meta, StoryObj } from '@storybook/react'
import { Progress } from './progress'
import { useState, useEffect } from 'react'

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente de progresso flexível com suporte a múltiplas variantes e funcionalidades.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    labelPosition: {
      control: 'select',
      options: ['top', 'bottom', 'inside'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 50,
  },
}

export const WithValue: Story = {
  args: {
    value: 75,
    showValue: true,
  },
}

export const Variants: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Progress value={60} variant="default" showValue label="Default" />
      <Progress value={80} variant="success" showValue label="Success" />
      <Progress value={45} variant="warning" showValue label="Warning" />
      <Progress value={30} variant="destructive" showValue label="Error" />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Progress value={60} size="sm" showValue label="Small" />
      <Progress value={60} size="default" showValue label="Default" />
      <Progress value={60} size="lg" showValue label="Large" />
    </div>
  ),
}

export const LabelPositions: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <Progress 
        value={65} 
        showValue 
        label="Top Label" 
        labelPosition="top" 
      />
      <Progress 
        value={65} 
        showValue 
        label="Bottom Label" 
        labelPosition="bottom" 
      />
      <Progress 
        value={65} 
        showValue 
        label="Inside Label" 
        labelPosition="inside" 
        size="lg"
      />
    </div>
  ),
}

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    label: "Loading...",
  },
}

export const Animated: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Progress value={60} animated showValue label="Animated Progress" />
      <Progress indeterminate label="Indeterminate Loading" />
    </div>
  ),
}

export const CustomFormatting: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Progress 
        value={750} 
        showValue 
        formatValue={(val) => `${val}/1000 MB`}
        label="Download Progress"
      />
      <Progress 
        value={3} 
        showValue 
        formatValue={(val) => `Step ${val} of 5`}
        label="Installation"
        variant="success"
      />
    </div>
  ),
}

export const Interactive: Story = {
  render: () => {
    const [progress, setProgress] = useState(0)
    
    useEffect(() => {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) return 0
          return prev + 1
        })
      }, 100)
      
      return () => clearInterval(timer)
    }, [])
    
    return (
      <div className="w-80">
        <Progress 
          value={progress} 
          showValue 
          label="Auto Progress"
          variant={progress === 100 ? "success" : "default"}
        />
      </div>
    )
  },
}

export const FileUpload: Story = {
  render: () => {
    const [uploaded, setUploaded] = useState(0)
    const total = 1024
    
    useEffect(() => {
      const timer = setInterval(() => {
        setUploaded(prev => {
          if (prev >= total) return 0
          return prev + Math.random() * 50
        })
      }, 200)
      
      return () => clearInterval(timer)
    }, [])
    
    const percentage = (uploaded / total) * 100
    
    return (
      <div className="w-80">
        <Progress 
          value={percentage}
          showValue
          formatValue={() => `${Math.round(uploaded)} / ${total} MB`}
          label="File Upload"
          variant={percentage === 100 ? "success" : "default"}
          labelPosition="top"
        />
      </div>
    )
  },
}
