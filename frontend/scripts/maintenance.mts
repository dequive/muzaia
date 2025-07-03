import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class MaintenanceManager {
  private cwd: string

  constructor() {
    this.cwd = path.resolve(__dirname, '..')
  }

  async run(options: { fix?: boolean; clean?: boolean }) {
    console.log('🔧 Iniciando manutenção...')

    if (options.fix) {
      await this.fixDependencies()
    }

    if (options.clean) {
      await this.cleanProject()
    }

    console.log('✅ Manutenção concluída')
  }

  private async fixDependencies() {
    console.log('📦 Corrigindo dependências...')
    
    try {
      // Remover módulos e lockfiles
      this.execCommand('rm -rf node_modules package-lock.json')
      
      // Reinstalar tudo
      this.execCommand('npm install')
      
      console.log('✅ Dependências corrigidas')
    } catch (error) {
      console.error('❌ Erro ao corrigir dependências:', error)
      throw error
    }
  }

  private async cleanProject() {
    console.log('🧹 Limpando projeto...')
    
    const dirsToClean = [
      '.next',
      'out', 
      'dist',
      'coverage',
      '.turbo'
    ]

    for (const dir of dirsToClean) {
      const fullPath = path.join(this.cwd, dir)
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true })
      }
    }

    console.log('✅ Projeto limpo')
  }

  private execCommand(command: string) {
    execSync(command, {
      stdio: 'inherit',
      cwd: this.cwd
    })
  }
}

// CLI
if (process.argv[1] === __filename) {
  const options = {
    fix: process.argv.includes('--fix'),
    clean: process.argv.includes('--clean')
  }

  const maintenance = new MaintenanceManager()
  maintenance.run(options).catch(error => {
    console.error('❌ Erro na manutenção:', error)
    process.exit(1)
  })
}

export default MaintenanceManager
