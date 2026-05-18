/* ═══════════════════════════════════════════
   PocketLedger — app.js
   Pure vanilla JS, localStorage persistence
═══════════════════════════════════════════ */

// ── State ────────────────────────────────
let expenses = [];
let selectedCategory = '📦 Other';
let activeTab = 'all';
let budget = 0;
let toastTimer = null;
let pendingDeleteId = null;
let searchQuery = '';

// ── Storage Keys ─────────────────────────
const STORAGE_KEY = 'pl_expenses_v1';
const THEME_KEY   = 'pl_theme';
const BUDGET_KEY  = 'pl_budget';

// ── DOM refs ──────────────────────────────
const $total       = document.getElementById('totalAmount');
const $list        = document.getElementById('expenseList');
const $empty       = document.getElementById('emptyState');
const $breakdown   = document.getElementById('breakdownSection');
const $catBars     = document.getElementById('categoryBars');
const $formError   = document.getElementById('formError');
const $toast       = document.getElementById('toast');
const $toastMsg    = document.getElementById('toastMsg');
const $toastIcon   = document.getElementById('toastIcon');
const $modal       = document.getElementById('modal');
const $modalBody   = document.getElementById('modalBody');
const $budgetBar   = document.getElementById('budgetBar');
const $budgetBarWrap = document.getElementById('budgetBarWrap');
const $budgetPct   = document.getElementById('budgetPct');
const $budgetRemaining = document.getElementById('budgetRemaining');
const $budgetInput = document.getElementById('budgetInput');
const $search      = document.getElementById('searchInput');

// ── Init ──────────────────────────────────
(function init() {
  loadData();
  loadTheme();
  loadBudget();
  setDefaultDate();
  bindEvents();
  render();
})();

// ── Data persistence ──────────────────────
function loadData() {
  try {
    expenses = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { expenses = []; }
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}
function loadBudget() {
  budget = parseFloat(localStorage.getItem(BUDGET_KEY)) || 0;
  if (budget > 0) $budgetInput.value = budget;
}
function saveBudget() {
  localStorage.setItem(BUDGET_KEY, budget);
}

// ── Theme ─────────────────────────────────
function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved, false);
}
function applyTheme(theme, save = true) {
  const html = document.documentElement;
  const moonIcon = document.getElementById('iconMoon');
  const sunIcon  = document.getElementById('iconSun');
  if (theme === 'light') {
    html.classList.remove('dark');
    html.classList.add('light');
    moonIcon.classList.add('hidden');
    sunIcon.classList.remove('hidden');
  } else {
    html.classList.add('dark');
    html.classList.remove('light');
    moonIcon.classList.remove('hidden');
    sunIcon.classList.add('hidden');
  }
  if (save) localStorage.setItem(THEME_KEY, theme);
}
function toggleTheme() {
  const isLight = document.documentElement.classList.contains('light');
  applyTheme(isLight ? 'dark' : 'light');
}

// ── Date helpers ──────────────────────────
function setDefaultDate() {
  document.getElementById('inputDate').value = todayISO();
}
function todayISO() {
  return new Date().toISOString().split('T')[0];
}
function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function isThisMonth(iso) {
  const d = new Date(iso + 'T00:00:00');
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}
function isThisWeek(iso) {
  const d = new Date(iso + 'T00:00:00');
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0,0,0,0);
  return d >= weekStart;
}
function isToday(iso) {
  return iso === todayISO();
}

// ── Filter ────────────────────────────────
function getFiltered() {
  let list = [...expenses];
  if (activeTab === 'month') list = list.filter(e => isThisMonth(e.date));
  else if (activeTab === 'week') list = list.filter(e => isThisWeek(e.date));
  else if (activeTab === 'today') list = list.filter(e => isToday(e.date));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(e =>
      e.desc.toLowerCase().includes(q) ||
      e.cat.toLowerCase().includes(q) ||
      String(e.amount).includes(q)
    );
  }
  return list;
}

// ── Render ────────────────────────────────
function render() {
  const filtered = getFiltered();
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  // Total
  $total.textContent = formatCurrency(total);

  // Budget bar
  if (budget > 0 && (activeTab === 'month' || activeTab === 'all')) {
    $budgetBarWrap.classList.remove('hidden');
    const pct = Math.min((total / budget) * 100, 100);
    const rawPct = (total / budget) * 100;
    $budgetBar.style.width = pct + '%';
    $budgetPct.textContent = Math.round(rawPct) + '%';
    $budgetBar.classList.remove('over-budget', 'near-budget');
    if (rawPct >= 100) {
      $budgetBar.classList.add('over-budget');
    } else if (rawPct >= 80) {
      $budgetBar.classList.add('near-budget');
    }
    const remaining = budget - total;
    $budgetRemaining.classList.remove('hidden');
    if (remaining >= 0) {
      $budgetRemaining.textContent = `${formatCurrency(remaining)} left`;
      $budgetRemaining.className = 'mb-1 text-sm text-ink-400';
    } else {
      $budgetRemaining.textContent = `${formatCurrency(Math.abs(remaining))} over`;
      $budgetRemaining.className = 'mb-1 text-sm text-danger';
    }
  } else {
    $budgetBarWrap.classList.add('hidden');
    $budgetRemaining.classList.add('hidden');
  }

  // List
  $list.innerHTML = '';
  if (filtered.length === 0) {
    $empty.classList.remove('hidden');
    $breakdown.classList.add('hidden');
  } else {
    $empty.classList.add('hidden');
    // Sort by date desc, then by insertion order
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    sorted.forEach(e => {
      $list.appendChild(createExpenseEl(e));
    });
    renderBreakdown(filtered);
    $breakdown.classList.remove('hidden');
  }
}

