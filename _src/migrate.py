"""Applies new database updates in _src/migrations/ to Supabase, in order, each exactly once.

Runs in GitHub Actions (see .github/workflows/supabase-updates.yml). It uses Supabase's Management API
("run a SQL query"), so it needs only a personal access token, stored as the repository secret
SUPABASE_ACCESS_TOKEN. Nothing secret is printed or written anywhere.

Which updates already ran is kept in the table public._migrations. Updates 001 to 007 were run by hand
before this existed and are recorded as done on the first run.
"""
import glob, json, os, sys, urllib.request, urllib.error

REF = os.environ.get("SUPABASE_PROJECT_REF", "tptxyvslbdkyypkmemig")
TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip()
API = os.environ.get("SUPABASE_API", "https://api.supabase.com")
HERE = os.path.dirname(os.path.abspath(__file__))
DONE_BY_HAND = ["001", "002", "003", "004", "005", "006", "007"]


def run(sql):
    req = urllib.request.Request(f"{API}/v1/projects/{REF}/database/query", data=json.dumps({"query": sql}).encode(),
                                 headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json",
                                          "User-Agent": "chidaoba-migrations"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            body = r.read().decode() or "[]"
            return json.loads(body)
    except urllib.error.HTTPError as e:
        msg = e.read().decode()[:2000]
        hint = " (check the SUPABASE_ACCESS_TOKEN secret)" if e.code in (401, 403) else ""
        raise SystemExit(f"Supabase answered {e.code}{hint}: {msg}")
    except urllib.error.URLError as e:
        raise SystemExit(f"Could not reach Supabase: {e.reason}")


def main():
    if not TOKEN:
        raise SystemExit("SUPABASE_ACCESS_TOKEN is not set. Add it once in GitHub: Settings > Secrets and variables > Actions > New repository secret.")
    run("create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now());"
        "alter table public._migrations enable row level security;"
        + "".join(f"insert into public._migrations(name) values ('{n}') on conflict do nothing;" for n in DONE_BY_HAND))
    done = {r["name"] for r in run("select name from public._migrations;")}
    files = sorted(glob.glob(os.path.join(HERE, "migrations", "*.sql")))
    todo = [f for f in files if os.path.basename(f).split("_")[0] not in done]
    if not todo:
        print("Database is up to date. Nothing to apply.")
    for f in todo:
        name = os.path.basename(f).split("_")[0]
        sql = open(f, encoding="utf-8").read()
        print(f"Applying {os.path.basename(f)} ...")
        run("begin;\n" + sql + f"\n;insert into public._migrations(name) values ('{name}');\ncommit;")
        print(f"  done: {name}")
    if todo:
        print(f"Applied {len(todo)} update(s).")
    report()


def report():
    """Structure and counts only, never row contents: safe for a public log."""
    print("\n--- Database health ---")
    q = {
        "tables (rls on?)": "select c.relname || ' rls=' || c.relrowsecurity || ' rows=' || (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.' || quote_ident(c.relname), false, true, '')))[1]::text as x "
                            "from pg_class c join pg_namespace n on n.oid = c.relnamespace "
                            "where n.nspname = 'public' and c.relkind = 'r' order by 1",
        "tables without rls": "select c.relname as x from pg_class c join pg_namespace n on n.oid = c.relnamespace "
                              "where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity",
        "definer functions without search_path": "select p.proname as x from pg_proc p join pg_namespace n on n.oid = p.pronamespace "
                                                 "where n.nspname = 'public' and p.prosecdef and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')",
        "storage policies": "select policyname || ' ' || cmd as x from pg_policies where schemaname = 'storage' order by 1",
        "camps": "select slug || ' ' || status as x from public.camps order by created_at",
        "updates applied": "select string_agg(name, ' ' order by name) as x from public._migrations",
    }
    for label, sql in q.items():
        try:
            rows = [r.get("x") for r in run(sql) if r.get("x") is not None]
        except SystemExit as e:
            rows = [f"(could not read: {str(e)[:120]})"]
        print(f"{label}: " + ("none" if not rows else ""))
        for r in rows:
            print(f"  {r}")


if __name__ == "__main__":
    main()
