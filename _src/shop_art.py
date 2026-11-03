# Product drawings for the shop. 120x120 viewBox.
# Shapes with class "f" take the product colour (--pc); class "d" are detail lines (--pd).
GI = ('<path class="f" d="M40 22 L60 30 L80 22 L100 34 L108 72 L94 76 L88 54 L88 102 L32 102 L32 54 L26 76 L12 72 L20 34 Z"/>'
      '<path class="d" d="M40 22 L60 66 L80 22 M60 66 L60 102"/>'
      '<rect class="belt" x="31" y="70" width="58" height="8" rx="2"/><path class="belt" d="M55 78 L48 96 L54 97 L59 80 Z M65 78 L72 96 L66 97 L61 80 Z"/>')
ART = {
 "gi": GI,
 "belt": ('<rect class="f" x="14" y="50" width="92" height="14" rx="3"/><rect class="f" x="50" y="44" width="20" height="24" rx="3"/>'
          '<path class="f" d="M54 66 L42 104 L52 106 L60 70 Z M66 66 L78 104 L68 106 L60 70 Z"/><path class="d" d="M50 56 L70 56"/>'),
 "rash": ('<path class="f" d="M42 20 Q60 32 78 20 L98 30 L108 98 L96 100 L88 52 L88 104 L32 104 L32 52 L24 100 L12 98 L22 30 Z"/>'
          '<path class="d" d="M42 20 Q60 32 78 20 M88 52 L88 70 M32 52 L32 70 M44 104 L60 60 L76 104"/>'),
 "rash_ss": ('<path class="f" d="M42 22 Q60 34 78 22 L100 34 L94 56 L86 52 L86 104 L34 104 L34 52 L26 56 L20 34 Z"/>'
             '<path class="d" d="M42 22 Q60 34 78 22 M44 104 L60 62 L76 104"/>'),
 "tshirt": ('<path class="f" d="M40 22 Q60 36 80 22 L104 36 L96 58 L86 53 L86 104 L34 104 L34 53 L24 58 L16 36 Z"/>'
            '<path class="d" d="M40 22 Q60 36 80 22"/>'),
 "hoodie": ('<path class="f" d="M38 30 L82 30 L102 40 L108 98 L96 100 L88 58 L88 104 L32 104 L32 58 L24 100 L12 98 L18 40 Z"/>'
            '<path class="f" d="M42 34 Q40 12 60 12 Q80 12 78 34 Q60 46 42 34 Z"/>'
            '<path class="d" d="M42 34 Q60 46 78 34 M54 42 L54 58 M66 42 L66 58 M42 80 L78 80 L82 96 L38 96 Z M32 98 L88 98"/>'),
 "sweat": ('<path class="f" d="M38 26 L82 26 L102 38 L108 98 L96 100 L88 56 L88 104 L32 104 L32 56 L24 100 L12 98 L18 38 Z"/>'
           '<path class="d" d="M44 26 Q60 40 76 26 M32 96 L88 96 M12 92 L24 94 M96 94 L108 92"/>'),
 "shorts": ('<path class="f" d="M26 26 L94 26 L100 92 L66 96 L60 56 L54 96 L20 92 Z"/>'
            '<path class="d" d="M26 38 L94 38 M60 26 L60 38 M56 38 L52 48 M64 38 L68 48"/>'),
 "cshorts": ('<path class="f" d="M34 24 L86 24 L89 80 L64 84 L60 46 L56 84 L31 80 Z"/>'
            '<path class="d" d="M34 34 L86 34 M80 38 L82 78 M40 38 L38 78"/>'),
 "spats": ('<path class="f" d="M36 16 L84 16 L82 106 L66 106 L60 42 L54 106 L38 106 Z"/>'
           '<path class="d" d="M36 26 L84 26 M76 30 L74 104"/>'),
 "pants": ('<path class="f" d="M32 16 L88 16 L92 106 L68 106 L60 44 L52 106 L28 106 Z"/>'
           '<path class="d" d="M32 26 L88 26 M84 30 L88 98 M28 98 L52 98 M68 98 L92 98"/>'),
 "singlet": ('<path class="f" d="M40 14 L50 14 Q60 34 70 14 L80 14 Q80 40 90 50 L92 86 L76 102 L60 90 L44 102 L28 86 L30 50 Q40 40 40 14 Z"/>'
             '<path class="d" d="M31 66 L89 66 M50 14 Q60 34 70 14"/>'),
 "shoe": ('<path class="f" d="M20 30 L50 26 L56 58 Q82 62 100 70 Q108 74 106 88 L20 88 Z"/>'
          '<path class="d" d="M20 80 L106 80 M50 36 L62 34 M52 44 L66 42 M54 52 L70 50 M30 30 L32 80"/>'),
 "headgear": ('<path class="d thick" d="M32 46 Q60 4 88 46 M36 80 Q60 106 84 80"/>'
              '<circle class="f" cx="30" cy="62" r="19"/><circle class="f" cx="90" cy="62" r="19"/>'
              '<circle class="d" cx="30" cy="62" r="7"/><circle class="d" cx="90" cy="62" r="7"/>'),
 "knee": ('<rect class="f" x="24" y="20" width="30" height="80" rx="15"/><rect class="f" x="66" y="20" width="30" height="80" rx="15"/>'
          '<ellipse class="d" cx="39" cy="60" rx="8" ry="13"/><ellipse class="d" cx="81" cy="60" rx="8" ry="13"/>'),
 "bag": ('<path class="d thick" d="M42 42 Q42 22 60 22 Q78 22 78 42"/>'
         '<path class="f" d="M16 52 Q16 42 26 42 L94 42 Q104 42 104 52 L104 94 L16 94 Z"/>'
         '<path class="d" d="M30 42 L30 94 M90 42 L90 94 M30 54 L90 54"/>'),
 "backpack": ('<path class="d thick" d="M52 20 Q60 8 68 20"/><path class="f" d="M30 36 Q30 18 60 18 Q90 18 90 36 L92 106 L28 106 Z"/>'
              '<rect class="d" x="40" y="66" width="40" height="28" rx="6"/><path class="d" d="M40 76 L80 76"/>'),
 "mouth": ('<path class="f" d="M22 46 Q22 94 60 98 Q98 94 98 46 Q98 36 87 36 Q85 76 60 78 Q35 76 33 36 Q22 36 22 46 Z"/>'
           '<path class="d" d="M30 50 Q34 86 60 88 Q86 86 90 50"/>'),
 "tape": ('<circle class="f" cx="56" cy="56" r="36"/><circle class="hole" cx="56" cy="56" r="14"/>'
          '<path class="f" d="M84 78 L106 100 L98 108 L76 86 Z"/><circle class="d" cx="56" cy="56" r="26"/>'),
 "towel": ('<rect class="f" x="22" y="30" width="76" height="66" rx="8"/><path class="d" d="M22 48 L98 48 M22 80 L98 80 M22 86 L98 86"/>'),
 "slides": ('<rect class="f" x="18" y="30" width="38" height="78" rx="19"/><rect class="f" x="64" y="16" width="38" height="78" rx="19"/>'
            '<rect class="d" x="18" y="46" width="38" height="18" rx="4"/><rect class="d" x="64" y="32" width="38" height="18" rx="4"/>'),
 "bottle": ('<rect class="d thick" x="48" y="8" width="24" height="10" rx="3"/>'
            '<path class="f" d="M48 18 L72 18 L72 28 Q84 34 84 48 L84 104 Q84 110 78 110 L42 110 Q36 110 36 104 L36 48 Q36 34 48 28 Z"/>'
            '<path class="d" d="M36 60 L84 60 M36 92 L84 92"/>'),
 "cap": ('<path class="f" d="M18 74 Q18 32 58 32 Q90 32 92 66 L92 74 Z"/><path class="f" d="M78 70 Q100 66 112 76 Q100 86 78 82 Z"/>'
         '<path class="d" d="M58 32 Q48 50 50 74 M58 32 Q72 50 74 72"/><circle class="d" cx="58" cy="30" r="3"/>'),
 "beanie": ('<circle class="f" cx="60" cy="22" r="10"/><path class="f" d="M24 84 Q24 30 60 30 Q96 30 96 84 Z"/>'
            '<rect class="f" x="20" y="76" width="80" height="22" rx="5"/><path class="d" d="M36 78 L36 96 M48 78 L48 96 M60 78 L60 96 M72 78 L72 96 M84 78 L84 96"/>'),
 "tote": ('<path class="d thick" d="M42 48 Q42 18 60 18 Q78 18 78 48"/><path class="f" d="M24 46 L96 46 L90 108 L30 108 Z"/>'),
}
COLOURS = {"White": "#F7F6F2", "Blue": "#24458F", "Black": "#1E1E1E", "Red": "#B5212F", "Purple": "#5B2D86", "Brown": "#6B4226",
           "Grey": "#8C8C8A", "Yellow": "#E8B923", "Orange": "#E07B1F", "Green": "#2E7D46", "Clear": "#DCE6EA", "Natural": "#E6DCC6"}
DARK = {"Blue", "Black", "Red", "Purple", "Brown", "Green", "Grey"}

def colour_vars(c):
    pc = COLOURS.get(c, "#1E1E1E")
    pd = "rgba(255,255,255,.5)" if c in DARK else "rgba(30,30,30,.45)"
    return f"--pc:{pc};--pd:{pd}"

def art(kind, colour, cls="part"):
    return f'<svg class="{cls}" viewBox="0 0 120 120" style="{colour_vars(colour)}" aria-hidden="true">{ART.get(kind, ART["tshirt"])}</svg>'
