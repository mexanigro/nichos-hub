#!/usr/bin/env bash
# Escanea el staging area por patterns de secretos antes de cada commit.
#
# Instalar como pre-commit hook (Git Bash en Windows):
#   cp scripts/check-secrets.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# Correr manualmente:
#   bash scripts/check-secrets.sh

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

if [[ -z "$STAGED_FILES" ]]; then
  exit 0
fi

SECRETS_FOUND=0

# Archivos peligrosos que nunca deben commitearse
DANGEROUS_FILE_PATTERNS=(
  ".env"
  ".env.production"
  ".env.staging"
  ".env.test"
  "serviceAccountKey.json"
  "serviceAccount.json"
)

for staged_file in $STAGED_FILES; do
  basename_file=$(basename "$staged_file")
  for pattern in "${DANGEROUS_FILE_PATTERNS[@]}"; do
    if [[ "$basename_file" == "$pattern" ]]; then
      echo -e "${RED}[SECRETS] Archivo peligroso en staging: $staged_file${NC}"
      SECRETS_FOUND=1
    fi
  done
  # Extensiones peligrosas
  if [[ "$staged_file" == *.pem ]] || [[ "$staged_file" == *.key ]] || [[ "$staged_file" == *.p12 ]] || [[ "$staged_file" == *.pfx ]]; then
    echo -e "${RED}[SECRETS] Archivo de clave privada en staging: $staged_file${NC}"
    SECRETS_FOUND=1
  fi
done

# Patterns de contenido peligroso
declare -A SECRET_PATTERNS
SECRET_PATTERNS=(
  ["Private key header"]="-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY"
  ["Anthropic API key"]="sk-ant-[a-zA-Z0-9_-]{40,}"
  ["OpenAI API key"]="sk-[a-zA-Z0-9]{32,}"
  ["Google API key"]="AIza[0-9A-Za-z_-]{35}"
  ["Firebase Server key"]="AAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140}"
  ["GitHub token"]="gh[ps]_[a-zA-Z0-9]{36}"
  ["Slack token"]="xox[baprs]-[0-9a-zA-Z-]+"
  ["AWS key"]="AKIA[0-9A-Z]{16}"
  ["Generic high-entropy secret"]="(SECRET|secret|password|PASSWORD|api_key|API_KEY|private_key|PRIVATE_KEY)\s*[=:]\s*['\"][a-zA-Z0-9+/]{32,}['\"]"
)

for staged_file in $STAGED_FILES; do
  [[ -f "$staged_file" ]] || continue

  # Omitir archivos permitidos/binarios
  [[ "$staged_file" == ".env.example" ]] && continue
  [[ "$staged_file" == "package-lock.json" ]] && continue
  [[ "$staged_file" == *.png ]] && continue
  [[ "$staged_file" == *.jpg ]] && continue
  [[ "$staged_file" == *.pdf ]] && continue

  for label in "${!SECRET_PATTERNS[@]}"; do
    pattern="${SECRET_PATTERNS[$label]}"
    if git show ":$staged_file" 2>/dev/null | grep -qP "$pattern" 2>/dev/null; then
      echo -e "${RED}[SECRETS] '$label' detectado en: $staged_file${NC}"
      SECRETS_FOUND=1
    fi
  done
done

if [[ $SECRETS_FOUND -ne 0 ]]; then
  echo -e "${RED}"
  echo "================================================================"
  echo "  COMMIT BLOQUEADO: Se detectaron posibles secretos."
  echo "  Revisá los archivos de arriba y remové los secretos."
  echo "  Para saltear (PELIGROSO): git commit --no-verify"
  echo "================================================================"
  echo -e "${NC}"
  exit 1
fi

echo -e "${GREEN}[check-secrets] OK — no se detectaron secretos en el staging.${NC}"
exit 0
