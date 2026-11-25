-- 020: welcome email shows the CHIDAOBA logo (image hosted on the site) in the black bar.
-- Safe to run twice (replaces the function).
create or replace function public.welcome_email(s public.subscribers) returns jsonb
language plpgsql stable set search_path = public as $$
declare ka boolean := coalesce(s.lang, 'en') = 'ka';
        site text := case when ka then 'https://chidaoba.com/ka' else 'https://chidaoba.com' end;
        unsub text := site || '/unsubscribe/?t=' || s.unsub_token::text;
        t_subject text; t_h text; t_p1 text; t_btn text; t_btn2 text; t_why text; t_un text; html text;
begin
  if ka then
    t_subject := 'მოგესალმებით CHIDAOBA-ში';
    t_h   := 'გმადლობთ';
    t_p1  := 'ახალი ბანაკების, სიახლეებისა და ახალი პროდუქციის შესახებ პირველი თქვენ შეიტყობთ.';
    t_btn := 'ბანაკები';
    t_btn2 := 'მაღაზია';
    t_why := 'ამ წერილს იღებთ, რადგან chidaoba.com-ზე გამოიწერეთ სიახლეები.';
    t_un  := 'გამოწერის გაუქმება';
  else
    t_subject := 'Welcome to CHIDAOBA';
    t_h   := 'Thank you';
    t_p1  := 'You will be the first to hear about upcoming camps, news and new merch drops.';
    t_btn := 'Camps';
    t_btn2 := 'Shop';
    t_why := 'You receive this email because you signed up at chidaoba.com.';
    t_un  := 'Unsubscribe';
  end if;
  html :=
    '<div style="margin:0;padding:24px 12px;background:#F2F1EC">'
 || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1E1E1E">'
 || '<tr><td style="background:#1E1E1E;border-radius:18px 18px 0 0;padding:22px 32px">'
 || '<a href="' || site || '/" style="color:#F2F1EC;text-decoration:none;font-size:20px;font-weight:bold;letter-spacing:3px">'
 || '<img src="https://chidaoba.com/assets/img/email-logo.png" width="201" height="44" alt="CHIDAOBA" style="display:block;border:0;width:201px;height:44px;color:#F2F1EC;font-size:20px;font-weight:bold;letter-spacing:3px"></a></td></tr>'
 || '<tr><td style="background:#FFFFFF;border-radius:0 0 18px 18px;padding:34px 32px 24px">'
 || '<h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#1E1E1E">' || t_h || '</h1>'
 || '<p style="margin:0 0 28px;font-size:17px;line-height:1.6">' || t_p1 || '</p>'
 || '<div style="font-size:0;line-height:0">'
 || '<a href="' || site || '/camps/" style="display:inline-block;margin:0 10px 10px 0;line-height:1.2;min-width:72px;text-align:center;background:#B5212F;border:2px solid #B5212F;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:bold;padding:12px 22px;border-radius:999px">' || t_btn || '</a>'
 || '<a href="' || site || '/shop/" style="display:inline-block;margin:0 10px 10px 0;line-height:1.2;min-width:72px;text-align:center;background:#1E1E1E;border:2px solid #1E1E1E;color:#F2F1EC;text-decoration:none;font-size:16px;font-weight:bold;padding:12px 22px;border-radius:999px">' || t_btn2 || '</a>'
 || '</div>'
 || '</td></tr>'
 || '<tr><td style="padding:18px 32px 0;font-size:12px;line-height:1.6;color:#77776F">' || t_why
 || ' <a href="' || unsub || '" style="color:#77776F;text-decoration:underline">' || t_un || '</a>'
 || '<br><a href="https://www.instagram.com/chidaobaculture/" style="color:#77776F">@chidaobaculture</a> &nbsp; <a href="' || site || '/" style="color:#77776F">chidaoba.com</a></td></tr>'
 || '</table></div>';
  return jsonb_build_object('subject', t_subject, 'html', html, 'unsubscribe', unsub);
end; $$;
