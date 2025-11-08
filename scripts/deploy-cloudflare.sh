#!/bin/bash

# ====================================
# Deploy Script para Cloudflare Pages
# ====================================
#
# Este script automatiza el deployment completo a Cloudflare
# manteniendo todo en el tier GRATUITO
#
# Uso: ./scripts/deploy-cloudflare.sh
#

set -e  # Exit on error

echo ""
echo "🚀 DEPLOYMENT A CLOUDFLARE (TIER GRATUITO)"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que wrangler esté instalado
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Error: wrangler CLI no está instalado${NC}"
    echo ""
    echo "Instala wrangler con:"
    echo "  npm install -g wrangler"
    echo ""
    exit 1
fi

# Verificar autenticación
echo -e "${BLUE}🔐 Verificando autenticación...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás autenticado en Cloudflare${NC}"
    echo ""
    echo "Por favor ejecuta:"
    echo "  wrangler login"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Autenticado correctamente${NC}"
echo ""

# Paso 1: Build
echo -e "${BLUE}📦 Step 1/4: Building aplicación...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build exitoso${NC}"
else
    echo -e "${RED}❌ Error en el build${NC}"
    exit 1
fi
echo ""

# Paso 2: Verificar/Crear D1 Database
echo -e "${BLUE}🗄️  Step 2/4: Configurando D1 Database...${NC}"

DB_NAME="fiscal_platform_db"
DB_EXISTS=$(wrangler d1 list | grep "$DB_NAME" || true)

if [ -z "$DB_EXISTS" ]; then
    echo -e "${YELLOW}⚠️  Database no existe, creando...${NC}"
    wrangler d1 create "$DB_NAME"
    echo -e "${GREEN}✅ Database creada${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE: Copia el database_id del output anterior${NC}"
    echo -e "${YELLOW}   y actualízalo en wrangler.toml${NC}"
    echo ""
    read -p "Presiona Enter cuando hayas actualizado wrangler.toml..."
else
    echo -e "${GREEN}✅ Database ya existe${NC}"
fi
echo ""

# Paso 3: Aplicar migraciones
echo -e "${BLUE}📊 Step 3/4: Aplicando migraciones a D1...${NC}"

# Generar schema SQL si es necesario
if [ ! -d "drizzle" ]; then
    echo "Generando schema SQL..."
    npm run db:generate
fi

# Aplicar migraciones
wrangler d1 migrations apply "$DB_NAME" --remote

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migraciones aplicadas${NC}"
else
    echo -e "${RED}❌ Error aplicando migraciones${NC}"
    exit 1
fi
echo ""

# Paso 4: Deploy a Pages
echo -e "${BLUE}☁️  Step 4/4: Deploying a Cloudflare Pages...${NC}"

PROJECT_NAME="plataforma-fiscal"

wrangler pages deploy .output/public \
    --project-name="$PROJECT_NAME" \
    --branch=main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ ¡DEPLOYMENT EXITOSO!${NC}"
    echo ""
    echo "=========================================="
    echo "🎉 Tu aplicación está ONLINE"
    echo "=========================================="
    echo ""
    echo "📍 URL: https://$PROJECT_NAME.pages.dev"
    echo ""
    echo "⚙️  Próximos pasos:"
    echo "  1. Configura variables de entorno en Cloudflare Dashboard:"
    echo "     - Pages > $PROJECT_NAME > Settings > Environment variables"
    echo ""
    echo "  2. Agrega estas variables:"
    echo "     NUXT_SESSION_SECRET=<tu-secret-de-32-chars>"
    echo "     DATABASE_ID=<tu-database-id>"
    echo ""
    echo "  3. Ejecuta el seed para crear usuarios de prueba:"
    echo "     wrangler d1 execute $DB_NAME --remote --file=./seed.sql"
    echo ""
    echo "💰 Uso del tier gratuito:"
    echo "  - Pages: ✅ Gratis (100K requests/día)"
    echo "  - D1: ✅ Gratis (10GB, 5M reads/día)"
    echo "  - Workers: ✅ Gratis (100K requests/día)"
    echo ""
    echo "📊 Monitorea tu uso en:"
    echo "  https://dash.cloudflare.com"
    echo ""
else
    echo -e "${RED}❌ Error en el deployment${NC}"
    exit 1
fi
