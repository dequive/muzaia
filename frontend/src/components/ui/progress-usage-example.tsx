# Progress Component - Exemplos de Uso

## Básico
```tsx
import { Progress } from '@/components/ui/progress'

// Progress simples
<Progress value={50} />

// Progress com porcentagem
<Progress value={75} showValue />

// Progress com label
<Progress value={60} label="Carregando..." />
```

## Variantes de Estado
```tsx
<Progress value={100} variant="success" showValue />
<Progress value={45} variant="warning" showValue />
<Progress value={20} variant="destructive" showValue />
<Progress value={70} variant="default" showValue />
```

## Tamanhos
```tsx
<Progress value={60} size="sm" showValue />
<Progress value={60} size="default" showValue />
<Progress value={60} size="lg" showValue />
```

## Posições do Label
```tsx
// Label no topo (padrão)
<Progress value={65} showValue label="Upload" labelPosition="top" />

// Label na base
<Progress value={65} showValue label="Download" labelPosition="bottom" />

// Label dentro da barra
<Progress value={65} showValue labelPosition="inside" size="lg" />
```

## Progress Indeterminado
```tsx
// Para operações sem progresso conhecido
<Progress indeterminate label="Processando..." />

// Com animação customizada
<Progress indeterminate animated label="Sincronizando..." />
```

## Formatação Customizada
```tsx
// Formato personalizado
<Progress 
  value={750} 
  showValue 
  formatValue={(val) => `${val}/1000 MB`}
  label="Download"
/>

// Passos
<Progress 
  value={3} 
  showValue 
  formatValue={(val) => `Passo ${val} de 5`}
  label="Instalação"
/>
```

## Casos de Uso Práticos

### Upload de Arquivos
```tsx
const FileUploadProgress = ({ file, progress }) => (
  <div className="space-y-2">
    <Progress 
      value={progress}
      showValue
      label={file.name}
      variant={progress === 100 ? "success" : "default"}
      formatValue={(val) => `${Math.round(val)}% - ${file.size} MB`}
    />
  </div>
)
```

### Barra de Experiência
```tsx
const ExperienceBar = ({ currentXP, maxXP, level }) => (
  <Progress 
    value={(currentXP / maxXP) * 100}
    showValue
    label={`Nível ${level}`}
    formatValue={() => `${currentXP}/${maxXP} XP`}
    variant="success"
    size="lg"
    labelPosition="top"
  />
)
```

### Progress de Formulário Multi-etapas
```tsx
const FormProgress = ({ currentStep, totalSteps }) => (
  <Progress 
    value={(currentStep / totalSteps) * 100}
    showValue
    formatValue={() => `${currentStep}/${totalSteps}`}
    label="Progresso do Formulário"
    variant="default"
  />
)
```

### Indicador de Força de Senha
```tsx
const PasswordStrength = ({ strength }) => {
  const variants = {
    weak: 'destructive',
    medium: 'warning', 
    strong: 'success'
  }
  
  const labels = {
    weak: 'Fraca',
    medium: 'Média',
    strong: 'Forte'
  }
  
  return (
    <Progress 
      value={strength.score * 25}
      variant={variants[strength.level]}
      label={`Força: ${labels[strength.level]}`}
      size="sm"
    />
  )
}
```

### Loading de Página com Estimativa
```tsx
const PageLoadProgress = ({ loaded, total, estimatedTime }) => (
  <Progress 
    value={(loaded / total) * 100}
    showValue
    label="Carregando página"
    formatValue={(val) => `${Math.round(val)}% - ${estimatedTime}s restantes`}
    animated={loaded < total}
    indeterminate={total === 0}
  />
)
```

### Progress de Sincronização
```tsx
const SyncProgress = ({ syncState }) => {
  if (syncState.isIndeterminate) {
    return (
      <Progress 
        indeterminate 
        label="Sincronizando com servidor..."
        animated
      />
    )
  }
  
  return (
    <Progress 
      value={syncState.progress}
      showValue
      label={`Sincronizando: ${syncState.currentItem}`}
      variant={syncState.hasErrors ? "warning" : "default"}
      formatValue={(val) => `${Math.round(val)}% (${syncState.itemsProcessed}/${syncState.totalItems})`}
    />
  )
}
```

### Progress com Ações
```tsx
const DownloadProgress = ({ download, onCancel, onPause }) => (
  <div className="space-y-2">
    <Progress 
      value={download.progress}
      showValue
      label={download.filename}
      variant={download.status === 'error' ? 'destructive' : 'default'}
      formatValue={(val) => `${download.downloadedMB}/${download.totalMB} MB (${Math.round(val)}%)`}
    />
    <div className="flex gap-2">
      <button onClick={onPause}>
        {download.isPaused ? 'Retomar' : 'Pausar'}
      </button>
      <button onClick={onCancel}>Cancelar</button>
    </div>
  </div>
)
```
