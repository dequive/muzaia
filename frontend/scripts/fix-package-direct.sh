#!/bin/bash

echo "==================================="
echo "CORREÇÃO DIRETA DO PACKAGE.JSON"
echo "==================================="

cd /root/muzaia/frontend

# Fazer backup
cp package.json package.json.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null

# Criar package.json limpo e correto
cat > package.json << 'EOF'
{
  "name": "mozaia-frontend",
  "version": "2.0.0",
  "description": "Frontend do Mozaia LLM Orchestrator",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "analyze": "cross-env ANALYZE=true next build",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.5",
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "@supabase/auth-helpers-react": "^0.4.2",
    "@tanstack/react-query": "^5.17.0",
    "@tanstack/react-query-devtools": "^5.17.0",
    "zustand": "^4.4.7",
    "axios": "^1.6.2",
    "react-hook-form": "^7.48.2",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4",
    "lucide-react": "^0.295.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-label": "^2.0.2",
    "next-themes": "^0.2.1",
    "framer-motion": "^10.16.16",
    "react-markdown": "^9.0.1",
    "rehype-highlight": "^7.0.0",
    "rehype-raw": "^7.0.0",
    "remark-gfm": "^4.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "recharts": "^2.8.0",
    "date-fns": "^2.30.0",
    "react-hot-toast": "^2.4.1",
    "react-loading-skeleton": "^3.3.1",
    "react-intersection-observer": "^9.5.3",
    "react-use": "^17.4.2",
    "lodash": "^4.17.21",
    "copy-to-clipboard": "^3.3.3"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@types/lodash": "^4.14.202",
    "@types/react-syntax-highlighter": "^15.5.11",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.0.4",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "prettier": "^3.1.1",
    "prettier-plugin-tailwindcss": "^0.5.9",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "cross-env": "^7.0.3",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.6",
    "@storybook/addon-essentials": "^7.6.6",
    "@storybook/addon-interactions": "^7.6.6",
    "@storybook/addon-links": "^7.6.6",
    "@storybook/blocks": "^7.6.6",
    "@storybook/nextjs": "^7.6.6",
    "@storybook/react": "^7.6.6",
    "@storybook/testing-library": "^0.2.2"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
EOF

# Validar JSON
echo "Validando JSON..."
if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"; then
    echo "✅ JSON válido!"
    
    # Instalar dependências
    echo "Instalando dependências..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 SUCESSO TOTAL!"
        echo "✅ package.json corrigido"
        echo "✅ Dependências instaladas"
        echo ""
        echo "Agora execute: npm run dev"
    else
        echo "❌ Erro na instalação das dependências"
    fi
else
    echo "❌ JSON ainda inválido"
fi
