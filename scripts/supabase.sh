#!/bin/sh
set -eu
repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
exec supabase --workdir "$repo_dir" --profile "$repo_dir/supabase/cli-profile.toml" "$@"
