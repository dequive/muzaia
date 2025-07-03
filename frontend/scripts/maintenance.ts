#!/usr/bin/env node
import { resolve } from 'path'
import { execSync } from 'child_process'
import fs from 'fs'

interface MaintenanceOptions {
  fix?: boolean
  clean?: boolean
  check?: boolean
}

class MaintenanceTask {
  constructor(private options: MaintenanceOptions) {}

  async run() {
    if (this.options.fix) {
      await this.fixDependencies()
    }
    
    if (this.options.clean) {
      await this.cleanProject()
    }
    
    if (this.options.check) {
      await this.checkProject()
    }
  }

  private async fixDependencies() {
    console.log('🔧 Fixing dependencies...')
    
    // Remove node_modules e lockfile
    this.execCommand('rm -rf node_modules package-lock.json')
    
    // Instala dependências
    this.execCommand('npm install')
    
    console.log('✅ Dependencies fixed')
  }

  private async cleanProject() {
    console.log('🧹 Cleaning project...')
    
    const dirsToClean = [
      '.next',
      'out',
      'coverage',
      '.turbo'
    ]

    dirsToClean.forEach(dir => {
      const path = resolve(process.cwd(), dir)
      if (fs.existsSync(path)) {
        fs.rmSync(path, { recursive: true, force: true })
      }
    })

    console.log('✅ Project cleaned')
  }

  private async checkProject() {
    console.log('🔍 Checking project...')
    
    // Verifica tipos
    this.execCommand('npm run type-check')
    
    // Executa linter
    this.execCommand('npm run lint')
    
    // Executa testes
    this.execCommand('npm run test')
    
    console.log('✅ Project checked')
  }

  private execCommand(command: string) {
    try {
      execSync(command, { 
        stdio: 'inherit',
        cwd: process.cwd()
      })
    } catch (error) {
      console.error(`❌ Command failed: ${command}`)
      throw error
    }
  }
}

// Parse argumentos da CLI
const args = process.argv.slice(2)
const options: MaintenanceOptions = {
  fix: args.includes('--fix'),
  clean: args.includes('--clean'),
  check: args.includes('--check')
}

// Se nenhuma opção fornecida, mostra ajuda
if (!Object.values(options).some(Boolean)) {
  console.log(`
Usage: maintenance [options]

Options:
  --fix     Fix dependencies
  --clean   Clean project files
  --check   Check project (types, lint, tests)

Examples:
  maintenance --fix
  maintenance --clean --check
  `)
  process.exit(0)
}

// Executa tarefas
new MaintenanceTask(options).run()
  .catch(console.error)
