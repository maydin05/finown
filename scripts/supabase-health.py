#!/usr/bin/env python3
"""Finown yönetim erişimi ve servis sağlığı; yalnız GET kullanır."""
import base64
import datetime
import json
import subprocess
import sys
import urllib.error
import urllib.request

PROJECT_REF = "zowlpzmvwiszwhtvsagj"


def main():
    credential = subprocess.run(
        ["security", "find-generic-password", "-s", "Supabase CLI", "-a", "finown", "-w"],
        capture_output=True, text=True, timeout=15,
    )
    if credential.returncode:
        sys.exit("Finown CLI tokenı bulunamadı. docs/erisim.md giriş adımlarını uygula.")
    token = credential.stdout.strip()
    if token.startswith("go-keyring-base64:"):
        token = base64.b64decode(token.split(":", 1)[1]).decode()
    base = f"https://api.supabase.com/v1/projects/{PROJECT_REF}"
    output = {"checked_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    for label, path in [
        ("project", ""),
        ("services", "/health?services=db,auth,rest,realtime,storage,pooler"),
    ]:
        request = urllib.request.Request(base + path, headers={"Authorization": "Bearer " + token})
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                data = json.load(response)
        except urllib.error.HTTPError as error:
            sys.exit(f"{label}: HTTP {error.code}; erişim doğrulanamadı.")
        if label == "project":
            output[label] = {key: data.get(key) for key in ("id", "name", "region", "status")}
        else:
            output[label] = [
                {key: service.get(key) for key in ("name", "healthy", "status")}
                for service in data
            ]
    print(json.dumps(output, indent=2))
    return int(
        output["project"]["status"] != "ACTIVE_HEALTHY"
        or not output["services"]
        or any(service["healthy"] is not True for service in output["services"])
    )


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, subprocess.TimeoutExpired, urllib.error.URLError) as error:
        sys.exit(f"Sağlık kontrolü tamamlanamadı ({type(error).__name__}).")
