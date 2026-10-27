-- RESET: buka kembali kode ALEXDROID supaya bisa dites lagi.
-- Jalankan di Supabase > SQL Editor setiap kali mau tes ulang.
update public.archive set status='unused', session_hash=null, lease_until=null, completed_at=null;
delete from public.attempts;
select status from public.archive;  -- harus tertulis: unused
