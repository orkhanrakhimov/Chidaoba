-- CHIDAOBA update 016: a designed welcome email and a real unsubscribe link.
-- Safe to run more than once.

-- every subscriber gets a private unsubscribe code (used only in the link in their emails)
alter table public.subscribers add column if not exists unsub_token uuid not null default gen_random_uuid();
create unique index if not exists subscribers_unsub_token_idx on public.subscribers(unsub_token);

-- the unsubscribe page calls this: {"t": code} unsubscribes, {"t": code, "again": true} subscribes again
create or replace function public.unsubscribe(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_t uuid; v_n int;
begin
  begin v_t := (p->>'t')::uuid; exception when others then v_t := null; end;
  if v_t is null then return jsonb_build_object('error', 'This link is not valid.'); end if;
  update public.subscribers
     set status = case when coalesce(p->>'again', '') in ('true', 'yes', '1') then 'active' else 'unsubscribed' end
   where unsub_token = v_t;
  get diagnostics v_n = row_count;
  if v_n = 0 then return jsonb_build_object('error', 'This link is not valid.'); end if;
  return jsonb_build_object('ok', true);
end; $$;
revoke all on function public.unsubscribe(jsonb) from public;
grant execute on function public.unsubscribe(jsonb) to anon, authenticated;

-- the email, in English or Georgian
create or replace function public.welcome_email(s public.subscribers) returns jsonb
language plpgsql stable set search_path = public as $$
declare ka boolean := coalesce(s.lang, 'en') = 'ka';
        site text := case when ka then 'https://chidaoba.com/ka' else 'https://chidaoba.com' end;
        unsub text := site || '/unsubscribe/?t=' || s.unsub_token::text;
        t_subject text; t_h text; t_p1 text; t_p2 text; t_btn text; t_q text; t_why text; t_un text; html text;
begin
  if ka then
    t_subject := 'მოგესალმებით CHIDAOBA-ში';
    t_h   := 'მადლობა გამოწერისთვის';
    t_p1  := 'ახალი ბანაკისა და ახალი პროდუქციის შესახებ პირველი თქვენ შეიტყობთ.';
    t_p2  := 'წელიწადში რამდენიმე წერილს გამოგიგზავნით.';
    t_btn := 'ბანაკების ნახვა';
    t_q   := 'კითხვა გაქვთ? უპასუხეთ ამ წერილს ან მოგვწერეთ WhatsApp-ზე: +995 595 606 670.';
    t_why := 'ამ წერილს იღებთ, რადგან chidaoba.com-ზე გამოიწერეთ სიახლეები.';
    t_un  := 'გამოწერის გაუქმება';
  else
    t_subject := 'Welcome to CHIDAOBA';
    t_h   := 'Thank you for signing up';
    t_p1  := 'You will be the first to hear when a new camp opens and when new products arrive.';
    t_p2  := 'We send a few emails a year.';
    t_btn := 'See the camps';
    t_q   := 'Questions? Reply to this email or write to us on WhatsApp: +995 595 606 670.';
    t_why := 'You receive this email because you signed up at chidaoba.com.';
    t_un  := 'Unsubscribe';
  end if;
  html :=
    '<div style="margin:0;padding:24px 12px;background:#F2F1EC">'
 || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1E1E1E">'
 || '<tr><td style="background:#1E1E1E;border-radius:18px 18px 0 0;padding:26px 32px">'
 || '<a href="' || site || '/" style="color:#F2F1EC;text-decoration:none;font-size:20px;font-weight:bold;letter-spacing:3px">CHIDAOBA</a></td></tr>'
 || '<tr><td style="background:#FFFFFF;border-radius:0 0 18px 18px;padding:34px 32px 30px">'
 || '<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#1E1E1E">' || t_h || '</h1>'
 || '<p style="margin:0 0 10px;font-size:16px;line-height:1.6">' || t_p1 || '</p>'
 || '<p style="margin:0 0 26px;font-size:16px;line-height:1.6">' || t_p2 || '</p>'
 || '<a href="' || site || '/camps/" style="display:inline-block;background:#B5212F;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 26px;border-radius:999px">' || t_btn || '</a>'
 || '<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #E4E2DA;font-size:14px;line-height:1.6;color:#55554F">' || t_q || '</p>'
 || '</td></tr>'
 || '<tr><td style="padding:18px 32px 0;font-size:12px;line-height:1.6;color:#77776F">' || t_why
 || ' <a href="' || unsub || '" style="color:#77776F;text-decoration:underline">' || t_un || '</a>'
 || '<br><a href="https://www.instagram.com/chidaobaculture/" style="color:#77776F">@chidaobaculture</a> &nbsp; <a href="' || site || '/" style="color:#77776F">chidaoba.com</a></td></tr>'
 || '</table></div>';
  return jsonb_build_object('subject', t_subject, 'html', html, 'unsubscribe', unsub);
end; $$;

-- send it right after a new signup is saved (now with the unsubscribe link in the email headers too)
create or replace function public.send_welcome() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare k text; m public.mail_settings; e jsonb;
begin
  select * into m from public.mail_settings where id = 1;
  if m is null or not m.enabled then return new; end if;
  select decrypted_secret into k from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if k is null then return new; end if;                       -- no key yet: do nothing
  if (select count(*) from public.subscribers where welcomed_at > now() - interval '1 hour') >= 60 then return new; end if;
  e := public.welcome_email(new);
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || k, 'Content-Type', 'application/json'),
    body := jsonb_build_object('from', m.from_addr, 'to', jsonb_build_array(new.email), 'reply_to', m.reply_to,
                               'subject', e->>'subject', 'html', e->>'html',
                               'headers', jsonb_build_object('List-Unsubscribe', '<' || (e->>'unsubscribe') || '>')));
  update public.subscribers set welcomed_at = now() where id = new.id;
  return new;
exception when others then
  return new;                                                  -- never block a signup because of email
end; $$;
