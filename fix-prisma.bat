@echo off
echo ====================================
echo Corrigindo Prisma para SQLite
echo ====================================
echo.

echo [1/4] Verificando .env...
if not exist .env (
    echo DATABASE_URL="file:./dev.db" > .env
    echo NEXTAUTH_SECRET="your-secret-key-change-in-production" >> .env
    echo NEXTAUTH_URL="http://localhost:3000" >> .env
    echo ✓ Arquivo .env criado
) else (
    echo ✓ Arquivo .env ja existe
)
echo.

echo [2/4] Limpando cache do Prisma...
if exist node_modules\.prisma rd /s /q node_modules\.prisma
if exist node_modules\@prisma\client rd /s /q node_modules\@prisma\client
echo ✓ Cache limpo
echo.

echo [3/4] Gerando Prisma Client...
call npx prisma generate
echo.

echo [4/4] Criando banco de dados SQLite...
call npx prisma db push --accept-data-loss
echo.

echo [5/5] Populando banco com dados iniciais...
call npx tsx scripts/seed.ts
echo.

echo ====================================
echo ✓ Configuracao concluida!
echo ====================================
echo.
echo Agora execute: npm run dev
echo.
pause
