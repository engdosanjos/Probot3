#!/bin/bash

echo "===================================="
echo "Corrigindo Prisma para SQLite"
echo "===================================="
echo ""

echo "[1/5] Verificando .env..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
EOF
    echo "✓ Arquivo .env criado"
else
    echo "✓ Arquivo .env já existe"
fi
echo ""

echo "[2/5] Limpando cache do Prisma..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
echo "✓ Cache limpo"
echo ""

echo "[3/5] Gerando Prisma Client..."
npx prisma generate
echo ""

echo "[4/5] Criando banco de dados SQLite..."
npx prisma db push --accept-data-loss
echo ""

echo "[5/5] Populando banco com dados iniciais..."
npx tsx scripts/seed.ts
echo ""

echo "===================================="
echo "✓ Configuração concluída!"
echo "===================================="
echo ""
echo "Agora execute: npm run dev"
echo ""
