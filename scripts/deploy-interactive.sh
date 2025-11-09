#!/bin/bash

# ====================================
# Deploy Interactivo a Cloudflare
# ====================================

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║    🚀 PLATAFORMA FISCAL - DEPLOY A CLOUDFLARE             ║"
echo "║                                                           ║"
echo "║    Deployment interactivo paso a paso                     ║"
echo "║    Todo el proceso tomará ~5 minutos                      ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Verificar wrangler
echo -e "${BLUE}🔍 Verificando Wrangler CLI...${NC}"
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler no está instalado${NC}"
    echo ""
    echo "Instala con:"
    echo "  npm install -g wrangler"
    exit 1
fi
echo -e "${GREEN}✅ Wrangler instalado ($(wrangler --version))${NC}"
echo ""

# Paso 1: Login
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASO 1/7: Autenticación${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if wrangler whoami &> /dev/null; then
    echo -e "${GREEN}✅ Ya estás autenticado en Cloudflare${NC}"
    echo ""
    wrangler whoami
else
    echo -e "${YELLOW}⚠️  No estás autenticado${NC}"
    echo ""
    echo "Presiona Enter para abrir el navegador y autenticarte..."
    read
    wrangler login

    if wrangler whoami &> /dev/null; then
        echo -e "${GREEN}✅ Autenticación exitosa${NC}"
    else
        echo -e "${RED}❌ Autenticación fallida${NC}"
        exit 1
    fi
fi

echo ""
read -p "Presiona Enter para continuar..."
clear

# Paso 2: Crear Database D1
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASO 2/7: Crear Database D1${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

DB_NAME="fiscal_platform_db"
DB_EXISTS=$(wrangler d1 list | grep "$DB_NAME" || true)

if [ -z "$DB_EXISTS" ]; then
    echo -e "${YELLOW}⚠️  Database no existe, creando...${NC}"
    echo ""

    wrangler d1 create "$DB_NAME" > /tmp/d1_output.txt

    # Extraer database_id
    DB_ID=$(grep "database_id" /tmp/d1_output.txt | awk -F'"' '{print $2}')

    echo ""
    echo -e "${GREEN}✅ Database creada exitosamente${NC}"
    echo ""
    echo -e "${YELLOW}📝 Database ID: ${DB_ID}${NC}"
    echo ""

    # Actualizar wrangler.toml
    echo "Actualizando wrangler.toml..."
    sed -i "s/database_id = \".*\"/database_id = \"$DB_ID\"/" wrangler.toml
    echo -e "${GREEN}✅ wrangler.toml actualizado${NC}"
else
    echo -e "${GREEN}✅ Database ya existe${NC}"

    # Intentar extraer ID del wrangler.toml
    DB_ID=$(grep "database_id" wrangler.toml | awk -F'"' '{print $2}')

    if [ "$DB_ID" == "your-database-id" ] || [ -z "$DB_ID" ]; then
        echo ""
        echo -e "${YELLOW}⚠️  Necesitas actualizar el database_id en wrangler.toml${NC}"
        echo ""
        echo "Ejecuta:"
        echo "  wrangler d1 list"
        echo ""
        echo "Y copia el database_id a wrangler.toml línea 9"
        exit 1
    fi
fi

echo ""
read -p "Presiona Enter para continuar..."
clear

# Paso 3: Generar Schema SQL
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASO 3/7: Generar Schema SQL${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo "Generando schema con Drizzle..."
npm run db:generate

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Schema SQL generado${NC}"
else
    echo -e "${RED}❌ Error generando schema${NC}"
    exit 1
fi

echo ""
read -p "Presiona Enter para continuar..."
clear

# Paso 4: Aplicar Migraciones
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASO 4/7: Aplicar Migraciones a D1${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo "Aplicando migraciones a la database remota..."
echo ""

wrangler d1 migrations apply "$DB_NAME" --remote

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migraciones aplicadas${NC}"
else
    echo -e "${RED}❌ Error aplicando migraciones${NC}"
    exit 1
fi

echo ""
read -p "Presiona Enter para continuar..."
clear

# Paso 5: Build
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASO 5/7: Build del Proyecto${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo "Compilando proyecto (esto puede tomar 1-2 minutos)..."
echo ""

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Build completado${NC}"
else
    echo -e "${RED}❌ Error en el build${NC}"
    exit 1
fi

echo ""
read -p "Presiona Enter para continuar..."
clear

# Paso 6: Deploy
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASO 6/7: Deploy a Cloudflare Pages${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo "Deploying a Cloudflare Pages..."
echo ""

wrangler pages deploy .output/public --project-name=plataforma-fiscal

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deploy completado${NC}"
else
    echo -e "${RED}❌ Error en el deploy${NC}"
    exit 1
fi

echo ""
read -p "Presiona Enter para continuar..."
clear

# Paso 7: Configurar Variables
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PASO 7/7: Configurar Variables de Entorno${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo "Generando session secret..."
SESSION_SECRET=$(openssl rand -base64 32)

echo -e "${GREEN}✅ Session secret generado${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Ahora necesitas configurar las variables de entorno en Cloudflare:"
echo ""
echo "1. Ve a: ${BLUE}https://dash.cloudflare.com${NC}"
echo "2. Pages > plataforma-fiscal > Settings > Environment variables"
echo "3. Agrega estas 2 variables:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}Variable 1:${NC}"
echo "  Name: NUXT_SESSION_SECRET"
echo "  Value: $SESSION_SECRET"
echo "  Environment: Production"
echo ""
echo -e "${GREEN}Variable 2:${NC}"
echo "  Name: DATABASE_ID"
echo "  Value: $DB_ID"
echo "  Environment: Production"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "4. Guarda las variables"
echo "5. Ve a: Deployments > Retry deployment"
echo ""

# Guardar valores en archivo
cat > .env.production << EOF
# Variables de Entorno para Cloudflare Pages
# Configúralas en: Dashboard > Settings > Environment variables

NUXT_SESSION_SECRET=$SESSION_SECRET
DATABASE_ID=$DB_ID
EOF

echo -e "${GREEN}✅ Variables guardadas en .env.production${NC}"
echo ""

read -p "Presiona Enter cuando hayas configurado las variables..."
clear

# Resumen Final
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║    ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE                  ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "🎉 Tu aplicación está deployada en Cloudflare Pages"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📍 URL de la aplicación:${NC}"
echo "   https://plataforma-fiscal.pages.dev"
echo ""
echo -e "${BLUE}📊 Dashboard de Cloudflare:${NC}"
echo "   https://dash.cloudflare.com"
echo ""
echo -e "${BLUE}📈 Monitoreo:${NC}"
echo "   Pages > plataforma-fiscal > Analytics"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   1. Verifica que las variables de entorno estén configuradas"
echo "   2. Haz Retry del deployment para aplicar las variables"
echo "   3. Espera 1-2 minutos para que el deployment se complete"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}💰 Costo total: \$0/mes${NC} (tier gratuito)"
echo ""
echo -e "${BLUE}📚 Próximos pasos:${NC}"
echo "   - Seed de datos: Ver DEPLOYMENT.md"
echo "   - Monitorear uso: Dashboard > Analytics"
echo "   - Dominio custom: Pages > Custom domains"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}¡Disfruta tu aplicación! 🎊${NC}"
echo ""
