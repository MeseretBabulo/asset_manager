#!/usr/bin/env bash
# Runs ON the cPanel server (via .github/workflows/server-ssl.yml).
# MODE=check : show domains, DNS and SSL state only
# MODE=fix   : also add the root domain's DNS zone if CAA lookups fail, then run AutoSSL
set -u
APP_DOMAIN="${APP_DOMAIN:-farm.booksbabu.org}"
ROOT_DOMAIN="${ROOT_DOMAIN:-booksbabu.org}"
MODE="${MODE:-check}"

caa() { host -t CAA "$ROOT_DOMAIN" 8.8.8.8 2>&1 | tail -1; }
line() { echo; echo "===== $* ====="; }

line "Domains on this account"
uapi --output=yaml DomainInfo list_domains 2>&1 | grep -vE '^(---|  *metadata|  *transformed|  *errors: ~|  *messages: ~|  *warnings: ~|  *status: 1)' | head -30

line "DNS"
echo "A    $APP_DOMAIN : $(host -t A "$APP_DOMAIN" 8.8.8.8 2>&1 | tail -1)"
echo "CAA  $ROOT_DOMAIN : $(caa)"

if [ "$MODE" = "fix" ] && caa | grep -qiE 'SERVFAIL|REFUSED'; then
  line "Adding $ROOT_DOMAIN so its DNS zone exists (document root: public_html)"
  cpapi2 --output=yaml AddonDomain addaddondomain newdomain="$ROOT_DOMAIN" subdomain=booksbabuorg dir=public_html 2>&1 \
    | grep -iE 'result|reason|error' | head -10
  echo "Waiting 60s for DNS…"; sleep 60
  echo "CAA  $ROOT_DOMAIN now: $(caa)"
fi

if [ "$MODE" = "fix" ]; then
  line "Running AutoSSL"
  uapi --output=yaml SSL start_autossl_check 2>&1 | grep -iE 'status|error|reason' | head -5
  for i in $(seq 1 24); do
    sleep 10
    uapi --output=yaml SSL is_autossl_check_in_progress 2>&1 | grep -qE 'data: 1' || break
  done
  echo "AutoSSL finished (or still running after 4 min)."
fi

line "Certificate currently installed for $APP_DOMAIN"
echo | openssl s_client -connect "$APP_DOMAIN:443" -servername "$APP_DOMAIN" 2>/dev/null \
  | openssl x509 -noout -issuer -subject -enddate 2>/dev/null || echo "(no certificate answered)"

line "AutoSSL problems reported for $APP_DOMAIN / $ROOT_DOMAIN"
uapi --output=yaml SSL get_autossl_problems 2>&1 | grep -B1 -A3 -iE "$APP_DOMAIN|$ROOT_DOMAIN" | grep -iE 'domain|problem|time' | tail -12 || true
