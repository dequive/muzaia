# Switch Component - Exemplos de Uso

## Básico
```tsx
import { Switch } from '@/components/ui/switch'

// Switch simples
<Switch />

// Switch com label
<Switch label="Enable notifications" />

// Switch controlado
const [enabled, setEnabled] = useState(false)
<Switch checked={enabled} onCheckedChange={setEnabled} />
```

## Variantes e Tamanhos
```tsx
// Diferentes tamanhos
<Switch size="sm" label="Small" />
<Switch size="default" label="Default" />
<Switch size="lg" label="Large" />

// Diferentes variantes
<Switch variant="default" label="Default" />
<Switch variant="success" label="Success" />
<Switch variant="warning" label="Warning" />
<Switch variant="destructive" label="Destructive" />
```

## Com Ícones
```tsx
import { Volume2, VolumeX, Bell, BellOff } from 'lucide-react'

// Ícones padrão
<Switch showIcons label="Default icons" />

// Ícones customizados
<Switch 
  showIcons
  checkedIcon={<Volume2 className="h-3 w-3" />}
  uncheckedIcon={<VolumeX className="h-3 w-3" />}
  label="Sound effects"
/>
```

## Estados e Funcionalidades
```tsx
// Com descrição
<Switch 
  label="Email notifications"
  description="Receive updates about your account"
/>

// Estado de loading
<Switch loading label="Processing..." />

// Posição do label
<Switch labelPosition="left" label="Label on left" />

// Label não clicável
<Switch labelClickable={false} label="Non-clickable label" />
```

## Casos de Uso Práticos

### Configurações de Usuário
```tsx
const UserSettings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: false,
    darkMode: true,
  })
  
  const updateSetting = (key: keyof typeof settings) => (checked: boolean) => {
    setSettings(prev => ({ ...prev, [key]: checked }))
  }
  
  return (
    <div className="space-y-4">
      <Switch
        checked={settings.notifications}
        onCheckedChange={updateSetting('notifications')}
        label="Push notifications"
        description="Get notified about important updates"
        showIcons
      />
      
      <Switch
        checked={settings.autoSave}
        onCheckedChange={updateSetting('autoSave')}
        label="Auto-save"
        description="Automatically save your work"
        variant="success"
      />
      
      <Switch
        checked={settings.darkMode}
        onCheckedChange={updateSetting('darkMode')}
        label="Dark mode"
        description="Use dark theme"
      />
    </div>
  )
}
```

### Toggle de Funcionalidades
```tsx
const FeatureToggle = ({ feature, onToggle }) => (
  <Switch
    checked={feature.enabled}
    onCheckedChange={onToggle}
    label={feature.name}
    description={feature.description}
    variant={feature.isExperimental ? "warning" : "default"}
    disabled={feature.isRequired}
  />
)
```

### Switch com Confirmação
```tsx
const DangerousSwitch = ({ onConfirm }) => {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  
  const handleChange = (checked: boolean) => {
    if (checked && !showConfirm) {
      setShowConfirm(true)
      return
    }
    
    setIsEnabled(checked)
    setShowConfirm(false)
    onConfirm?.(checked)
  }
  
  return (
    <div className="space-y-2">
      <Switch
        checked={isEnabled}
        onCheckedChange={handleChange}
        label="Delete all data"
        description="This action cannot be undone"
        variant="destructive"
      />
      
      {showConfirm && (
        <div className="p-3 bg-destructive/10 rounded">
          <p className="text-sm">Are you sure? This will permanently delete all your data.</p>
          <div className="flex gap-2 mt-2">
            <button onClick={() => handleChange(true)}>Confirm</button>
            <button onClick={() => setShowConfirm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

### Switch de Conectividade
```tsx
const ConnectivitySwitch = () => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  
  const handleToggle = async (checked: boolean) => {
    setIsConnecting(true)
    
    try {
      if (checked) {
        await connectToService()
      } else {
        await disconnectFromService()
      }
      setIsConnected(checked)
    } catch (error) {
      console.error('Connection failed:', error)
    } finally {
      setIsConnecting(false)
    }
  }
  
  return (
    <Switch
      checked={isConnected}
      onCheckedChange={handleToggle}
      loading={isConnecting}
      label="Wi-Fi Connection"
      description={isConnected ? "Connected" : "Disconnected"}
      variant={isConnected ? "success" : "default"}
      showIcons
      checkedIcon={<Wifi className="h-3 w-3" />}
      uncheckedIcon={<WifiOff className="h-3 w-3" />}
    />
  )
}
```

### Lista de Permissões
```tsx
const PermissionsList = ({ permissions, onUpdatePermission }) => (
  <div className="space-y-4">
    {permissions.map(permission => (
      <Switch
        key={permission.id}
        checked={permission.granted}
        onCheckedChange={(checked) => onUpdatePermission(permission.id, checked)}
        label={permission.name}
        description={permission.description}
        variant={permission.isRequired ? "destructive" : "default"}
        disabled={permission.isRequired && permission.granted}
        size="sm"
      />
    ))}
  </div>
)
```

### Switch em Formulário
```tsx
const ProfileForm = () => {
  const { register, watch, setValue } = useForm({
    defaultValues: {
      isPublic: false,
      allowMessages: true,
      emailNotifications: false,
    }
  })
  
  const isPublic = watch('isPublic')
  const allowMessages = watch('allowMessages')
  const emailNotifications = watch('emailNotifications')
  
  return (
    <form className="space-y-6">
      <Switch
        checked={isPublic}
        onCheckedChange={(checked) => setValue('isPublic', checked)}
        label="Public profile"
        description="Make your profile visible to everyone"
      />
      
      <Switch
        checked={allowMessages}
        onCheckedChange={(checked) => setValue('allowMessages', checked)}
        label="Allow messages"
        description="Let other users send you messages"
        disabled={!isPublic}
      />
      
      <Switch
        checked={emailNotifications}
        onCheckedChange={(checked) => setValue('emailNotifications', checked)}
        label="Email notifications"
        description="Receive notifications via email"
        variant="success"
      />
    </form>
  )
}
```

### Switch com Analytics
```tsx
const AnalyticsSwitch = ({ trackingId, ...props }) => {
  const handleChange = (checked: boolean) => {
    // Track the toggle event
    analytics.track('switch_toggled', {
      switchId: trackingId,
      newValue: checked,
      timestamp: new Date().toISOString(),
    })
    
    props.onCheckedChange?.(checked)
  }
  
  return (
    <Switch
      {...props}
      onCheckedChange={handleChange}
    />
  )
}
```
