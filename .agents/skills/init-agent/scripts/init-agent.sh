#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

mkdir -p .agents/skills .agents/commands .agents/rules

ensure_symlink() {
  local dir="$1"
  local name="$2"
  local target="$3"
  local parent="$ROOT/$dir"
  local path="$parent/$name"

  mkdir -p "$parent"

  if [[ -L "$path" ]]; then
    local current
    current="$(readlink "$path")"
    if [[ "$current" == "$target" ]]; then
      return 0
    fi
    echo "init-agent: wrong symlink $path -> $current (expected $target); remove it and re-run." >&2
    exit 1
  fi

  if [[ -e "$path" ]]; then
    echo "init-agent: refusing to replace $path (exists and is not a symlink)." >&2
    exit 1
  fi

  ln -s "$target" "$path"
}

for tool in .cursor .claude .codex; do
  ensure_symlink "$tool" "skills" "../.agents/skills"
  ensure_symlink "$tool" "commands" "../.agents/commands"
  ensure_symlink "$tool" "rules" "../.agents/rules"
done

if [[ ! -f "$ROOT/AGENTS.md" ]]; then
  cat >"$ROOT/AGENTS.md" <<'EOF'
# Agents

Canonical agent assets live under `.agents/` (skills, commands, rules). Tool-specific folders symlink here via `init-agent`.
EOF
fi

ensure_agents_alias() {
  local alias="$1"
  local path="$ROOT/$alias"
  if [[ -L "$path" ]]; then
    local current
    current="$(readlink "$path")"
    if [[ "$current" == "AGENTS.md" ]]; then
      return 0
    fi
    echo "init-agent: $alias is a symlink to unexpected target: $current" >&2
    exit 1
  elif [[ -e "$path" ]]; then
    echo "init-agent: refusing to replace $alias (exists and is not the expected symlink)." >&2
    exit 1
  else
    ln -s AGENTS.md "$path"
  fi
}

ensure_agents_alias CLAUDE.md
ensure_agents_alias GEMINI.md

echo "init-agent: done (repo root: $ROOT)"