function createExpenseEl(e) {
  const li = document.createElement('li');
  li.className = 'expense-item';
  li.dataset.id = e.id;
  const icon = e.cat.split(' ')[0];
  li.innerHTML = `
    <div class="expense-cat-icon">${icon}</div>
    <div class="expense-info">
      <div class="expense-desc">${escHtml(e.desc || e.cat.split(' ').slice(1).join(' ') || 'Expense')}</div>
      <div class="expense-meta">${e.cat} · ${formatDate(e.date)}</div>
    </div>
    <span class="expense-amount">$${e.amount.toFixed(2)}</span>
    <button class="expense-delete" data-id="${e.id}" title="Delete">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
      </svg>
    </button>
  `;
  return li;
}

function renderBreakdown(filtered) {
  const totals = {};
  filtered.forEach(e => {
    totals[e.cat] = (totals[e.cat] || 0) + e.amount;
  });
  const max = Math.max(...Object.values(totals));
  const sorted = Object.entries(totals).sort((a,b) => b[1]-a[1]);
  $catBars.innerHTML = '';
  sorted.forEach(([cat, amt]) => {
    const pct = max ? (amt / max * 100) : 0;
    const icon = cat.split(' ')[0];
    const label = cat.split(' ').slice(1).join(' ');
    const row = document.createElement('div');
    row.className = 'cat-bar-row';
    row.innerHTML = `
      <span class="cat-bar-label">${icon} ${label}</span>
      <div class="cat-bar-track"><div class="cat-bar-fill" style="width:0%"></div></div>
      <span class="cat-bar-amt">${formatCurrency(amt)}</span>
    `;
    $catBars.appendChild(row);
    // animate in
    requestAnimationFrame(() => {
      const fill = row.querySelector('.cat-bar-fill');
      fill.style.width = pct + '%';
    });
  });
}

