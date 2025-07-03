import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

interface MaintenanceOptions {
  fix?: boolean
  clean?: boolean
  update?: boolean
  validate?: boolean
}

class MaintenanceManager {
  private readonly cwd: string
  private readonly packageJson: any

  constructor(options: MaintenanceOptions) {
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
    const requiredVersion = this.packageJson.engines.node
    
    if (!nodeVersion.match(requiredVersion)) {
      throw new Error(
        `Node.js ${nodeVersion} não é compatível. Requer ${requiredVersion}`
      )
    }
  }

  private async runMaintenanceTasks() {
    // Limpar caches e arquivos temporários
    await this.execCommand('npm run clean')
    
    // Instalar/atualizar dependências
    await this.execCommand('npm install')
    
    // Executar verificações
    await this.execCommand('npm run validate')
    
    // Construir o projeto
    await this.execCommand('npm run build')
    
    // Gerar sitemap
    await this.execCommand('npm run postbuild')
  }

  private async execCommand(command: string): Promise<void> {
    try {
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

// CLI
if (require.main === module) {
  const args = process.argv.slice(2)
  const options: MaintenanceOptions = {
    fix: args.includes('--fix'),
    clean: args.includes('--clean'),
    update: args.includes('--update'),
    validate: args.includes('--validate')
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: npm run maintenance [opções]

Opções:
  --fix        Corrige dependências e problemas conhecidos
  --clean      Limpa caches e arquivos temporários
  --update     Atualiza dependências para últimas versões
  --validate   Executa verificações de tipo e testes
  --help       Mostra esta ajuda

Exemplos:
  npm run maintenance --fix --clean
  npm run maintenance --validate
    `)
    process.exit(0)
  }

  const maintenance = new MaintenanceManager(options)
  maintenance.run().catch(() => process.exit(1))
}
