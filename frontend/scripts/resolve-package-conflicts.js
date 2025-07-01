#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// =============================================================================
// CONFIGURAÇÕES
// =============================================================================

const CONFIG = {
  colors: {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
  },
  conflictMarkers: ['<<<<<<<', '=======', '>>>>>>>'],
  supportedFiles: ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
};

// =============================================================================
// UTILITÁRIOS
// =============================================================================

function log(message, type = 'INFO') {
  const { colors } = CONFIG;
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  
  const typeColors = {
    INFO: colors.blue,
    SUCCESS: colors.green,
    WARN: colors.yellow,
    ERROR: colors.red,
  };
  
  const color = typeColors[type] || colors.reset;
  console.log(`${color}[${timestamp}] ${type}: ${message}${colors.reset}`);
}

function findPackageFiles(startDir = process.cwd()) {
  const found = [];
  
  for (const filename of CONFIG.supportedFiles) {
    const filepath = path.join(startDir, filename);
    if (fs.existsSync(filepath)) {
      found.push({ name: filename, path: filepath });
    }
  }
  
  return found;
}

function detectConflicts(content) {
  const conflicts = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    CONFIG.conflictMarkers.forEach(marker => {
      if (line.includes(marker)) {
        conflicts.push({
          line: index + 1,
          marker,
          content: line.trim(),
        });
      }
    });
  });
  
  return conflicts;
}

function analyzeConflictScope(content) {
  const conflictBlocks = [];
  const lines = content.split('\n');
  let currentBlock = null;
  
  lines.forEach((line, index) => {
    if (line.includes('<<<<<<<')) {
      currentBlock = {
        start: index + 1,
        head: [],
        base: [],
        end: null,
      };
    } else if (line.includes('=======') && currentBlock) {
      // Mudança para seção base
    } else if (line.includes('>>>>>>>') && currentBlock) {
      currentBlock.end = index + 1;
      conflictBlocks.push(currentBlock);
      currentBlock = null;
    } else if (currentBlock) {
      if (currentBlock.end === null) {
        currentBlock.head.push(line);
      } else {
        currentBlock.base.push(line);
      }
    }
  });
  
  return conflictBlocks;
}

// =============================================================================
// FUNÇÕES PRINCIPAIS
// =============================================================================

function checkSingleFile(filepath) {
  log(`Verificando: ${path.basename(filepath)}`);
  
  let content;
  try {
    content = fs.readFileSync(filepath, 'utf8');
  } catch (error) {
    log(`Erro ao ler ${filepath}: ${error.message}`, 'ERROR');
    return { hasConflicts: false, error: error.message };
  }
  
  const conflicts = detectConflicts(content);
  
  if (conflicts.length > 0) {
    log(`${conflicts.length} conflito(s) detectado(s) em ${path.basename(filepath)}`, 'WARN');
    
    conflicts.forEach(conflict => {
      log(`  Linha ${conflict.line}: ${conflict.marker}`, 'WARN');
    });
    
    return { hasConflicts: true, conflicts, filepath };
  }
  
  log(`✓ Nenhum conflito em ${path.basename(filepath)}`, 'SUCCESS');
  return { hasConflicts: false, filepath };
}

function generateResolutionInstructions(conflictedFiles) {
  log('\n' + '='.repeat(60), 'ERROR');
  log('CONFLITOS DETECTADOS - INSTRUÇÕES DE RESOLUÇÃO', 'ERROR');
  log('='.repeat(60), 'ERROR');
  
  conflictedFiles.forEach(({ filepath, conflicts }) => {
    log(`\nArquivo: ${filepath}`, 'ERROR');
    log(`Conflitos: ${conflicts.length}`, 'ERROR');
    
    conflicts.forEach(conflict => {
      log(`  • Linha ${conflict.line}: ${conflict.content}`, 'WARN');
    });
  });
  
  log('\nPASSOS PARA RESOLVER:', 'INFO');
  log('1. Abra cada arquivo em um editor de texto/IDE', 'INFO');
  log('2. Localize os marcadores de conflito:', 'INFO');
  log('   <<<<<<< HEAD (sua versão atual)', 'INFO');
  log('   ======= (separador)', 'INFO');
  log('   >>>>>>> branch_name (versão da branch)', 'INFO');
  log('3. Escolha qual versão manter ou combine ambas', 'INFO');
  log('4. Remova TODOS os marcadores de conflito', 'INFO');
  log('5. Salve os arquivos', 'INFO');
  log('6. Execute: npm install (ou yarn/pnpm)', 'INFO');
  log('7. Teste se tudo está funcionando\n', 'INFO');
}