// ── Add expense ───────────────────────────
function addExpense() {
  const amtRaw = document.getElementById('inputAmount').value.trim();
  const desc    = document.getElementById('inputDesc').value.trim();
  const date    = document.getElementById('inputDate').value || todayISO();

  // Validate
  const amount = parseFloat(amtRaw);
  if (!amtRaw || isNaN(amount) || amount <= 0) {
    showError('Enter a valid amount > 0');
    animateShake(document.getElementById('inputAmount'));
    return;
  }
  if (amount > 1000000) {
    showError('Amount too large');
    return;
  }

  hideError();

  const expense = {
    id: Date.now(),
    amount: Math.round(amount * 100) / 100,
    desc: desc || '',
    cat: selectedCategory,
    date,
  };

  expenses.unshift(expense);
  saveData();

  // Reset form
  document.getElementById('inputAmount').value = '';
  document.getElementById('inputDesc').value = '';

  render();
  showToast('✓', 'Expense added');

  // Mini confetti on first expense of the day or round numbers
  if (expenses.length === 1 || amount % 10 === 0) {
    launchConfetti();
  }

  // Scroll to top of list
  document.getElementById('expenseList').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Delete expense ────────────────────────
function confirmDelete(id) {
  const e = expenses.find(x => x.id === id);
  if (!e) return;
  pendingDeleteId = id;
  $modalBody.textContent = `Delete "${e.desc || formatCurrency(e.amount)}" from ${formatDate(e.date)}?`;
  $modal.classList.add('open');
}

function executeDelete() {
  if (!pendingDeleteId) return;
  expenses = expenses.filter(e => e.id !== pendingDeleteId);
  saveData();
  pendingDeleteId = null;
  closeModal();
  render();
  showToast('🗑', 'Expense removed');
}

function closeModal() {
  $modal.classList.remove('open');
}

// ── Clear all ─────────────────────────────
function confirmClearAll() {
  if (expenses.length === 0) { showToast('ℹ️', 'Nothing to clear'); return; }
  pendingDeleteId = '__all__';
  $modalBody.textContent = `This will permanently delete all ${expenses.length} expense${expenses.length > 1 ? 's' : ''}. This can't be undone.`;
  document.getElementById('modalTitle').textContent = 'Clear everything?';
  $modal.classList.add('open');
}

// ── Export CSV ────────────────────────────
function exportCSV() {
  if (expenses.length === 0) { showToast('ℹ️', 'No expenses to export'); return; }
  const rows = [['Date','Description','Category','Amount']];
  const sorted = [...expenses].sort((a,b) => b.date.localeCompare(a.date));
  sorted.forEach(e => {
    rows.push([e.date, `"${(e.desc||'').replace(/"/g,'""')}"`, `"${e.cat}"`, e.amount.toFixed(2)]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pocketledger-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥', 'CSV exported');
}

// ── Budget ────────────────────────────────
function setBudget() {
  const val = parseFloat($budgetInput.value);
  if (!val || val <= 0) {
    showToast('⚠️', 'Enter a valid budget amount');
    animateShake($budgetInput);
    return;
  }
  budget = Math.round(val * 100) / 100;
  saveBudget();
  render();
  showToast('✓', `Budget set to ${formatCurrency(budget)}/mo`);
}

function clearBudget() {
  budget = 0;
  $budgetInput.value = '';
  localStorage.removeItem(BUDGET_KEY);
  render();
  showToast('✓', 'Budget cleared');
}

// ── UI helpers ────────────────────────────
function formatCurrency(n) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function showError(msg) {
  $formError.textContent = msg;
  $formError.classList.remove('hidden');
}
function hideError() {
  $formError.classList.add('hidden');
}

function animateShake(el) {
  el.classList.remove('animate-shake');
  void el.offsetWidth; // reflow
  el.classList.add('animate-shake');
  setTimeout(() => el.classList.remove('animate-shake'), 500);
}

function showToast(icon, msg) {
  $toastIcon.textContent = icon;
  $toastMsg.textContent = msg;
  $toast.classList.remove('hidden');
  $toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $toast.classList.remove('show');
    $toast.classList.add('hidden');
  }, 2200);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Confetti ──────────────────────────────
function launchConfetti() {
  const colors = ['#c8f135','#ffb347','#7dd3fc','#f9a8d4','#86efac'];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = (0.9 + Math.random() * 0.8) + 's';
    el.style.animationDelay = Math.random() * 0.3 + 's';
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}

// ── Tab switching ─────────────────────────
function setTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.style.borderColor = '';
    b.style.color = '';
  });
  const active = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (active) active.classList.add('active');
  render();
}

// ── Events ────────────────────────────────
function bindEvents() {
  // Add expense
  document.getElementById('addBtn').addEventListener('click', addExpense);

  // Enter to add
  ['inputAmount','inputDesc','inputDate'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') addExpense();
    });
  });

  // Category selection
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCategory = btn.dataset.cat;
    });
  });

  // Delete via event delegation
  $list.addEventListener('click', e => {
    const btn = e.target.closest('.expense-delete');
    if (btn) confirmDelete(Number(btn.dataset.id));
  });

  // Modal
  document.getElementById('modalConfirm').addEventListener('click', () => {
    if (pendingDeleteId === '__all__') {
      expenses = [];
      saveData();
      pendingDeleteId = null;
      document.getElementById('modalTitle').textContent = 'Are you sure?';
      closeModal();
      render();
      showToast('🗑', 'All expenses cleared');
    } else {
      executeDelete();
    }
  });
  document.getElementById('modalCancel').addEventListener('click', () => {
    pendingDeleteId = null;
    document.getElementById('modalTitle').textContent = 'Are you sure?';
    closeModal();
  });
  $modal.addEventListener('click', e => {
    if (e.target === $modal) {
      pendingDeleteId = null;
      document.getElementById('modalTitle').textContent = 'Are you sure?';
      closeModal();
    }
  });

  // Theme
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Export
  document.getElementById('exportBtn').addEventListener('click', exportCSV);

  // Clear all
  document.getElementById('clearBtn').addEventListener('click', confirmClearAll);

  // Tabs
  document.getElementById('tabAll').addEventListener('click',   () => setTab('all'));
  document.getElementById('tabMonth').addEventListener('click', () => setTab('month'));
  document.getElementById('tabWeek').addEventListener('click',  () => setTab('week'));
  document.getElementById('tabToday').addEventListener('click', () => setTab('today'));

  // Budget
  document.getElementById('setBudgetBtn').addEventListener('click', setBudget);
  document.getElementById('clearBudgetBtn').addEventListener('click', clearBudget);
  $budgetInput.addEventListener('keydown', e => { if (e.key === 'Enter') setBudget(); });

  // Search
  $search.addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    render();
  });

  // Keyboard shortcut: Escape closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $modal.classList.contains('open')) {
      pendingDeleteId = null;
      document.getElementById('modalTitle').textContent = 'Are you sure?';
      closeModal();
    }
  });

  // Amount input: focus auto-selects
  document.getElementById('inputAmount').addEventListener('focus', function() {
    this.select();
  });
}
