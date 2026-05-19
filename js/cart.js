// cart.js — واحة اليمن Ordering System

(function () {
  'use strict';

  /* ============================================================
     DATA
  ============================================================ */
  const BRANCHES = [
    { id: 'mohandessin',   name: 'المهندسين',   whatsapp: '201112223232' },
    { id: 'sheikh-zayed',  name: 'الشيخ زايد',  whatsapp: '201118883232' },
  ];
  const FREE_DELIVERY_MIN = 1000;
  const STORAGE_KEY = 'wy-cart-v1';

  /* ============================================================
     STATE
  ============================================================ */
  let cart = readCart();
  let activeBranch = BRANCHES.find(b => b.id === cart.branch) || BRANCHES[0];

  function readCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || empty(); }
    catch { return empty(); }
  }
  function empty() { return { branch: null, items: [] }; }
  function save()  { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

  /* ============================================================
     TOTALS
  ============================================================ */
  function total() { return cart.items.reduce((s, i) => s + i.price * i.qty, 0); }
  function count() { return cart.items.reduce((s, i) => s + i.qty, 0); }

  /* ============================================================
     CART OPERATIONS
  ============================================================ */
  function addItem(id, name, price) {
    if (cart.branch && cart.branch !== activeBranch.id) {
      openConflict(activeBranch, id, name, price);
      return;
    }
    cart.branch = activeBranch.id;
    const ex = cart.items.find(i => i.id === id);
    if (ex) ex.qty++;
    else cart.items.push({ id, name, price: +price, qty: 1 });
    save(); tick(); flash(id);
  }

  function removeItem(id) {
    cart.items = cart.items.filter(i => i.id !== id);
    if (!cart.items.length) { cart.branch = null; closeModal(); }
    save(); tick();
  }

  function updateQty(id, d) {
    const item = cart.items.find(i => i.id === id);
    if (!item) return;
    item.qty += d;
    if (item.qty < 1) removeItem(id);
    else { save(); tick(); }
  }

  function clearCart() {
    cart = empty();
    save(); tick();
  }

  /* ============================================================
     BADGE + BAR
  ============================================================ */
  function tick() {
    const n = count();

    /* navbar badge */
    const badge = $('cart-badge');
    if (badge) {
      badge.textContent = n || '';
      badge.classList.toggle('has-items', n > 0);
    }

    /* bottom bar */
    renderBar(n);

    /* if modal is already open, refresh cart contents */
    const modal = $('cart-modal');
    if (modal && modal.classList.contains('open') && !$('checkout-panel').classList.contains('open')) {
      buildModalCart();
    }
  }

  function renderBar(n) {
    if (n === undefined) n = count();
    const bar = $('cart-bar');
    if (!bar) return;
    bar.hidden = (n === 0);
    if (!n) return;
    const cnt = $('cart-bar-count');
    const tot = $('cart-bar-total');
    if (cnt) cnt.textContent = n + (n === 1 ? ' صنف' : ' أصناف');
    if (tot) tot.textContent = total().toLocaleString('ar-EG') + ' ج';
  }

  function flash(id) {
    const btn = document.querySelector(`[data-cart-id="${id}"] .add-btn`);
    if (!btn) return;
    btn.textContent = '✓';
    btn.classList.add('added');
    setTimeout(() => { btn.textContent = '+'; btn.classList.remove('added'); }, 700);
  }

  /* ============================================================
     CONFLICT MODAL
  ============================================================ */
  function openConflict(nb, pid, pname, pprice) {
    const cur = BRANCHES.find(b => b.id === cart.branch) || {};
    const el = $('conflict-msg');
    if (el) el.textContent =
      `عربتك تحتوي على أصناف من فرع ${cur.name}. للطلب من فرع ${nb.name} يجب إفراغ العربة أولاً.`;
    const sw = $('conflict-switch');
    if (sw) sw.onclick = () => {
      clearCart();
      closeConflict();
      if (pid) addItem(pid, pname, pprice);
    };
    const kp = $('conflict-keep');
    if (kp) kp.onclick = closeConflict;
    $('conflict-modal')?.classList.add('open');
  }
  function closeConflict() { $('conflict-modal')?.classList.remove('open'); }

  /* ============================================================
     CART MODAL
  ============================================================ */
  function openModal() {
    if (!cart.items.length) return;
    closeCheckout();
    buildModalCart();
    $('cart-modal')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $('cart-modal')?.classList.remove('open');
    document.body.style.overflow = '';
    closeCheckout();
  }

  function buildModalCart() {
    const body = $('cart-modal-body');
    if (!body) return;

    if (!cart.items.length) { closeModal(); return; }

    const br = BRANCHES.find(b => b.id === cart.branch);
    const tot = total();

    body.innerHTML = `
      <div class="cart-branch-tag">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
        </svg>
        فرع ${br ? br.name : ''}
      </div>
      <div class="cart-items-list">
        ${cart.items.map(i => `
          <div class="cart-row">
            <div class="cart-row-info">
              <div class="cart-row-name">${i.name}</div>
              <div class="cart-row-sub">
                ${i.price.toLocaleString('ar-EG')} ج × ${i.qty}
                = <b>${(i.price * i.qty).toLocaleString('ar-EG')} ج</b>
              </div>
            </div>
            <div class="cart-row-ctrl">
              <button class="qty-btn" onclick="wyCart.updateQty('${i.id}',-1)">−</button>
              <span class="qty-n">${i.qty}</span>
              <button class="qty-btn" onclick="wyCart.updateQty('${i.id}',1)">+</button>
              <button class="del-btn" title="حذف" onclick="wyCart.removeItem('${i.id}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            </div>
          </div>`).join('')}
      </div>
      <div class="cart-modal-total-row">
        <span>الإجمالي</span>
        <span class="cart-modal-total-val">${tot.toLocaleString('ar-EG')} ج</span>
      </div>
      ${tot >= FREE_DELIVERY_MIN ? '<div class="free-del-msg">توصيل مجاني لطلبات فوق 1000 جنيه ✓</div>' : ''}`;
  }

  /* ============================================================
     CHECKOUT PANEL
  ============================================================ */
  function openCheckout() {
    buildSummary();
    $('checkout-panel')?.classList.add('open');
  }
  function closeCheckout() {
    $('checkout-panel')?.classList.remove('open');
  }

  function buildSummary() {
    const br = BRANCHES.find(b => b.id === cart.branch) || BRANCHES[0];
    if ($('co-branch')) $('co-branch').textContent = br.name;
    if ($('co-items')) $('co-items').innerHTML = cart.items.map(i =>
      `<div class="co-row">
         <span>${i.name} × ${i.qty}</span>
         <span>${(i.price * i.qty).toLocaleString('ar-EG')} ج</span>
       </div>`
    ).join('');
    if ($('co-total-val')) $('co-total-val').textContent = total().toLocaleString('ar-EG') + ' ج';
  }

  /* ============================================================
     WHATSAPP SUBMISSION
  ============================================================ */
  function submitOrder() {
    const phone = $('inp-phone')?.value.trim();
    const addr  = $('inp-addr')?.value.trim();
    let ok = true;
    if (!phone) { $('inp-phone')?.classList.add('field-err'); ok = false; }
    if (!addr)  { $('inp-addr')?.classList.add('field-err');  ok = false; }
    if (!ok) return;

    const name  = $('inp-name')?.value.trim()  || '';
    const notes = $('inp-notes')?.value.trim() || '';
    const br    = BRANCHES.find(b => b.id === cart.branch) || BRANCHES[0];
    const tot   = total();

    let msg = '🟡 *طلب جديد — واحة اليمن*\n━━━━━━━━━━━━━━\n';
    msg += `🏪 *الفرع:* فرع ${br.name}\n`;
    if (name)  msg += `👤 *الاسم:* ${name}\n`;
    msg += `📞 *الهاتف:* ${phone}\n`;
    msg += `📍 *العنوان:* ${addr}\n`;
    msg += '━━━━━━━━━━━━━━\n🛒 *الطلب:*\n';
    cart.items.forEach(i => {
      msg += `• ${i.name} × ${i.qty}  —  ${(i.price * i.qty).toLocaleString('ar-EG')} ج\n`;
    });
    msg += '━━━━━━━━━━━━━━\n';
    msg += `💰 *الإجمالي:* ${tot.toLocaleString('ar-EG')} جنيه\n`;
    msg += '💵 *الدفع:* كاش عند الاستلام\n';
    if (notes) msg += `📝 *ملاحظات:* ${notes}\n`;

    window.open(`https://wa.me/${br.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
    clearCart();
    closeModal();
    ['inp-name', 'inp-phone', 'inp-addr', 'inp-notes'].forEach(id => {
      if ($(id)) $(id).value = '';
    });
  }

  /* ============================================================
     BRANCH PICKER
  ============================================================ */
  function initPicker() {
    const el = $('branch-picker');
    if (!el) return;
    el.innerHTML = BRANCHES.map(b =>
      `<button class="branch-pill${b.id === activeBranch.id ? ' active' : ''}"
               onclick="wyCart.selectBranch('${b.id}')">${b.name}</button>`
    ).join('');
  }

  function selectBranch(id) {
    const br = BRANCHES.find(b => b.id === id);
    if (!br) return;
    if (cart.branch && cart.branch !== id && cart.items.length) {
      openConflict(br, null, null, null);
      return;
    }
    activeBranch = br;
    document.querySelectorAll('.branch-pill').forEach(p =>
      p.classList.toggle('active', p.textContent.trim() === br.name)
    );
  }

  /* ============================================================
     INJECT ADD BUTTONS
  ============================================================ */
  let _seq = 0;
  const uid = () => 'ci-' + (++_seq);
  const px  = t  => parseFloat((t || '').replace(/[^\d.]/g, '')) || 0;

  function mkBtn(id, name, price) {
    const b = document.createElement('button');
    b.className = 'add-btn';
    b.textContent = '+';
    b.title = `أضف ${name}`;
    b.onclick = e => { e.stopPropagation(); addItem(id, name, price); };
    return b;
  }

  function injectButtons() {
    const root = document.getElementById('menu-body');
    if (!root) return;

    /* plain list items */
    root.querySelectorAll('.menu-item').forEach(el => {
      const name = el.querySelector('.menu-item-name')?.textContent.trim();
      const priceEl = el.querySelector('.menu-item-price');
      const price = px(priceEl?.textContent);
      if (!name || !price) return;
      const id = uid();
      el.dataset.cartId = id;
      el.appendChild(mkBtn(id, name, price));
    });

    /* photo cards */
    root.querySelectorAll('.menu-photo-card').forEach(el => {
      const name = el.querySelector('.menu-photo-card-name')?.textContent.trim();
      const price = px(el.querySelector('.menu-photo-card-price')?.textContent);
      if (!name || !price) return;
      const id = uid();
      el.dataset.cartId = id;
      const body = el.querySelector('.menu-photo-card-body');
      if (body) body.appendChild(mkBtn(id, name, price));
    });

    /* tray / meal cards */
    root.querySelectorAll('.menu-tray-card').forEach(el => {
      const name = el.querySelector('.menu-tray-card-name')?.textContent.trim();
      const price = px(el.querySelector('.menu-tray-card-price')?.textContent.replace(/,/g, ''));
      if (!name || !price) return;
      const id = uid();
      el.dataset.cartId = id;
      const meta = el.querySelector('.menu-tray-card-meta');
      if (meta) meta.appendChild(mkBtn(id, name, price));
    });

    /* chicken size rows */
    root.querySelectorAll('.chicken-item').forEach(el => {
      const base = (el.querySelector('.chicken-item-text h4') || el.querySelector('h4'))?.textContent.trim();
      if (!base) return;
      el.querySelectorAll('.chicken-price-row').forEach(row => {
        const spans = row.querySelectorAll('span');
        if (spans.length < 2) return;
        const size  = spans[0].textContent.trim();
        const price = px(spans[1].textContent);
        if (!price) return;
        const id  = uid();
        const btn = mkBtn(id, `${base} — ${size}`, price);
        btn.classList.add('add-btn-sm');
        row.dataset.cartId = id;
        row.appendChild(btn);
      });
    });

    /* price tables */
    root.querySelectorAll('.price-table').forEach(table => {
      const hdrs = [...table.querySelectorAll('thead th')].map(t => t.textContent.trim());
      table.querySelectorAll('tbody tr').forEach(row => {
        const cells = [...row.querySelectorAll('td')];
        if (!cells.length) return;
        const name = cells[0].textContent.trim();
        cells.slice(1).forEach((cell, i) => {
          const price = px(cell.textContent);
          if (!price) return;
          const id  = uid();
          const btn = mkBtn(id, `${name} — ${hdrs[i + 1] || ''}`, price);
          btn.classList.add('add-btn-sm');
          cell.style.whiteSpace = 'nowrap';
          cell.appendChild(btn);
        });
      });
    });
  }

  /* ============================================================
     HELPERS
  ============================================================ */
  const $ = id => document.getElementById(id);

  /* ============================================================
     INIT
  ============================================================ */
  function init() {
    initPicker();
    injectButtons();
    tick();

    $('cart-modal-backdrop')?.addEventListener('click', closeModal);
    $('cart-modal-close')?.addEventListener('click', closeModal);
    document.querySelectorAll('[data-open-cart]').forEach(el =>
      el.addEventListener('click', openModal)
    );
    $('cart-bar-checkout')?.addEventListener('click', openModal);
    $('proceed-checkout')?.addEventListener('click', openCheckout);
    $('co-back')?.addEventListener('click', closeCheckout);
    $('submit-order')?.addEventListener('click', submitOrder);
    $('clear-cart-btn')?.addEventListener('click', () => {
      if (confirm('هل تريد مسح عربة التسوق؟')) clearCart();
    });
    ['inp-phone', 'inp-addr'].forEach(id => {
      $(id)?.addEventListener('input', () => $(id)?.classList.remove('field-err'));
    });
  }

  window.wyCart = { addItem, removeItem, updateQty, clearCart, selectBranch, openModal, closeModal };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
