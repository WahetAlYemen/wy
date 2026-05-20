// cart.js — واحة اليمن Ordering System

(function () {
  'use strict';

  /* ============================================================
     DATA
  ============================================================ */
  const BRANCHES = [
    { id: 'mohandessin',   name: 'المهندسين',   whatsapp: '201112223232', phone: '201112223232' },
    { id: 'sheikh-zayed',  name: 'الشيخ زايد',  whatsapp: '201118883232', phone: '201118883232' },
  ];
  const FREE_DELIVERY_MIN = 1000;
  const STORAGE_KEY = 'wy-cart-v1';
  const storage = sessionStorage;

  /* ============================================================
     STATE
  ============================================================ */
  let cart = readCart();
  let activeBranch = BRANCHES.find(b => b.id === cart.branch) || BRANCHES[0];

  function readCart() {
    try { return JSON.parse(storage.getItem(STORAGE_KEY)) || empty(); }
    catch { return empty(); }
  }
  function empty() { return { branch: null, items: [] }; }
  function save()  { storage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

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
      `عربتك تحتوي على أصناف من فرع ${cur.name}. هل تريد نقل العربة للفرع ${nb.name} (سيتم مسح طلبك الحالي)، أم تريد الاحتفاظ بطلبك من فرع ${cur.name}؟`;
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
    closeMethodPanel();
    buildModalCart();
    $('cart-modal')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $('cart-modal')?.classList.remove('open');
    document.body.style.overflow = '';
    closeMethodPanel();
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
      </div>`;
  }

  /* ============================================================
     METHOD PANEL (how to order)
  ============================================================ */
  function openMethodPanel() {
    $('method-panel')?.classList.add('open');
  }
  function closeMethodPanel() {
    $('method-panel')?.classList.remove('open');
  }

  function callBranch() {
    const br = BRANCHES.find(b => b.id === cart.branch) || BRANCHES[0];
    window.location.href = `tel:+${br.phone}`;
  }

  function whatsappBranch() {
    const br = BRANCHES.find(b => b.id === cart.branch) || BRANCHES[0];
    let msg = `مرحباً 👋 أريد الطلب من فرع ${br.name}:\n\n`;
    cart.items.forEach(i => {
      msg += `• ${i.name} × ${i.qty} — ${(i.price * i.qty).toLocaleString('ar-EG')} ج\n`;
    });
    msg += `\n💰 الإجمالي: ${total().toLocaleString('ar-EG')} ج`;
    window.open(`https://wa.me/${br.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
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
     TELEGRAM ORDER SUBMISSION
  ============================================================ */
  const TG_TOKEN  = '8797857878:AAHl4TKrBbynFwj9AHVj6zapFRzLYL3tgnk';
  const TG_CHAT   = '-1003765202930';
  const TG_OFFSET = 9000;

  async function submitOrder() {
    const name  = $('inp-name')?.value.trim();
    const phone = $('inp-phone')?.value.trim();
    const addr  = $('inp-addr')?.value.trim();
    let ok = true;
    if (!name)  { $('inp-name')?.classList.add('field-err');  ok = false; }
    if (!phone) { $('inp-phone')?.classList.add('field-err'); ok = false; }
    if (!addr)  { $('inp-addr')?.classList.add('field-err');  ok = false; }
    if (!ok) return;

    const notes = $('inp-notes')?.value.trim() || '';
    const br    = BRANCHES.find(b => b.id === cart.branch) || BRANCHES[0];
    const tot   = total();

    /* build message without order number first — we get it from Telegram */
    let body = `🟡 *طلب جديد — واحة اليمن*\n━━━━━━━━━━━━━━\n`;
    body += `🏪 *الفرع:* فرع ${br.name}\n`;
    body += `👤 *الاسم:* ${name}\n`;
    body += `📞 *الهاتف:* ${phone}\n`;
    body += `📍 *العنوان:* ${addr}\n`;
    body += '━━━━━━━━━━━━━━\n🛒 *الطلب:*\n';
    cart.items.forEach(i => {
      body += `• ${i.name} × ${i.qty}  —  ${(i.price * i.qty).toLocaleString('ar-EG')} ج\n`;
    });
    body += '━━━━━━━━━━━━━━\n';
    body += `💰 *الإجمالي:* ${tot.toLocaleString('ar-EG')} جنيه\n`;
    body += '💵 *الدفع:* كاش عند الاستلام\n';
    if (notes) body += `📝 *ملاحظات:* ${notes}\n`;

    const btn = $('submit-order');
    if (btn) { btn.disabled = true; btn.textContent = 'جاري الإرسال...'; }

    try {
      /* 1 — send message, get message_id */
      const res  = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT, text: body, parse_mode: 'Markdown' })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.description);

      /* 2 — order number = message_id + offset (global, sequential across all devices) */
      const msgId   = data.result.message_id;
      const orderNo = msgId + TG_OFFSET;

      /* 3 — edit the sent message to prepend the order number */
      const fullMsg = `🔢 *رقم الطلب:* ${orderNo}\n` + body;
      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT, message_id: msgId, text: fullMsg, parse_mode: 'Markdown' })
      });

      showOrderSuccess(orderNo);

      setTimeout(() => {
        clearCart();
        closeModal();
        ['inp-name', 'inp-phone', 'inp-addr', 'inp-notes'].forEach(id => {
          if ($(id)) $(id).value = '';
        });
        if (btn) { btn.disabled = false; btn.textContent = 'أرسل الطلب'; btn.style.background = ''; }
        hideOrderSuccess();
      }, 4000);

    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = 'أرسل الطلب'; }
      alert('حدث خطأ أثناء إرسال الطلب. تحقق من الاتصال وحاول مرة أخرى.');
    }
  }

  function showOrderSuccess(num) {
    const numEl = $('order-success-num');
    if (numEl) numEl.textContent = num;
    $('order-success')?.classList.add('active');
  }

  function hideOrderSuccess() {
    $('order-success')?.classList.remove('active');
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

    /* unified dish cards (new layout) */
    root.querySelectorAll('.dish-card').forEach(el => {
      const name  = el.querySelector('.menu-item-name')?.textContent.trim();
      const price = px(el.querySelector('.menu-item-price')?.textContent);
      if (!name || !price) return;
      const id = uid();
      el.dataset.cartId = id;
      const footer = el.querySelector('.dish-footer');
      (footer || el).appendChild(mkBtn(id, name, price));
    });

    /* lazy-load real dish images */
    root.querySelectorAll('.dish-img').forEach(img => {
      if (!img.src || img.src === window.location.href) return;
      if (img.complete && img.naturalWidth) { img.classList.add('loaded'); return; }
      img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
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
    $('method-back')?.addEventListener('click', closeMethodPanel);
    $('method-call')?.addEventListener('click', callBranch);
    $('method-whatsapp')?.addEventListener('click', whatsappBranch);
    $('method-online')?.addEventListener('click', openCheckout);
    $('co-back')?.addEventListener('click', closeCheckout);
    $('submit-order')?.addEventListener('click', submitOrder);
    $('clear-cart-btn')?.addEventListener('click', () => {
      if (confirm('هل تريد مسح عربة التسوق؟')) clearCart();
    });
    ['inp-name', 'inp-phone', 'inp-addr'].forEach(id => {
      $(id)?.addEventListener('input', () => $(id)?.classList.remove('field-err'));
    });
  }

  window.wyCart = { addItem, removeItem, updateQty, clearCart, selectBranch, openModal, closeModal };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
