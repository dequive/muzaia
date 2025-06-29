const fs = require('fs');
const path = require('path');

// Caminho para o arquivo package.json
const packageJsonPath = path.join(__dirname, 'package.json');

console.log('Verificando conflitos no package.json...');

// Ler o arquivo package.json
let packageJsonContent;
try {
  packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
} catch (error) {
  console.error('Erro ao ler o arquivo package.json:', error.message);
  process.exit(1);
}

// Verificar se há marcadores de conflito
const conflictMarkers = ['<<<<<<<', '=======', '>>>>>>>'];
const hasConflicts = conflictMarkers.some(marker => packageJsonContent.includes(marker));

if (hasConflicts) {
  console.log('Conflitos detectados no arquivo package.json.');
  console.log('Por favor, resolva os conflitos manualmente seguindo as etapas abaixo:');
  console.log(`
    1. Abra o arquivo package.json em um editor de texto.
    2. Localize os marcadores de conflito:
       - <<<<<<< HEAD
       - =======
       - >>>>>>> branch_name
    3. Escolha qual versão do código deseja manter (HEAD ou branch_name).
    4. Remova os marcadores de conflito.
    5. Salve o arquivo e execute "npm install" novamente.
  `);
} else {
  console.log('Nenhum conflito detectado no arquivo package.json. Tudo pronto para instalar dependências.');
}
