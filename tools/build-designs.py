"""Assemble the design folders (ivory-editorial/, teal-boutique/) from the main site.

Each folder keeps its own views.js / actions.js / css/styles.css. This script:
  - copies js/data.js and js/catalog-real.js, pointing image paths at ../assets (images are not duplicated)
  - builds js/app.js = main js/app.js + the folder's views.js (before PAGES) + actions.js (before the event listeners)
Run from the project root:  python tools/build-designs.py
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESIGNS = ['ivory-editorial', 'teal-boutique', 'gilded-gallery']


def read(p):
    return open(os.path.join(ROOT, p), encoding='utf8').read()


def write(p, s):
    open(os.path.join(ROOT, p), 'w', encoding='utf8', newline='\n').write(s)


for d in DESIGNS:
    if not os.path.exists(os.path.join(ROOT, d, 'js', 'views.js')):
        continue
    for f in ['data.js', 'catalog-real.js', 'catalog-purple.js']:
        write(f'{d}/js/{f}', read(f'js/{f}').replace("'assets/", "'../assets/"))
    app = read('js/app.js')
    views = read(f'{d}/js/views.js')
    actions = read(f'{d}/js/actions.js')
    a = app.index('  const PAGES =')
    app = app[:a] + views + '\n' + app[a:]
    b = app.index("  document.addEventListener('click'")
    app = app[:b] + actions + '\n' + app[b:]
    write(f'{d}/js/app.js', app)
    base = '\n'.join(l for l in read('css/styles.css').split('\n') if not l.startswith('@import'))
    write(f'{d}/css/styles.css', '/* Built by tools/build-designs.py: main stylesheet + theme.css. Edit theme.css, not this file. */\n'
          + base + '\n' + read(f'{d}/css/theme.css'))
    print('built', d)


# ── Colour / nav variants of Ivory Editorial ──────────────────────────────
# Each variant is generated from ivory-editorial (same pages and features), with its colours swapped
# and, for the "-dark" versions, a dark navigation bar. Edit ivory-editorial, then rebuild.
TEAL = [  # Ivory Editorial plum/lavender → teal
    ('#2b2741', '#0d3d45'), ('#423a6a', '#155763'), ('#6f62b8', '#1b7c86'), ('#5d5294', '#136670'),
    ('#c4bbf5', '#9fd8dc'), ('#ebe8fd', '#e1f1f1'), ('#f3f1ff', '#eff8f7'), ('#f8f0f6', '#eef6f3'),
    ('#e9e6fd', '#e2f3f3'), ('#cfd0e3', '#c4dfe0'), ('#b0b2cc', '#9fc4c6'), ('#9a9cb8', '#88afb2'),
    ('#4a4278', '#17606b'), ('#3a2f55', '#0a3038'),
    ('rgba(43, 39, 65', 'rgba(13, 61, 69'), ('rgba(233, 230, 253', 'rgba(226, 243, 243'),
    ('rgba(196, 187, 245', 'rgba(159, 216, 220'), ('rgba(207, 208, 227', 'rgba(196, 223, 224'), ('rgba(20, 18, 32', 'rgba(5, 27, 31'),
]
DARK_NAV = """
/* ── Variant: dark navigation bar ── */
.iv-top { background: #ebe8fd; color: #2b2741; }
.iv-social { border-left-color: rgba(43, 39, 65, .2); }
.iv-social a:hover { background: rgba(43, 39, 65, .08); }
.iv-head { background: rgba(43, 39, 65, .97); border-bottom-color: rgba(233, 230, 253, .12); }
.iv-nav a, .iv-right a, .iv-iconbtn, .iv-head .iv-label { color: #f3f1ff; }
.iv-nav a:hover, .iv-right a:hover, .iv-iconbtn:hover, .iv-nav a[aria-current], .iv-right a[aria-current] { color: #c4bbf5; }
.iv-burger { color: #f3f1ff; border-color: rgba(233, 230, 253, .3); }
@media (max-width: 1024px) { .iv-nav { background: #2b2741; border-bottom-color: rgba(233, 230, 253, .12); } }
"""
VARIANTS = {
    'ivory-editorial-dark': {'swap': [], 'dark_nav': True, 'studio': 'purple'},
    'ivory-editorial-teal': {'swap': TEAL, 'dark_nav': False, 'studio': 'ivory'},
    'ivory-editorial-teal-dark': {'swap': TEAL, 'dark_nav': True, 'studio': 'ivory', 'hero_picker': True},
}
SRC = 'ivory-editorial'


def swap(text, pairs):
    for a, b in pairs:
        text = text.replace(a, b).replace(a.upper(), b)
    return text


for v, cfg in VARIANTS.items():
    os.makedirs(os.path.join(ROOT, v, 'js'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, v, 'css'), exist_ok=True)
    for f in ['data.js', 'catalog-purple.js', 'app.js']:
        write(f'{v}/js/{f}', read(f'{SRC}/js/{f}'))
    real = read(f'{SRC}/js/catalog-real.js')
    if cfg['studio'] == 'ivory':   # warm photos suit teal better than the lavender set
        real = real.replace("-cut.jpg'", "-cut-cream.jpg'")
    write(f'{v}/js/catalog-real.js', real)
    html = read(f'{SRC}/index.html')
    if cfg['studio'] == 'ivory':
        html = html.replace('  <script src="js/catalog-purple.js"></script>', '  <script>var STUDIO_SET = \'ivory\';</script>\n  <script src="js/catalog-purple.js"></script>')
    if cfg.get('hero_picker'):   # client trial of hero background colours (tools/hero-picker.*)
        html = html.replace('  <script src="js/app.js"></script>', '  <script src="js/app.js"></script>\n  <script src="js/hero-picker.js"></script>')
        write(f'{v}/js/hero-picker.js', read('tools/hero-picker.js'))
    write(f'{v}/index.html', html)
    base = '\n'.join(l for l in read('css/styles.css').split('\n') if not l.startswith('@import'))
    theme = read(f'{SRC}/css/theme.css') + (DARK_NAV if cfg['dark_nav'] else '')
    write(f'{v}/css/styles.css', f'/* Built by tools/build-designs.py from {SRC}: do not edit. */\n' + base + '\n' + swap(theme, cfg['swap'])
          + (read('tools/hero-picker.css') if cfg.get('hero_picker') else ''))
    print('built', v)
