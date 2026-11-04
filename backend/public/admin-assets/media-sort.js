/* Product photos in the admin: drag to reorder (or use the ◀ ▶ buttons on touch screens).
   The hidden order fields are renumbered 0, 1, 2… on every change; Save stores the order. */
(() => {
  const box = document.querySelector('.media[data-sortable]');
  if (!box) return;
  const items = () => [...box.querySelectorAll(':scope > figure')];
  const renumber = () => items().forEach((fig, i) => {
    fig.querySelector('.media-sort').value = i;
    fig.classList.toggle('is-main', i === 0);
    fig.querySelector('[data-move="-1"]').disabled = i === 0;
    fig.querySelector('[data-move="1"]').disabled = i === items().length - 1;
  });
  let dragged = null;
  box.addEventListener('dragstart', e => {
    dragged = e.target.closest('figure');
    if (!dragged) return;
    dragged.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  });
  box.addEventListener('dragover', e => {
    if (!dragged) return;
    e.preventDefault();
    const over = e.target.closest('figure');
    if (!over || over === dragged) return;
    const r = over.getBoundingClientRect();
    const after = (e.clientX - r.left) > r.width / 2;   // drop on the right half = after that photo
    box.insertBefore(dragged, after ? over.nextSibling : over);
  });
  box.addEventListener('drop', e => e.preventDefault());
  box.addEventListener('dragend', () => { if (dragged) dragged.classList.remove('dragging'); dragged = null; renumber(); });
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-move]');
    if (!b) return;
    const fig = b.closest('figure'), list = items(), i = list.indexOf(fig), j = i + Number(b.dataset.move);
    if (j < 0 || j >= list.length) return;
    if (j < i) box.insertBefore(fig, list[j]); else box.insertBefore(list[j], fig);
    renumber();
    b.focus();
  });
  renumber();
})();