function autoResolveSimpleConflicts(filepath) {
  log(`Tentando resolução automática para ${path.basename(filepath)}`, 'INFO');
  
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const conflicts = detectConflicts(content);
    
    if (conflicts.length === 0) return true;
    
    // Para package.json, tenta manter a versão HEAD (mais conservador)
    let resolved = content;
    
    // Remove marcadores, mantendo apenas a seção HEAD
    resolved = resolved.replace(/<<<<<<< .*?\n([\s\S]*?)=======([\s\S]*?)>>>>>>> .*?\n/g, '$1');
    resolved = resolved.replace(/<<<<<<< .*?\n/g, '');
    resolved = resolved.replace(/=======/g, '');
    resolved = resolved.replace(/>>>>>>> .*?\n/g, '');
    
    // Valida JSON se for package.json
    if (path.basename(filepath) === 'package.json') {
      try {
        JSON.parse(resolved);
      } catch (jsonError) {
        log(`Resolução automática falhou - JSON inválido: ${jsonError.message}`, 'ERROR');
        return false;
      }
    }
    
    // Criar backup
    const backupPath = `${filepath}.backup.${Date.now()}`;
    fs.copyFileSync(filepath, backupPath);
    log(`Backup criado: ${backupPath}`, 'INFO');
    
    // Aplicar resolução
    fs.writeFileSync(filepath, resolved, 'utf8');
    log(`✓ Conflitos resolvidos automaticamente em ${path.basename(filepath)}`, 'SUCCESS');
    
    return true;
  } catch (error) {
    log(`Erro na resolução automática: ${error.message}`, 'ERROR');
    return false;
  }
}

function runInstallation() {
  log('Executando instalação de dependências...', 'INFO');
  
  try {
    // Detecta o gerenciador de pacotes
    const hasYarnLock = fs.existsSync(path.join(process.cwd(), 'yarn.lock'));
    const hasPnpmLock = fs.existsSync(path.join(process.cwd(), 'pnpm-lock.yaml'));
    
    let installCommand;
    if (hasPnpmLock) {
      installCommand = 'pnpm install';
    } else if (hasYarnLock) {
      installCommand = 'yarn install';
    } else {
      installCommand = 'npm install';
    }
    
    log(`Executando: ${installCommand}`, 'INFO');
    execSync(installCommand, { stdio: 'inherit', cwd: process.cwd() });
    log('✓ Dependências instaladas com sucesso', 'SUCCESS');
    
    return true;
  } catch (error) {
    log(`Erro na instalação: ${error.message}`, 'ERROR');
    return false;
  }
}

// =============================================================================
// FUNÇÃO PRINCIPAL
// =============================================================================

function main() {
  const args = process.argv.slice(2);
  const options = {
    autoResolve: args.includes('--auto-resolve') || args.includes('-a'),
    install: args.includes('--install') || args.includes('-i'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h'),
  };
  
  if (options.help) {
    console.log(`
Uso: node resolve-conflicts.js [opções]

Opções:
  -a, --auto-resolve    Tenta resolver conflitos automaticamente
  -i, --install         Executa instalação após resolução
  -v, --verbose         Saída detalhada
  -h, --help           Mostra esta ajuda

Exemplos:
  node resolve-conflicts.js                    # Apenas detecta conflitos
  node resolve-conflicts.js -a                 # Resolve automaticamente
  node resolve-conflicts.js -a -i              # Resolve e instala dependências
    `);
    process.exit(0);
  }
  
  log('🔍 Iniciando verificação de conflitos...', 'INFO');
  log(`Diretório: ${process.cwd()}`, 'INFO');
  
  const packageFiles = findPackageFiles();
  
  if (packageFiles.length === 0) {
    log('Nenhum arquivo de package encontrado no diretório atual', 'WARN');
    process.exit(0);
  }
  
  log(`Arquivos encontrados: ${packageFiles.map(f => f.name).join(', ')}`, 'INFO');
  
  const results = packageFiles.map(file => checkSingleFile(file.path));
  const conflictedFiles = results.filter(r => r.hasConflicts);
  
  if (conflictedFiles.length === 0) {
    log('✅ Nenhum conflito detectado! Tudo pronto.', 'SUCCESS');
    
    if (options.install) {
      return runInstallation() ? 0 : 1;
    }
    
    process.exit(0);
  }
  
  // Há conflitos
  if (options.autoResolve) {
    log('🔧 Tentando resolução automática...', 'INFO');
    
    let allResolved = true;
    for (const file of conflictedFiles) {
      if (!autoResolveSimpleConflicts(file.filepath)) {
        allResolved = false;
      }
    }
    
    if (allResolved) {
      log('✅ Todos os conflitos foram resolvidos automaticamente!', 'SUCCESS');
      
      if (options.install) {
        return runInstallation() ? 0 : 1;
      }
      
      process.exit(0);
    } else {
      log('⚠️  Alguns conflitos não puderam ser resolvidos automaticamente', 'WARN');
    }
  }
  
  generateResolutionInstructions(conflictedFiles);
  process.exit(1);
}

// =============================================================================
// EXECUÇÃO
// =============================================================================

if (require.main === module) {
  main();
}

module.exports = {
  detectConflicts,
  checkSingleFile,
  autoResolveSimpleConflicts,
  findPackageFiles,
};
