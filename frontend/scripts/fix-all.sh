#!/bin/bash

echo "==================================="
echo "CORRIGINDO PROBLEMAS DO FRONTEND"
echo "==================================="

# Navegar para o diretório frontend
cd "$(dirname "$0")/.."

# Criar diretório scripts se não existir
mkdir -p scripts

# Executar script de correção
echo "Executando correção do package.json..."
node scripts/fix-package-json.js

# Verificar se foi bem-sucedido
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Correção concluída com sucesso!"
    echo "✅ Dependências instaladas!"
    echo ""
    echo "Próximos passos:"
    echo "  1. Execute: npm run dev"
    echo "  2. Acesse: http://localhost:3000"
else
    echo ""
    echo "❌ Falha na correção!"
    echo "Verifique os logs acima para mais detalhes."
    exit 1
fi
