#!/bin/bash
# Status line: 📁 branch · model (effort) · context bar · 💰 cost · 🕒 5h limit · 📅 7d limit
input=$(cat)

eval "$(echo "$input" | jq -r '
  @sh "cwd=\(.workspace.current_dir // .cwd // ".")",
  @sh "model=\(.model.display_name // "?")",
  @sh "effort=\(.effort.level // "")",
  @sh "thinking=\(if .thinking.enabled == true then "thinking" else "" end)",
  @sh "ctx=\(.context_window.used_percentage // "")",
  @sh "ctx_size=\(.context_window.context_window_size // "")",
  @sh "ctx_used=\(.context_window.current_usage
    | if . then (.input_tokens + .cache_creation_input_tokens + .cache_read_input_tokens) else "" end)",
  @sh "cost=\(.cost.total_cost_usd // "")",
  @sh "five=\(.rate_limits.five_hour.used_percentage // "")",
  @sh "week=\(.rate_limits.seven_day.used_percentage // "")",
  @sh "five_reset=\(.rate_limits.five_hour.resets_at // "")",
  @sh "week_reset=\(.rate_limits.seven_day.resets_at // "")"
')"

# Context and limits turn red at or above this percentage, limits also show reset time
WARN_PCT=80
CTX_BAR_WIDTH=10

RESET=$'\e[0m' DIM=$'\e[2m' GREEN=$'\e[32m' RED=$'\e[31m'
SEP=" $DIM·$RESET "

fmt_tokens() {
  awk -v n="$1" 'BEGIN {
    if (n >= 1000000) { s = sprintf("%.1f", n / 1000000); sub(/\.0$/, "", s); printf "%sM", s }
    else if (n >= 1000) printf "%.0fk", n / 1000
    else printf "%d", n
  }'
}

fmt_dur() {
  local s=$1
  if [ "$s" -ge 86400 ]; then echo "$((s / 86400))d$(((s % 86400) / 3600))h"
  elif [ "$s" -ge 3600 ]; then echo "$((s / 3600))h$(((s % 3600) / 60))m"
  elif [ "$s" -ge 60 ]; then echo "$((s / 60))m$((s % 60))s"
  else echo "${s}s"; fi
}

# Filled cells in $2, empty cells dimmed
ctx_bar() {
  local pct=$1 color=$2 filled full empty
  filled=$((pct * CTX_BAR_WIDTH / 100))
  [ "$filled" -gt "$CTX_BAR_WIDTH" ] && filled=$CTX_BAR_WIDTH
  printf -v full '%*s' "$filled" ''
  printf -v empty '%*s' "$((CTX_BAR_WIDTH - filled))" ''
  printf '%s%s%s%s%s' "$color" "${full// /█}" "$RESET$DIM" "${empty// /░}" "$RESET"
}

# "5h 83% (↻1h12m)", red with reset time at or above the threshold
fmt_limit() {
  local label=$1 pct=$2 reset=$3 r
  [ -z "$pct" ] && { printf '%s%s -%s' "$DIM" "$label" "$RESET"; return; }
  pct=$(printf '%.0f' "$pct")
  if [ "$pct" -lt "$WARN_PCT" ]; then
    printf '%s%s%s %s%s%%%s' "$DIM" "$label" "$RESET" "$GREEN" "$pct" "$RESET"
    return
  fi
  printf '%s%s%s %s%s%%%s' "$DIM" "$label" "$RESET" "$RED" "$pct" "$RESET"
  [ -n "$reset" ] || return
  # resets_at may be epoch seconds or an ISO 8601 string
  [[ $reset =~ ^[0-9]+$ ]] || reset=$(date -d "$reset" +%s 2>/dev/null) || return
  r=$((reset - $(date +%s)))
  [ "$r" -lt 0 ] && r=0
  printf ' %s(↻%s)%s' "$DIM" "$(fmt_dur "$r")" "$RESET"
}

parts=()

branch=$(git --no-optional-locks -C "$cwd" branch --show-current 2>/dev/null)
[ -n "$branch" ] && parts+=("📁 $GREEN$branch$RESET")

details="$effort${effort:+${thinking:+ }}$thinking"
parts+=("$GREEN$model$RESET${details:+ $DIM($details)$RESET}")

if [ -n "$ctx" ]; then
  ctx=$(printf '%.0f' "$ctx")
  ctx_color=$GREEN
  [ "$ctx" -ge "$WARN_PCT" ] && ctx_color=$RED
  [ -z "$ctx_used" ] && [ -n "$ctx_size" ] && ctx_used=$((ctx * ctx_size / 100))
  ctx_abs=""
  [ -n "$ctx_used" ] && [ -n "$ctx_size" ] && ctx_abs=" $DIM$(fmt_tokens "$ctx_used")/$(fmt_tokens "$ctx_size")$RESET"
  parts+=("$(ctx_bar "$ctx" "$ctx_color") $ctx_color$ctx%$RESET$ctx_abs")
fi

[ -n "$cost" ] && parts+=("💰 $GREEN\$$(printf '%.2f' "$cost")$RESET")

parts+=("🕒 $(fmt_limit 5h "$five" "$five_reset")")
parts+=("📅 $(fmt_limit 7d "$week" "$week_reset")")

out=""
for part in "${parts[@]}"; do out="${out:+$out$SEP}$part"; done
printf '%s' "$out"
