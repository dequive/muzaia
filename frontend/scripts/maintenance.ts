import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { z } from 'zod'
import chalk from 'chalk'
import ora from 'ora'

interface MaintenanceOptions {
  fix?: boolean
  clean?: boolean
  check?: boolean
  update?: boolean
  cache?: boolean
}

// Esquema de validação do package.json
const PackageSchema = z.object({
  dependencies: z.record(z.string()),
  devDependencies: z.record(z.string()),
  scripts: z.record(z.string()),
  version: z.string(),
  name: z.string()
})

class MaintenanceManager {
  private cwd: string
  private backupDir: string
  private spinner: any

  constructor(private options: MaintenanceOptions) {
    this.cwd = process.cwd()
    this.backupDir = path.join(this.cwd, 'backups')
    this.spinner = ora()
    
    // Criar diretório de backups se não existir
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir)
    }
  }

  async run(): Promise<void> {
    console.log(chalk.blue('\n🔧 Iniciando manutenção do frontend...\n'))

    try {
      if (this.options.fix) {
        await this.fixDependencies()
      }

      if (this.options.clean) {
        await this.cleanProject()
      }

      if (this.options.update) {
        await this.updateDependencies()
      }

      if (this.options.check) {
        await this.checkProject()
      }

      if (this.options.cache) {
        await this.cleanCache()
      }

      console.log(chalk.green('\n✨ Manutenção concluída com sucesso!\n'))
    } catch (error) {
      console.error(chalk.red('\n❌ Erro durante a manutenção:'), error)
      process.exit(1)
    }
  }

  private async fixDependencies(): Promise<void> {
    this.spinner.start('Corrigindo dependências...')

    try {
      // Backup do package.json
      await this.createBackup('package.json')

      // Remover node_modules e lockfiles
      this.execCommand('rm -rf node_modules package-lock.json yarn.lock pnpm-lock.yaml')

      // Instalar dependências limpas
      this.execCommand('npm install --force')

      // Verificar e corrigir vulnerabilidades
      this.execCommand('npm audit fix')

      this.spinner.succeed('Dependências corrigidas')
    } catch (error) {
      this.spinner.fail('Erro ao corrigir dependências')
      await this.restoreBackup('package.json')
      throw error
    }
  }

  private async updateDependencies(): Promise<void> {
    this.spinner.start('Atualizando dependências...')

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      
      // Validar package.json
      PackageSchema.parse(packageJson)

      // Atualizar versões
      const updates = {
        dependencies: {
          'zustand': '^5.0.0',
          'axios': '^1.7.0',
          'react-hook-form': '^7.49.0',
          'next': '^14.0.0',
          'react': '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@types/node': '^20.10.5',
          '@types/react': '^18.2.45',
          'typescript': '^5.3.0',
          'eslint': '^8.56.0'
        }
      }

      Object.assign(packageJson.dependencies, updates.dependencies)
      Object.assign(packageJson.devDependencies, updates.devDependencies)

      // Salvar package.json atualizado
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2))

      // Instalar novas versões
      this.execCommand('npm install')

      this.spinner.succeed('Dependências atualizadas')
    } catch (error) {
      this.spinner.fail('Erro ao atualizar dependências')
      throw error
    }
  }

  private async cleanProject(): Promise<void> {
    this.spinner.start('Limpando projeto...')

    const dirsToClean = [
      '.next',
      'out',
      'coverage',
      '.turbo',
      '.vercel',
      '.swc',
      'dist',
      '.cache'
    ]

    try {
      for (const dir of dirsToClean) {
        const dirPath = path.join(this.cwd, dir)
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true })
        }
      }

      this.spinner.succeed('Projeto limpo')
    } catch (error) {
      this.spinner.fail('Erro ao limpar projeto')
      throw error
    }
  }

  private async checkProject(): Promise<void> {
    console.log(chalk.blue('\nVerificando projeto:\n'))

    try {
      // TypeScript
      this.spinner.start('Verificando tipos...')
      this.execCommand('npm run type-check')
      this.spinner.succeed('Tipos verificados')

      // ESLint
      this.spinner.start('Executando linter...')
      this.execCommand('npm run lint')
      this.spinner.succeed('Lint concluído')

      // Testes
      this.spinner.start('Executando testes...')
      this.execCommand('npm run test')
      this.spinner.succeed('Testes concluídos')

      // Build
      this.spinner.start('Verificando build...')
      this.execCommand('npm run build')
      this.spinner.succeed('Build verificado')

    } catch (error) {
      this.spinner.fail('Verificação falhou')
      throw error
    }
  }

  private async cleanCache(): Promise<void> {
    this.spinner.start('Limpando cache...')

    try {
      // Limpar cache do npm
      this.execCommand('npm cache clean --force')
      
      // Limpar cache do Next.js
      this.execCommand('rm -rf .next/cache')
      
      // Limpar cache do ESLint
      this.execCommand('rm -rf .eslintcache')
      
      // Limpar cache do TypeScript
      this.execCommand('rm -rf tsconfig.tsbuildinfo')

      this.spinner.succeed('Cache limpo')
    } catch (error) {
      this.spinner.fail('Erro ao limpar cache')
      throw error
    }
  }

  private async createBackup(filename: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(this.backupDir, `${filename}.${timestamp}.backup`)
    fs.copyFileSync(filename, backupPath)
  }

  private async restoreBackup(filename: string): Promise<void> {
    const backups = fs.readdirSync(this.backupDir)
      .filter(f => f.startsWith(filename))
      .sort()
      .reverse()

    if (backups.length > 0) {
      fs.copyFileSync(path.join(this.backupDir, backups[0]), filename)
      console.log(chalk.yellow(`\nRestaurado backup: ${backups[0]}`))
    }
  }

  private execCommand(command: string): void {
    try {
      execSync(command, {
        stdio: 'inherit',
        cwd: this.cwd,
        env: { ...process.env, FORCE_COLOR: 'true' }
      })
    } catch (error) {
      console.error(chalk.red(`\nComando falhou: ${command}`))
      throw error
    }
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2)
  const options: MaintenanceOptions = {
    fix: args.includes('--fix'),
    clean: args.includes('--clean'),
    check: args.includes('--check'),
    update: args.includes('--update'),
    cache: args.includes('--cache')
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: ts-node maintenance.ts [options]

Options:
  --fix      Fix dependencies and vulnerabilities
  --clean    Clean project directories and caches
  --check    Run type checks, linting and tests
  --update   Update dependencies to latest versions
  --cache    Clean all caches (npm, Next.js, etc)
  --help     Show this help message

Examples:
  ts-node maintenance.ts --fix --clean
  ts-node maintenance.ts --check
  ts-node maintenance.ts --update
    `)
    process.exit(0)
  }

  const maintenance = new MaintenanceManager(options)
  maintenance.run().catch(() => process.exit(1))
}

export default MaintenanceManager
