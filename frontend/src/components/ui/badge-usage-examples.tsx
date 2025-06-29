# Badge Component - Exemplos de Uso

## Básico
```tsx
import { Badge } from '@/components/ui/badge'

// Badge padrão
<Badge>New</Badge>

// Badge com variante
<Badge variant="success">Active</Badge>

// Badge pequeno
<Badge size="sm">Tag</Badge>
```

## Variantes Disponíveis
```tsx
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>
```

## Com Ícones
```tsx
import { Star, Crown, Shield } from 'lucide-react'

<Badge icon={<Star className="h-3 w-3" />}>
  Premium
</Badge>

<Badge icon={<Crown className="h-3 w-3" />} variant="warning">
  VIP
</Badge>

<Badge icon={<Shield className="h-3 w-3" />} variant="success">
  Verified
</Badge>
```

## Badge Removível
```tsx
// Badge removível básico
<Badge removable onRemove={() => console.log('removed')}>
  Tag Removível
</Badge>

// Com ícone customizado de remoção
<Badge 
  removable 
  onRemove={handleRemove}
  removeIcon={<CustomIcon />}
  removeAriaLabel="Remover tag"
>
  Custom Remove
</Badge>
```

## Badge Interativo
```tsx
// Badge clicável
<Badge interactive onClick={() => handleClick()}>
  Clique aqui
</Badge>

// Badge com funcionalidade completa
<Badge 
  interactive
  onClick={() => navigate('/premium')}
  icon={<Star />}
  variant="success"
>
  Upgrade para Premium
</Badge>
```

## Casos de Uso Práticos

### Status de Usuário
```tsx
const UserStatus = ({ status }: { status: 'online' | 'offline' | 'away' }) => {
  const statusConfig = {
    online: { variant: 'success', text: 'Online' },
    offline: { variant: 'secondary', text: 'Offline' },
    away: { variant: 'warning', text: 'Away' }
  }
  
  return (
    <Badge variant={statusConfig[status].variant}>
      {statusConfig[status].text}
    </Badge>
  )
}
```

### Tags de Produto
```tsx
const ProductTags = ({ tags, onRemoveTag }) => (
  <div className="flex flex-wrap gap-1">
    {tags.map(tag => (
      <Badge 
        key={tag.id}
        removable
        onRemove={() => onRemoveTag(tag.id)}
        variant="outline"
        size="sm"
      >
        {tag.name}
      </Badge>
    ))}
  </div>
)
```

### Notificações
```tsx
const NotificationBadge = ({ count, onClick }) => (
  <Badge 
    interactive
    onClick={onClick}
    variant={count > 0 ? 'destructive' : 'secondary'}
    size="sm"
  >
    {count > 99 ? '99+' : count}
  </Badge>
)
```

### Permissões e Roles
```tsx
const RoleBadge = ({ role }) => {
  const roleConfig = {
    admin: { variant: 'destructive', icon: <Crown /> },
    moderator: { variant: 'warning', icon: <Shield /> },
    user: { variant: 'secondary', icon: null }
  }
  
  const config = roleConfig[role]
  
  return (
    <Badge 
      variant={config.variant}
      icon={config.icon}
      size="sm"
    >
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  )
}
```
