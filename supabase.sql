-- ALEXDROID: copy SEMUA isi file ini ke Supabase > SQL Editor > Run (cukup sekali).
-- Kode "ALEXDROID" = single-use: setelah selesai tidak bisa dipakai lagi.
-- Mau tes ulang? Jalankan isi file reset.sql dulu.

create table if not exists public.archive(
  id int primary key default 1 check (id = 1),
  code_hash text not null,
  status text not null default 'unused' check (status in ('unused','in_progress','completed')),
  session_hash text, lease_until timestamptz, completed_at timestamptz);
insert into public.archive(code_hash) values (encode(sha256(convert_to('ALEXDROID','UTF8')),'hex')) on conflict do nothing;

create table if not exists public.attempts(id bigserial primary key, ip_hash text not null, at timestamptz default now());

-- RLS aktif tanpa policy: siapa pun yang memakai anon key TIDAK bisa membaca/mengubah tabel secara langsung.
alter table public.archive enable row level security;
alter table public.attempts enable row level security;

create or replace function public.ad_h(t text) returns text language sql immutable as
$$ select encode(sha256(convert_to(t,'UTF8')),'hex') $$;
revoke all on function public.ad_h(text) from public, anon, authenticated;

create or replace function public.ad_start(p_code text) returns jsonb language plpgsql security definer set search_path = public as $$
declare c text := upper(trim(coalesce(p_code,''))); ip text; n int; tok text; r int; st text;
begin
  ip := ad_h(coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-forwarded-for','?'));
  delete from attempts where at < now() - interval '15 minutes';
  select count(*) into n from attempts where ip_hash = ip;
  if n >= 8 then return jsonb_build_object('ok',false,'reason','denied'); end if;
  if ad_h(c) <> (select code_hash from archive where id = 1) then
    insert into attempts(ip_hash) values (ip);
    return jsonb_build_object('ok',false,'reason','denied');
  end if;
  select status into st from archive where id = 1;
  if st = 'completed' then return jsonb_build_object('ok',false,'reason','used'); end if;
  tok := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  -- Klaim atomik: hanya satu sesi yang menang. Sesi yang lease-nya habis (20 menit) boleh diambil alih.
  update archive set status='in_progress', session_hash=ad_h(tok), lease_until=now()+interval '20 minutes'
   where id=1 and (status='unused' or (status='in_progress' and lease_until < now()));
  get diagnostics r = row_count;
  if r = 1 then return jsonb_build_object('ok',true,'mode','final','token',tok); end if;
  return jsonb_build_object('ok',false,'reason','denied');
end $$;

create or replace function public.ad_resume(p_token text) returns jsonb language plpgsql security definer set search_path = public as $$
declare r int;
begin
  update archive set lease_until = now() + interval '20 minutes'
   where id=1 and status='in_progress' and session_hash = ad_h(coalesce(p_token,'')) and lease_until > now();
  get diagnostics r = row_count;
  return jsonb_build_object('ok', r = 1);
end $$;

create or replace function public.ad_complete(p_token text) returns jsonb language plpgsql security definer set search_path = public as $$
declare r int; h text := ad_h(coalesce(p_token,''));
begin
  update archive set status='completed', completed_at=now(), lease_until=null
   where id=1 and status='in_progress' and session_hash = h;
  get diagnostics r = row_count;
  if r = 1 then return jsonb_build_object('ok',true); end if;
  return jsonb_build_object('ok', exists(select 1 from archive where id=1 and status='completed' and session_hash=h)); -- idempoten
end $$;

grant execute on function public.ad_start(text), public.ad_resume(text), public.ad_complete(text) to anon, authenticated;

-- ===== ALAT ADMIN (jalankan manual di SQL Editor kalau perlu) =====
-- Buka kembali kode final (misal setelah salah pakai):
--   update public.archive set status='unused', session_hash=null, lease_until=null, completed_at=null;
-- Cek status kode final:
--   select status, completed_at from public.archive;
-- Ganti kode final jadi KODEBARU (tulis HURUF BESAR):
--   update public.archive set code_hash = encode(sha256(convert_to('KODEBARU','UTF8')),'hex'), status='unused', session_hash=null, lease_until=null, completed_at=null;
