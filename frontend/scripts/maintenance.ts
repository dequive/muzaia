import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

interface MaintenanceOptions {
  clean?: boolean
  install?: boolean
  build?: boolean
  validate?: boolean
}

class MaintenanceManager {
  private readonly cwd: string
  private readonly packageJson: any

  constructor(options: MaintenanceOptions = {}) {
    this.cwd = process.cwd()
    this.packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  }

  async run() {
    try {
      console.log('\n🔧 Iniciando manutenção do Mozaia Frontend...\n')

      // Verificar versão do Node
      this.checkNodeVersion()

      // Executar scripts conforme as opções
      await this.runMaintenanceTasks()

      console.log('\n✅ Manutenção concluída com sucesso!\n')
    } catch (error) {
      console.error('\n❌ Erro durante a manutenção:', error)
      process.exit(1)
    }
  }

  private checkNodeVersion() {
    const nodeVersion = process.version
    const requiredVersion = this.packageJson.engines?.node || '>=18.0.0'

    console.log(`Node.js atual: ${nodeVersion}`)
    console.log(`Node.js requerido: ${requiredVersion}`)
  }

  private async runMaintenanceTasks() {
    // Limpar caches e arquivos temporários
    console.log('🧹 Limpando caches...')
    await this.execCommand('npm run clean')

    // Instalar/atualizar dependências
    console.log('📦 Instalando dependências...')
    await this.execCommand('npm install')

    // Executar verificações
    console.log('🔍 Executando verificações...')
    await this.execCommand('npm run typecheck')
    await this.execCommand('npm run lint')

    // Construir o projeto
    console.log('🏗️ Construindo projeto...')
    await this.execCommand('npm run build')

    console.log('✨ Tarefas de manutenção concluídas')
  }

  private async execCommand(command: string): Promise<void> {
    try {
      console.log(`Executando: ${command}`)
      execSync(command, {
        stdio: 'inherit',
        cwd: this.cwd,
        env: {
          ...process.env,
          FORCE_COLOR: 'true',
          NODE_ENV: 'development'
        }
      })
    } catch (error) {
      throw new Error(`Comando falhou: ${command}\n${error}`)
    }
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  const manager = new MaintenanceManager()
  manager.run()
}

export { MaintenanceManager }