/* S.M.HP シンプルプラン 共通スクリプト */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* ---------------------------------------------------------
     ページ遷移時のスクロール位置
     ・別ページへ移動したとき(通常の遷移・再読み込み)…ページ最上部から表示
     ・URLに #見出し が付いているとき…その見出しへ移動(固定ヘッダー分を空ける)
     ・ブラウザの戻る/進む…そのページで見ていた位置へ戻す
     ブラウザ任せの自動復元は、プレビュー画面など埋め込み表示で前のページの
     位置が引き継がれる原因になるため、手動(manual)に切り替えて自前で制御する。
     --------------------------------------------------------- */
  var SCROLL_KEY = 'smhp-scroll:' + location.pathname;
  var navEntry = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
  var navType = navEntry ? navEntry.type : (performance.navigation && performance.navigation.type === 2 ? 'back_forward' : 'navigate');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function jump(y) {
    // CSS の smooth スクロールを使わず即座に移動
    try { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); }
    catch (e) { window.scrollTo(0, y); }
  }
  function headerOffset() {
    var h = document.querySelector('.site-header');
    return (h ? h.getBoundingClientRect().height : 0) + 16;
  }
  function hashTarget() {
    if (!location.hash || location.hash === '#top') return null;
    try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); }
    catch (e) { return null; }
  }
  function savedY() {
    try { var v = sessionStorage.getItem(SCROLL_KEY); return v === null ? null : Number(v); }
    catch (e) { return null; }
  }
  var userMoved = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
    window.addEventListener(ev, function () { userMoved = true; }, { passive: true, once: true });
  });
  function settleScroll() {
    if (userMoved) return; // 利用者が操作を始めたら位置を動かさない
    if (navType === 'back_forward') {
      var y = savedY();
      if (y !== null) { jump(y); return; }
    }
    var t = hashTarget();
    if (t) { jump(Math.max(0, t.getBoundingClientRect().top + window.pageYOffset - headerOffset())); return; }
    jump(0);
    // 埋め込み表示(プレビュー等)で外側の画面がスクロールしている場合も先頭へ
    if (window.self !== window.top && !location.hash) {
      var top = document.getElementById('top');
      if (top && top.scrollIntoView) top.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }
  settleScroll();
  document.addEventListener('DOMContentLoaded', settleScroll);
  window.addEventListener('load', function () {
    settleScroll();
    setTimeout(settleScroll, 120); // 表示側で後から位置が復元される場合への対策
  });
  // 戻る/進む用に、このページで見ている位置を記録(スクロールのたびに更新)
  // ※ bfcache から戻った場合はブラウザがページをそのまま復元するので何もしない
  var saveTimer = null;
  window.addEventListener('scroll', function () {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.pageYOffset))); } catch (e) { /* 保存できなくても動作に影響なし */ }
    }, 100);
  }, { passive: true });

  // スマートフォン用メニュー
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('gnav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.setAttribute('aria-label', open ? 'メニューを開く' : 'メニューを閉じる');
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        btn.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  // 画像が読み込めない場合は差し替え枠を表示
  function markMissing(img) {
    var box = img.closest('.ph, .fv__bg');
    if (box) box.classList.add('is-missing');
  }
  document.querySelectorAll('.ph img, .fv__bg img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    img.addEventListener('error', function () { markMissing(img); });
  });
  document.querySelectorAll('img.brand__logo').forEach(function (img) {
    function fallback() {
      var mark = document.createElement('span');
      mark.className = 'brand__mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = img.getAttribute('data-fallback') || '';
      img.replaceWith(mark);
    }
    if (img.complete && img.naturalWidth === 0) fallback();
    else img.addEventListener('error', fallback);
  });

  // ページトップボタン
  var top = document.querySelector('.pagetop');
  if (top) {
    var onScroll = function () { top.classList.toggle('is-show', window.scrollY > 400); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // スクロール表示アニメーション
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  // 問い合わせフォーム:見た目のみ。送信処理は行わない(送信済み表示もしない)
  document.querySelectorAll('form[data-demo-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  });

  // コピーライトの年
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
