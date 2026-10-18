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
