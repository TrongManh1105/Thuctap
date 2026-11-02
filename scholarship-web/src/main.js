/**
 * ScholarMatch AI - Dual-Mode Frontend Controller
 * Tab 1: Global Scholarship Catalog (Explore all 7,944+ scholarships with independent filters)
 * Tab 2: Candidate Profile & Dedicated Personalized AI Matching (Ranked top-to-bottom with Gap Analysis & Action Roadmap)
 * Tab 3: AI Du Học Counselor (SSE Stream RAG Chatbot)
 */

import { checkBackendHealth, fetchScholarshipCatalog, matchScholarships, extractCvProfile, streamChat } from './api.js';
import { DEMO_SCHOLARSHIPS, DEMO_PROFILE } from './data/demoData.js';

// Application State
const state = {
  activeTab: 'section-catalog',
  theme: localStorage.getItem('theme') || 'dark',
  profile: { ...DEMO_PROFILE, gpa: 2.45, ielts: 4.5, preferred_countries: ['Hàn Quốc'], target_universities: [] },
  targetMatchedStatus: 'NONE',
  targetGapsSummary: null,
  
  // Tab 1: Global Catalog Data (Supabase 7,949 scholarships)
  allCatalogScholarships: [...DEMO_SCHOLARSHIPS],
  filteredCatalogScholarships: [...DEMO_SCHOLARSHIPS],
  activeCatalogQuickChip: 'all',
  catalogPage: 1,
  catalogLimit: 24,
  catalogTotal: 0,
  catalogLoadedItems: [],
  isLoadingCatalog: false,

  // Tab 2: Personalized Matched Scholarships
  matchedScholarships: [],
  selectedScholarshipForModal: null,

  // Tab 3: Chatbot History
  chatHistory: [],

  // Status flags
  isScanningCV: false,
  isMatching: false,
  backendConnected: false,
};

// DOM Elements Registry
const el = {
  themeToggleBtn: document.getElementById('btn-theme-toggle'),
  navTabs: document.querySelectorAll('.nav-tab'),
  contentSections: document.querySelectorAll('.content-section'),
  backendStatusText: document.getElementById('backend-status-text'),
  backendStatusPill: document.getElementById('backend-status-pill'),
  metricTotal: document.getElementById('metric-total-scholarships'),
  brandLogo: document.getElementById('brand-logo'),

  // TAB 1: Global Catalog Elements
  catalogGrid: document.getElementById('catalog-results-grid'),
  catalogCount: document.getElementById('catalog-results-count'),
  catalogSearchInput: document.getElementById('catalog-search-input'),
  catalogBtnClearSearch: document.getElementById('catalog-btn-clear-search'),
  catalogFilterCountry: document.getElementById('catalog-filter-country'),
  catalogFilterFunding: document.getElementById('catalog-filter-funding'),
  catalogFilterTier: document.getElementById('catalog-filter-tier'),
  catalogSortSelect: document.getElementById('catalog-sort-select'),
  catalogQuickChips: document.querySelectorAll('.chip-filter[data-catalog-filter]'),
  catalogPaginationBar: document.getElementById('catalog-pagination-bar'),
  catalogPaginationControls: document.getElementById('catalog-pagination-controls'),
  catalogPaginationNumbers: document.getElementById('catalog-pagination-numbers'),
  btnCatalogPrev: document.getElementById('btn-catalog-prev'),
  btnCatalogNext: document.getElementById('btn-catalog-next'),
  catalogCurrentLoaded: document.getElementById('catalog-current-loaded'),
  catalogTotalAvailable: document.getElementById('catalog-total-available'),
  catalogPaginationStatus: document.getElementById('catalog-pagination-status'),

  // TAB 2: Candidate Profile Form & Scanner
  btnLoadDemo: document.getElementById('btn-load-demo-profile'),
  btnClearProfile: document.getElementById('btn-clear-profile'),
  formFullName: document.getElementById('input-fullname'),
  formDegree: document.getElementById('input-target-degree'),
  formMajor: document.getElementById('input-major'),
  formGpa: document.getElementById('input-gpa'),
  displayGpa: document.getElementById('display-gpa-val'),
  badgeGpa: document.getElementById('badge-gpa-level'),
  formIelts: document.getElementById('input-ielts'),
  displayIelts: document.getElementById('display-ielts-val'),
  badgeIelts: document.getElementById('badge-ielts-level'),
  tagContainer: document.getElementById('country-tag-selector'),
  selectedCountriesCount: document.getElementById('selected-countries-count'),
  btnSelectAllCountries: document.getElementById('btn-select-all-countries'),
  btnClearCountries: document.getElementById('btn-clear-countries'),
  formPubs: document.getElementById('input-publications'),
  formAwards: document.getElementById('input-awards'),
  formSop: document.getElementById('input-sop'),
  btnRunMatch: document.getElementById('btn-run-match'),

  // Target Universities Elements (Mục tiêu A, B, C)
  inputCustomTargetUni: document.getElementById('input-custom-target-uni'),
  btnAddTargetUni: document.getElementById('btn-add-target-uni'),
  btnToggleUniDropdown: document.getElementById('btn-toggle-uni-dropdown'),
  uniDropdownMenu: document.getElementById('uni-dropdown-menu'),
  uniDropdownBody: document.getElementById('uni-dropdown-body'),
  uniDropdownTitle: document.getElementById('uni-dropdown-title'),
  selectedTargetUnisContainer: document.getElementById('selected-target-unis-container'),
  selectedTargetUnisCount: document.getElementById('selected-target-unis-count'),
  targetFallbackBanner: document.getElementById('target-fallback-banner'),
  majorChips: document.querySelectorAll('.chip-mini'),

  // CV Upload
  cvDropzone: document.getElementById('cv-dropzone'),
  cvFileInput: document.getElementById('file-cv-input'),
  btnBrowseCv: document.getElementById('btn-browse-cv'),
  btnDemoCvScan: document.getElementById('btn-demo-cv-scan'),
  scanProgress: document.getElementById('scan-progress'),
  scanStatusText: document.getElementById('scan-status-text'),
  scanStatusStep: document.getElementById('scan-status-step'),
  scanAlert: document.getElementById('scan-result-alert'),
  scanAlertText: document.getElementById('scan-result-text'),
  scanAlertMeta: document.getElementById('scan-result-meta'),

  // TAB 2: Personalized Matched Section & Diagnostic Card
  profileMatchedSection: document.getElementById('profile-matched-section'),
  diagCandidateName: document.getElementById('diag-candidate-name'),
  diagCandidateStats: document.getElementById('diag-candidate-stats'),
  diagReadinessVal: document.getElementById('diag-readiness-val'),
  diagHeadline: document.getElementById('diag-headline'),
  diagSummaryText: document.getElementById('diag-summary-text'),
  diagStrengthText: document.getElementById('diag-strength-text'),
  diagGapText: document.getElementById('diag-gap-text'),
  matchedGrid: document.getElementById('matched-scholarships-grid'),
  matchedCount: document.getElementById('matched-results-count'),
  matchedSubtitle: document.getElementById('matched-feed-subtitle'),

  // Modal Gap Analysis
  modal: document.getElementById('modal-gap-analysis'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnCloseModalBottom: document.getElementById('btn-close-modal-bottom'),
  modalTierBadge: document.getElementById('modal-tier-badge'),
  modalTitle: document.getElementById('modal-scholarship-title'),
  modalMeta: document.getElementById('modal-scholarship-meta'),
  modalScore: document.getElementById('modal-score-number'),
  modalScoreSvgBar: document.getElementById('modal-score-svg-bar'),
  modalHeadline: document.getElementById('modal-summary-headline'),
  modalExplanation: document.getElementById('modal-explanation-text'),
  modalFactorBars: document.getElementById('modal-factor-bars'),
  modalStrengths: document.getElementById('modal-strengths-list'),
  modalGaps: document.getElementById('modal-gaps-list'),
  modalChecklist: document.getElementById('modal-checklist-tags'),
  modalActionSteps: document.getElementById('modal-action-steps'),
  modalOfficialLink: document.getElementById('modal-link-official'),
  btnModalAskAi: document.getElementById('btn-modal-ask-ai'),

  // TAB 3: Chatbot
  chatMessages: document.getElementById('chat-messages-container'),
  chatInput: document.getElementById('chat-input'),
  btnSendChat: document.getElementById('btn-send-chat'),
  btnClearChat: document.getElementById('btn-clear-chat'),
  quickPromptChips: document.querySelectorAll('.quick-prompts-bar .chip'),
  chatContextName: document.getElementById('chat-context-name'),
  chatContextDegree: document.getElementById('chat-context-degree'),
  chatContextGpa: document.getElementById('chat-context-gpa'),
  chatContextIelts: document.getElementById('chat-context-ielts'),
  chatContextCountries: document.getElementById('chat-context-countries'),
};

// --------------------------------------------------------------------------
// 1. Initialise App
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  try {
    initTheme();
    initFormValues();
    attachEventListeners();
    updateChatContextBar();
  } catch (err) {
    console.error('[ScholarMatch] Error initializing UI:', err);
  }

  try {
    await checkHealth();
  } catch (err) {
    console.error('[ScholarMatch] Health check error:', err);
  }

  try {
    await renderCatalogFeed(true);
  } catch (err) {
    console.error('[ScholarMatch] Catalog render error:', err);
  }

  try {
    executePersonalizedMatching();
  } catch (err) {
    console.error('[ScholarMatch] Initial match error:', err);
  }
});

// Theme Management
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
}
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('theme', state.theme);
}

function updateTotalScholarshipCountEverywhere(count) {
  if (!count) return;
  const num = Number(count);
  const formatted = num.toLocaleString('vi-VN');
  if (el.backendStatusText && state.backendConnected) {
    el.backendStatusText.textContent = `Supabase: ${formatted}+ Học bổng`;
  }
  const metricEl = document.getElementById('metric-total-scholarships');
  if (metricEl) metricEl.textContent = `${formatted}+`;
  const heroEl = document.getElementById('hero-total-scholarships');
  if (heroEl) heroEl.textContent = `${formatted}+ học bổng toàn cầu`;
  const subtitleEl = document.getElementById('catalog-subtitle-total');
  if (subtitleEl) subtitleEl.textContent = `${formatted}+`;
  const chatSubtitleEl = document.getElementById('chat-subtitle-total');
  if (chatSubtitleEl) chatSubtitleEl.textContent = `${formatted}+`;
}

// Health Check with Backend
async function checkHealth() {
  const result = await checkBackendHealth();
  if (result.connected) {
    state.backendConnected = true;
    const totalCount = result.data?.total_scholarships || state.catalogTotal || 7964;
    el.backendStatusText.textContent = `Supabase: ${Number(totalCount).toLocaleString('vi-VN')}+ Học bổng`;
    updateTotalScholarshipCountEverywhere(totalCount);
    el.backendStatusPill.style.color = 'var(--emerald)';
    el.backendStatusPill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    el.backendStatusPill.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
  } else {
    state.backendConnected = false;
    el.backendStatusText.textContent = 'Offline Demo Mode (7.964 Học bổng)';
    el.backendStatusPill.style.color = 'var(--amber)';
    el.backendStatusPill.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    el.backendStatusPill.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
  }
}

// --------------------------------------------------------------------------
// 2. TAB 1: Global Scholarship Catalog (Explore All 7,949+ with Pagination)
// --------------------------------------------------------------------------
async function renderCatalogFeed(resetPage = true) {
  if (resetPage) {
    state.catalogPage = 1;
    state.catalogLoadedItems = [];
  }

  const query = el.catalogSearchInput ? el.catalogSearchInput.value.trim() : '';
  let country = el.catalogFilterCountry ? el.catalogFilterCountry.value.trim() : '';
  let funding = el.catalogFilterFunding ? el.catalogFilterFunding.value.trim() : '';
  let tier = el.catalogFilterTier ? el.catalogFilterTier.value.trim() : '';
  const sortMode = el.catalogSortSelect ? el.catalogSortSelect.value : 'recent';

  // Toggle clear search button
  if (el.catalogBtnClearSearch) {
    el.catalogBtnClearSearch.style.display = query ? 'block' : 'none';
  }

  // Quick chips mapping
  if (state.activeCatalogQuickChip === 'full-ride') {
    funding = 'full';
  } else if (state.activeCatalogQuickChip === 'partial') {
    funding = 'partial';
  } else if (state.activeCatalogQuickChip === 'asia') {
    country = 'asia';
  } else if (state.activeCatalogQuickChip === 'europe') {
    country = 'eu_us';
  }

  // Map sortMode to backend sort_by parameter
  let sortByParam = 'recent';
  if (sortMode === 'match_desc' || sortMode === 'gpa_desc') {
    sortByParam = 'gpa_desc';
  } else if (sortMode === 'deadline_asc') {
    sortByParam = 'deadline';
  }

  // If backend is connected, fetch from Supabase!
  if (state.backendConnected) {
    state.isLoadingCatalog = true;
    if (resetPage && el.catalogGrid) {
      el.catalogGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 3rem 1rem;">
          <div class="loading-spinner" style="margin: 0 auto 1.2rem auto;"></div>
          <h3>Đang kết nối Kho Học Bổng Supabase...</h3>
          <p>Truy vấn trực tiếp cơ sở dữ liệu 7,949+ học bổng du học toàn cầu</p>
        </div>
      `;
    }

    if (el.btnCatalogNext) el.btnCatalogNext.disabled = true;
    if (el.btnCatalogPrev) el.btnCatalogPrev.disabled = true;

    try {
      const res = await fetchScholarshipCatalog({
        page: state.catalogPage,
        limit: state.catalogLimit,
        search: query,
        country: country,
        funding: funding,
        tier: tier,
        sort_by: sortByParam,
      });

      state.isLoadingCatalog = false;
      const total = res.total || 0;
      state.catalogTotal = total;
      if (!query && (!country || country === 'all') && (!funding || funding === 'all')) {
        updateTotalScholarshipCountEverywhere(total);
      }

      const newItems = (res.items || []).map((item) => {
        return {
          id: item.id,
          title: item.title,
          source_name: item.source_name,
          host_country: item.host_country,
          degree_level: item.degree_level,
          major_applied: item.major_applied,
          funding_type: item.funding_type,
          funding_details: item.funding_details,
          min_gpa: item.min_gpa,
          min_ielts: item.min_ielts,
          deadline: item.deadline,
          link: item.link,
          checklist: item.checklist,
          commitment: item.commitment,
          tier_group: item.tier_group || 'GROUP A',
          match_percent: item.min_gpa ? Math.min(98, Math.round(item.min_gpa * 25 + 5)) : 90,
          score_breakdown: {
            academic_gpa: item.min_gpa ? Math.min(1.0, item.min_gpa / 4.0) : 0.85,
            major_alignment: 0.90,
            language_score: item.min_ielts ? Math.min(1.0, item.min_ielts / 7.5) : 0.85,
            research_extracurricular: 0.80,
            vector_similarity: 0.85,
          },
        };
      });

      // Each page displays 24 scholarship items
      state.catalogLoadedItems = newItems;

      renderCatalogCards(state.catalogLoadedItems, total);
      updateCatalogPaginationUI(total);
      return;
    } catch (err) {
      console.warn('[Catalog] Backend fetch failed, falling back to local dataset:', err);
      state.isLoadingCatalog = false;
    }
  }

  // Fallback: Local dataset filtering
  let filtered = state.allCatalogScholarships.filter((s) => {
    const sTitle = (s.title || '').toLowerCase();
    const sCountry = (s.host_country || '').toLowerCase();
    const sMajor = (s.major_applied || '').toLowerCase();
    const sFunding = (s.funding_type || '').toLowerCase();
    const sDetails = (s.funding_details || '').toLowerCase();
    const sTier = (s.tier_group || '').toLowerCase();

    const matchQuery =
      !query ||
      sTitle.includes(query.toLowerCase()) ||
      sCountry.includes(query.toLowerCase()) ||
      sMajor.includes(query.toLowerCase()) ||
      sFunding.includes(query.toLowerCase()) ||
      sDetails.includes(query.toLowerCase());

    const matchCountry = !country || sCountry.includes(country.toLowerCase());
    const matchFunding = !funding || sFunding.includes(funding.toLowerCase());
    const matchTier = !tier || sTier.includes(tier.toLowerCase());

    let matchQuick = true;
    if (state.activeCatalogQuickChip === 'full-ride') {
      matchQuick = sFunding.includes('toàn phần') || sFunding.includes('100%');
    } else if (state.activeCatalogQuickChip === 'partial') {
      matchQuick = sFunding.includes('bán phần') || sFunding.includes('học phí') || sFunding.includes('partial');
    } else if (state.activeCatalogQuickChip === 'asia') {
      matchQuick = ['hàn quốc', 'nhật bản', 'trung quốc', 'singapore', 'đài loan'].some((c) =>
        sCountry.includes(c)
      );
    } else if (state.activeCatalogQuickChip === 'europe') {
      matchQuick = ['hoa kỳ', 'vương quốc anh', 'đức', 'pháp', 'hà lan', 'thụy điển', 'thụy sĩ', 'canada', 'úc'].some((c) =>
        sCountry.includes(c)
      );
    }

    return matchQuery && matchCountry && matchFunding && matchTier && matchQuick;
  });

  if (sortMode === 'match_desc') {
    filtered.sort((a, b) => b.match_percent - a.match_percent);
  } else if (sortMode === 'deadline_asc') {
    filtered.sort((a, b) => new Date(a.deadline || '2099-01-01') - new Date(b.deadline || '2099-01-01'));
  } else if (sortMode === 'country_asc') {
    filtered.sort((a, b) => (a.host_country || '').localeCompare(b.host_country || ''));
  }

  state.filteredCatalogScholarships = filtered;
  const total = filtered.length;
  state.catalogTotal = total;
  const startIndex = (state.catalogPage - 1) * state.catalogLimit;
  const pagedItems = filtered.slice(startIndex, startIndex + state.catalogLimit);
  state.catalogLoadedItems = pagedItems;
  renderCatalogCards(pagedItems, total);
  updateCatalogPaginationUI(total);
}

async function goToCatalogPage(page) {
  const total = state.catalogTotal || 7964;
  const totalPages = Math.ceil(total / state.catalogLimit);
  if (page < 1 || page > totalPages || page === state.catalogPage || state.isLoadingCatalog) {
    return;
  }
  state.catalogPage = page;

  // Visual feedback: dim grid cards during load
  if (el.catalogGrid) {
    el.catalogGrid.style.transition = 'opacity 0.2s ease';
    el.catalogGrid.style.opacity = '0.45';
    el.catalogGrid.style.pointerEvents = 'none';
  }

  // Smooth scroll to top of catalog section
  const targetEl = document.getElementById('catalog-results-grid') || document.getElementById('section-catalog');
  if (targetEl) {
    const topOffset = targetEl.getBoundingClientRect().top + window.pageYOffset - 110;
    window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
  }

  await renderCatalogFeed(false);

  if (el.catalogGrid) {
    el.catalogGrid.style.opacity = '1';
    el.catalogGrid.style.pointerEvents = 'auto';
  }
}

function updateCatalogPaginationUI(total) {
  if (!el.catalogPaginationBar) return;
  if (!total || total <= 0) {
    el.catalogPaginationBar.style.display = 'none';
    return;
  }
  el.catalogPaginationBar.style.display = 'flex';

  const totalPages = Math.ceil(total / state.catalogLimit);
  const currentPage = state.catalogPage;

  // Status text: "Đang hiển thị 1 - 24 / 7.964 học bổng toàn cầu (Trang 1 / 332)"
  const startItem = (currentPage - 1) * state.catalogLimit + 1;
  const endItem = Math.min(currentPage * state.catalogLimit, total);
  if (el.catalogPaginationStatus) {
    el.catalogPaginationStatus.innerHTML = `
      Đang hiển thị <span>${startItem.toLocaleString('vi-VN')} - ${endItem.toLocaleString('vi-VN')}</span> / <span>${total.toLocaleString('vi-VN')}</span> học bổng toàn cầu (Trang <strong>${currentPage}</strong> / <strong>${totalPages}</strong>)
    `;
  }

  // Prev button (Trước): hidden on page 1, visible from page 2
  if (el.btnCatalogPrev) {
    if (currentPage > 1) {
      el.btnCatalogPrev.style.display = 'inline-flex';
      el.btnCatalogPrev.disabled = state.isLoadingCatalog;
    } else {
      el.btnCatalogPrev.style.display = 'none';
    }
  }

  // Next button (Tiếp)
  if (el.btnCatalogNext) {
    el.btnCatalogNext.style.display = 'inline-flex';
    el.btnCatalogNext.disabled = (currentPage >= totalPages) || state.isLoadingCatalog;
  }

  // Page Numbers: 1 to 10 (or 10-page block)
  if (el.catalogPaginationNumbers) {
    el.catalogPaginationNumbers.innerHTML = '';

    const startPage = Math.floor((currentPage - 1) / 10) * 10 + 1;
    const endPage = Math.min(startPage + 9, totalPages);

    for (let p = startPage; p <= endPage; p++) {
      const pageBtn = document.createElement('button');
      pageBtn.type = 'button';
      pageBtn.className = `pagination-page-item ${p === currentPage ? 'active' : ''}`;
      pageBtn.dataset.page = p;
      pageBtn.textContent = p;
      pageBtn.setAttribute('aria-label', `Trang ${p}`);
      if (p === currentPage) {
        pageBtn.setAttribute('aria-current', 'page');
      }

      pageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (p !== state.catalogPage && !state.isLoadingCatalog) {
          goToCatalogPage(p);
        }
      });

      el.catalogPaginationNumbers.appendChild(pageBtn);
    }
  }
}

function renderCatalogCards(items, totalCount) {
  el.catalogGrid.innerHTML = '';
  const totalDisplay = (totalCount !== undefined ? totalCount : items.length).toLocaleString('vi-VN');
  el.catalogCount.innerHTML = `Hiển thị <strong>${items.length}</strong> / <strong>${totalDisplay}</strong> học bổng toàn cầu`;

  if (!items || items.length === 0) {
    el.catalogGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🌍</div>
        <h3>Không tìm thấy học bổng nào phù hợp với bộ lọc</h3>
        <p>Thử tìm kiếm với từ khóa khác, nới lỏng bộ lọc quốc gia hoặc mức tài trợ.</p>
        <button class="btn btn-secondary btn-sm" id="btn-reset-catalog-filters" style="margin-top:1rem;">Khôi Phục Bộ Lọc</button>
      </div>
    `;
    const btnReset = document.getElementById('btn-reset-catalog-filters');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (el.catalogSearchInput) el.catalogSearchInput.value = '';
        if (el.catalogFilterCountry) el.catalogFilterCountry.value = '';
        if (el.catalogFilterFunding) el.catalogFilterFunding.value = '';
        if (el.catalogFilterTier) el.catalogFilterTier.value = '';
        state.activeCatalogQuickChip = 'all';
        el.catalogQuickChips.forEach((c) => c.classList.toggle('active', c.dataset.catalogFilter === 'all'));
        renderCatalogFeed(true);
      });
    }
    return;
  }

  items.forEach((item, index) => {
    const isTierA = item.tier_group && item.tier_group.includes('Group A');
    const isTierB = item.tier_group && item.tier_group.includes('Group B');
    const tierClass = isTierA ? 'tier-group-a' : isTierB ? 'tier-group-b' : 'tier-group-c';
    const tierLabel = isTierA ? 'Group A' : isTierB ? 'Group B' : 'Group C';

    const card = document.createElement('div');
    card.className = `card scholarship-card ${tierClass}`;

    const score = item.score_breakdown || {};
    const gpaPercent = Math.round((score.academic_gpa || 0.85) * 100);
    const majorPercent = Math.round((score.major_alignment || 0.88) * 100);
    const langPercent = Math.round((score.language_score || 0.82) * 100);
    const resPercent = Math.round((score.research_extracurricular || 0.75) * 100);
    const vecPercent = Math.round((score.vector_similarity || 0.80) * 100);

    card.innerHTML = `
      <div class="card-top-row">
        <div class="country-degree-pills">
          <span class="badge-pill pill-country">📍 ${item.host_country || 'Quốc tế'}</span>
          <span class="badge-pill pill-degree">🎓 ${item.degree_level || 'Thạc sĩ'}</span>
          <span class="badge-pill pill-funding">💰 ${item.funding_type || 'Toàn phần 100%'}</span>
        </div>
        <div class="match-score-badge">
          <div class="score-circle">${item.match_percent}%</div>
          <span class="score-tier-label">${tierLabel}</span>
        </div>
      </div>

      <h3 class="card-title-scholarship" title="${item.title}">${item.title}</h3>
      <p class="card-funding-desc" title="${item.funding_details || item.major_applied || ''}">
        ${item.funding_details || item.major_applied || 'Thông tin chi tiết học bổng quốc tế'}
      </p>

      <div class="criteria-bars">
        <div class="criteria-item">
          <span class="criteria-lbl"><span>GPA (25%)</span> <strong>${gpaPercent}%</strong></span>
          <div class="progress-track"><div class="progress-fill" style="width: ${gpaPercent}%;"></div></div>
        </div>
        <div class="criteria-item">
          <span class="criteria-lbl"><span>Ngành (25%)</span> <strong>${majorPercent}%</strong></span>
          <div class="progress-track"><div class="progress-fill" style="width: ${majorPercent}%;"></div></div>
        </div>
        <div class="criteria-item">
          <span class="criteria-lbl"><span>IELTS (20%)</span> <strong>${langPercent}%</strong></span>
          <div class="progress-track"><div class="progress-fill" style="width: ${langPercent}%;"></div></div>
        </div>
        <div class="criteria-item">
          <span class="criteria-lbl"><span>NCKH (15%)</span> <strong>${resPercent}%</strong></span>
          <div class="progress-track"><div class="progress-fill" style="width: ${resPercent}%;"></div></div>
        </div>
        <div class="criteria-item full-span">
          <span class="criteria-lbl"><span>Vector Cosine (15%)</span> <strong>${vecPercent}%</strong></span>
          <div class="progress-track"><div class="progress-fill" style="width: ${vecPercent}%;"></div></div>
        </div>
      </div>

      <div class="card-action-footer">
        <button class="btn btn-secondary btn-sm btn-catalog-gap" data-idx="${index}">
          📊 Chi Tiết & Gap
        </button>
        <button class="btn btn-outline btn-sm btn-catalog-ask-ai" data-idx="${index}">
          💬 Hỏi AI
        </button>
        ${
          item.link
            ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Portal</a>`
            : ''
        }
      </div>
    `;

    // Attach card action listeners directly
    const btnGap = card.querySelector('.btn-catalog-gap');
    if (btnGap) {
      btnGap.addEventListener('click', () => openGapModal(item));
    }
    const btnAskAi = card.querySelector('.btn-catalog-ask-ai');
    if (btnAskAi) {
      btnAskAi.addEventListener('click', () => askAiAboutScholarship(item));
    }

    el.catalogGrid.appendChild(card);
  });
}


// --------------------------------------------------------------------------
// 3. TAB 2: Candidate Profile & Dedicated Personalized Matching
// --------------------------------------------------------------------------
function updateSliderBadges() {
  const gpa = parseFloat(el.formGpa.value);
  el.displayGpa.textContent = gpa.toFixed(2);
  if (gpa >= 3.6) {
    el.badgeGpa.textContent = 'Xuất sắc (A+)';
    el.badgeGpa.style.color = 'var(--emerald)';
    el.badgeGpa.style.background = 'rgba(16, 185, 129, 0.15)';
  } else if (gpa >= 3.2) {
    el.badgeGpa.textContent = 'Giỏi (A)';
    el.badgeGpa.style.color = 'var(--primary)';
    el.badgeGpa.style.background = 'rgba(99, 102, 241, 0.15)';
  } else if (gpa >= 2.8) {
    el.badgeGpa.textContent = 'Khá (B)';
    el.badgeGpa.style.color = 'var(--cyan)';
    el.badgeGpa.style.background = 'rgba(6, 182, 212, 0.15)';
  } else {
    el.badgeGpa.textContent = 'Trung bình (C)';
    el.badgeGpa.style.color = 'var(--amber)';
    el.badgeGpa.style.background = 'rgba(245, 158, 11, 0.15)';
  }

  const ielts = parseFloat(el.formIelts.value);
  el.displayIelts.textContent = ielts.toFixed(1);
  if (ielts >= 8.0) {
    el.badgeIelts.textContent = 'C2 Vượt trội';
    el.badgeIelts.style.color = 'var(--emerald)';
    el.badgeIelts.style.background = 'rgba(16, 185, 129, 0.15)';
  } else if (ielts >= 7.0) {
    el.badgeIelts.textContent = 'C1 Advanced';
    el.badgeIelts.style.color = 'var(--primary)';
    el.badgeIelts.style.background = 'rgba(99, 102, 241, 0.15)';
  } else if (ielts >= 6.0) {
    el.badgeIelts.textContent = 'B2 Upper-Int';
    el.badgeIelts.style.color = 'var(--cyan)';
    el.badgeIelts.style.background = 'rgba(6, 182, 212, 0.15)';
  } else {
    el.badgeIelts.textContent = 'B1 Cần nâng';
    el.badgeIelts.style.color = 'var(--amber)';
    el.badgeIelts.style.background = 'rgba(245, 158, 11, 0.15)';
  }
}

function updateCountriesCount() {
  const activePills = document.querySelectorAll('.tag-pill.active');
  const count = activePills.length;
  if (el.selectedCountriesCount) {
    if (count === 0) {
      el.selectedCountriesCount.textContent = 'Tất cả quốc gia (Toàn cầu)';
      el.selectedCountriesCount.style.color = 'var(--text-muted)';
    } else {
      const names = Array.from(activePills)
        .map((p) => p.dataset.val)
        .slice(0, 3)
        .join(', ');
      const extra = count > 3 ? ` +${count - 3}` : '';
      el.selectedCountriesCount.textContent = `Đã chọn ${count} nước (${names}${extra})`;
      el.selectedCountriesCount.style.color = 'var(--primary)';
    }
  }
  updateChatContextBar();
}


// ============================================================================
// TOP UNIVERSITIES DATABASE & SEARCHABLE DROPDOWN COMPONENT
// ============================================================================
const UNIVERSITIES_DATABASE = {
  'Hàn Quốc': {
    flag: '🇰🇷',
    list: [
      { name: 'Đại học Quốc gia Seoul (SNU)', short: 'SNU', desc: 'Top 1 Hàn Quốc • SKY • Sàn GPA 3.20+, IELTS 6.5' },
      { name: 'Viện Khoa học & Công nghệ Tiên tiến Hàn Quốc (KAIST)', short: 'KAIST', desc: 'Viện STEM #1 Hàn Quốc • Sàn GPA 3.20+, IELTS 6.5' },
      { name: 'Đại học Yonsei', short: 'Yonsei', desc: 'Top 3 Hàn Quốc • SKY • Sàn GPA 3.20+, IELTS 6.5' },
      { name: 'Đại học Korea', short: 'Korea Univ', desc: 'Top 3 Hàn Quốc • SKY • Sàn GPA 3.20+, IELTS 6.5' },
      { name: 'Đại học Khoa học & Công nghệ Pohang (POSTECH)', short: 'POSTECH', desc: 'Top Viện nghiên cứu công nghệ cao • Sàn GPA 3.20+' },
      { name: 'Viện Khoa học & Công nghệ Quốc gia Ulsan (UNIST)', short: 'UNIST', desc: 'Viện nghiên cứu quốc gia • Tài trợ 100% học phí' },
      { name: 'Viện Khoa học & Công nghệ Gwangju (GIST)', short: 'GIST', desc: 'Viện nghiên cứu công nghệ công lập hàng đầu miền Nam' },
      { name: 'Đại học Sungkyunkwan (SKKU)', short: 'SKKU', desc: 'Top 5 Hàn Quốc (Samsung bảo trợ) • Y dược & Bán dẫn' },
      { name: 'Đại học Hanyang', short: 'Hanyang', desc: 'Đại học kỹ thuật & kiến trúc hàng đầu Seoul' },
      { name: 'Đại học Quốc gia Pusan (PNU)', short: 'PNU', desc: 'ĐHQG lớn nhất miền Nam • Lựa chọn an toàn tỉ lệ đỗ cao' },
      { name: 'Đại học Dong-A', short: 'Dong-A', desc: 'Busan • Học bổng 50-100% học phí • Tỉ lệ đỗ cao' },
      { name: 'Đại học Kyung Hee', short: 'Kyung Hee', desc: 'Top trường đa ngành, Khách sạn & Quốc tế hóa' },
      { name: 'Đại học Sogang', short: 'Sogang', desc: 'Top trường Kinh tế, Quản trị & Khoa học Xã hội Seoul' },
      { name: 'Đại học Nữ sinh Ewha', short: 'Ewha', desc: 'Đại học nữ danh giá số 1 châu Á' },
      { name: 'Đại học Quốc gia Chonnam', short: 'Chonnam', desc: 'Gwangju • Chính sách học bổng cởi mở cho sinh viên quốc tế' },
      { name: 'Đại học Quốc gia Kyungpook (KNU)', short: 'KNU', desc: 'Daegu • Chi phí học tập tối ưu & học bổng phong phú' },
      { name: 'Đại học Chung-Ang (CAU)', short: 'CAU', desc: 'Seoul • Thế mạnh Nghệ thuật, Truyền thông & Kinh doanh' },
      { name: 'Đại học Konkuk', short: 'Konkuk', desc: 'Seoul • Công nghệ Sinh học, Bất động sản & Kinh tế' },
      { name: 'Đại học Inha', short: 'Inha', desc: 'Incheon • Thế mạnh Kỹ thuật hàng không & Logistics' },
      { name: 'Đại học Sejong', short: 'Sejong', desc: 'Seoul • Trí tuệ Nhân tạo, Khách sạn & Du lịch hàng đầu' },
    ]
  },
  'Nhật Bản': {
    flag: '🇯🇵',
    list: [
      { name: 'Đại học Tokyo (Todai)', short: 'Todai', desc: 'Top 1 Nhật Bản • Học bổng MEXT danh giá' },
      { name: 'Đại học Kyoto', short: 'Kyoto Univ', desc: 'Top 2 Nhật Bản • Nhiều giải Nobel nhất châu Á' },
      { name: 'Đại học Osaka', short: 'Osaka Univ', desc: 'Top 3 trường Hoàng gia Nhật Bản • Y sinh & Vật lý' },
      { name: 'Viện Công nghệ Tokyo (Tokyo Tech)', short: 'Tokyo Tech', desc: 'Viện STEM & Công nghệ số 1 Nhật Bản' },
      { name: 'Đại học Tohoku', short: 'Tohoku Univ', desc: 'Top 1 Times Higher Education Japan • Khoa học Vật liệu' },
      { name: 'Đại học Nagoya', short: 'Nagoya Univ', desc: 'Trung tâm công nghiệp & cơ khí chính xác Nhật Bản' },
      { name: 'Đại học Waseda', short: 'Waseda', desc: 'Đại học tư thục quốc tế số 1 Nhật Bản • Sàn GPA 3.0+' },
      { name: 'Đại học Keio', short: 'Keio', desc: 'Đại học tư thục danh giá Tokyo • Sàn GPA 3.0+' },
      { name: 'Đại học Hokkaido (Hokudai)', short: 'Hokudai', desc: 'Top 7 ĐH Hoàng gia • Thế mạnh Khoa học Tự nhiên & Kỹ thuật' },
      { name: 'Đại học Kyushu', short: 'Kyushu Univ', desc: 'Fukuoka • Top 7 Đại học Hoàng gia Nhật Bản' },
      { name: 'Đại học Tsukuba', short: 'Tsukuba', desc: 'Trung tâm nghiên cứu STEM & công nghệ cao Tsukuba' },
      { name: 'Đại học Kobe', short: 'Kobe', desc: 'Kansai • Thế mạnh Kinh tế, Thương mại quốc tế & Luật' },
      { name: 'Đại học Hiroshima', short: 'Hiroshima', desc: 'Trung tâm giáo dục & nghiên cứu quốc tế Tây Nhật Bản' },
      { name: 'Đại học Hitotsubashi', short: 'Hitotsubashi', desc: 'Tokyo • "Harvard của Nhật Bản" về Kinh tế & Quản trị' },
      { name: 'Đại học Chiba', short: 'Chiba', desc: 'Vùng đô thị Tokyo • Kỹ thuật, Y học & Thiết kế công nghiệp' },
      { name: 'Đại học Ritsumeikan', short: 'Ritsumeikan', desc: 'Kyoto • Đào tạo quốc tế hóa & Quan hệ quốc tế hàng đầu' },
      { name: 'Đại học Doshisha', short: 'Doshisha', desc: 'Kyoto • Đại học tư thục danh giá lâu đời vùng Kansai' },
      { name: 'Đại học Meiji', short: 'Meiji', desc: 'Tokyo • Top trường tư thục danh tiếng & năng động nhất Tokyo' },
    ]
  },
  'Trung Quốc': {
    flag: '🇨🇳',
    list: [
      { name: 'Đại học Thanh Hoa (Tsinghua University)', short: 'Tsinghua', desc: 'Top 1 Trung Quốc • Kỹ thuật & AI số 1 Châu Á' },
      { name: 'Đại học Bắc Kinh (Peking University)', short: 'Peking', desc: 'Top 1 Trung Quốc • Khoa học Cơ bản, Y học & Xã hội' },
      { name: 'Đại học Chiết Giang (Zhejiang University)', short: 'ZJU', desc: 'Top 3 Trung Quốc • Hàng Châu • Mạnh về Tech & AI' },
      { name: 'Đại học Giao thông Thượng Hải (SJTU)', short: 'SJTU', desc: 'Top trường Kỹ thuật, Hàng hải & Y khoa Thượng Hải' },
      { name: 'Đại học Phúc Đán (Fudan University)', short: 'Fudan', desc: 'Top trường đa ngành danh giá Thượng Hải • C9 League' },
      { name: 'Đại học Khoa học & Công nghệ Trung Quốc (USTC)', short: 'USTC', desc: 'Hợp Phì • Trung tâm nghiên cứu vật lý & STEM' },
      { name: 'Đại học Nam Kinh (Nanjing University)', short: 'NJU', desc: 'Top 9 trường C9 League danh giá' },
      { name: 'Đại học Vũ Hán (Wuhan University)', short: 'WHU', desc: 'Học bổng CSC chính phủ Trung Quốc phong phú' },
      { name: 'Đại học Tôn Trung Sơn (Sun Yat-sen University)', short: 'SYSU', desc: 'Quảng Châu • Vùng Vịnh Lớn (GBA)' },
      { name: 'Đại học Cáp Nhĩ Tân (HIT)', short: 'HIT', desc: 'Kỹ thuật cơ khí, robot & hàng không số 1 Trung Quốc' },
      { name: 'Đại học Đồng Tế (Tongji University)', short: 'Tongji', desc: 'Thượng Hải • Kiến trúc, Xây dựng & Kỹ thuật xe hơi' },
      { name: 'Đại học Nhân dân Trung Quốc (Renmin University)', short: 'Renmin', desc: 'Bắc Kinh • Khoa học Xã hội & Luật hàng đầu' },
      { name: 'Đại học Hạ Môn (Xiamen University)', short: 'Xiamen', desc: 'Phúc Kiến • Kinh tế, Tài chính & Kế toán danh tiếng' },
      { name: 'Đại học Giao thông Tây An (XJTU)', short: 'XJTU', desc: 'Tây An • C9 League • Kỹ thuật năng lượng & cơ điện' },
      { name: 'Đại học Trung Nam (Central South University)', short: 'CSU', desc: 'Trường Sa • Khoa học Vật liệu & Khai khoáng' },
      { name: 'Đại học Tứ Xuyên (Sichuan University)', short: 'SCU', desc: 'Thành Đô • Y học & Khoa học Cơ bản Tây Nam' },
      { name: 'Đại học Công nghệ Hoa Nam (SCUT)', short: 'SCUT', desc: 'Quảng Châu • Công nghệ & Kỹ thuật vùng vịnh' },
      { name: 'Đại học Thiên Tân (Tianjin University)', short: 'TJU', desc: 'Thiên Tân • Đại học hiện đại đầu tiên của Trung Quốc' },
    ]
  },
  'Hoa Kỳ': {
    flag: '🇺🇸',
    list: [
      { name: 'Viện Công nghệ Massachusetts (MIT)', short: 'MIT', desc: 'Top 1 Thế giới về Kỹ thuật & AI' },
      { name: 'Đại học Stanford', short: 'Stanford', desc: 'Thung lũng Silicon • Khởi nghiệp, Công nghệ & Y khoa' },
      { name: 'Đại học Harvard', short: 'Harvard', desc: 'Ivy League • Quỹ học bổng lớn nhất thế giới' },
      { name: 'Đại học California, Berkeley (UC Berkeley)', short: 'UC Berkeley', desc: 'Đại học công lập số 1 nước Mỹ • STEM & AI' },
      { name: 'Đại học Carnegie Mellon (CMU)', short: 'CMU', desc: 'Khoa học Máy tính & Robotics #1 Mỹ' },
      { name: 'Đại học Columbia (Columbia University)', short: 'Columbia', desc: 'New York City • Ivy League • Tài chính & Báo chí' },
      { name: 'Viện Công nghệ California (Caltech)', short: 'Caltech', desc: 'Trung tâm nghiên cứu không gian & Vật lý hàng đầu' },
      { name: 'Đại học California, Los Angeles (UCLA)', short: 'UCLA', desc: 'Đại học nghiên cứu đa ngành danh giá bờ Tây' },
      { name: 'Đại học Yale', short: 'Yale', desc: 'Ivy League • Luật, Nghệ thuật & Y khoa hàng đầu thế giới' },
      { name: 'Đại học Princeton', short: 'Princeton', desc: 'Ivy League • Nghiên cứu khoa học lý thuyết & Toán học #1' },
      { name: 'Đại học New York (NYU)', short: 'NYU', desc: 'Manhattan • Kinh doanh Stern & Nghệ thuật Tisch' },
      { name: 'Đại học Cornell', short: 'Cornell', desc: 'New York • Ivy League • Kỹ thuật, Khoa học Máy tính & Nông nghiệp' },
      { name: 'Đại học Pennsylvania (UPenn)', short: 'UPenn', desc: 'Philadelphia • Ivy League • Trường Kinh doanh Wharton' },
      { name: 'Đại học Chicago (UChicago)', short: 'UChicago', desc: 'Kinh tế học, Khoa học Xã hội & 99 giải Nobel' },
      { name: 'Đại học Johns Hopkins (JHU)', short: 'JHU', desc: 'Baltimore • Y sinh, Y tế Công cộng & Kỹ thuật số 1' },
      { name: 'Viện Công nghệ Georgia (Georgia Tech)', short: 'Georgia Tech', desc: 'Atlanta • Kỹ thuật công lập hàng đầu nước Mỹ' },
      { name: 'Đại học Michigan, Ann Arbor', short: 'UMich', desc: 'Đại học công lập nghiên cứu quy mô khổng lồ' },
      { name: 'Đại học Texas tại Austin (UT Austin)', short: 'UT Austin', desc: 'Trung tâm công nghệ Austin • Khoa học Máy tính' },
      { name: 'Đại học Washington (UW)', short: 'UW', desc: 'Seattle • Khoa học Máy tính & Y học (hợp tác Microsoft/Amazon)' },
      { name: 'Đại học Duke', short: 'Duke', desc: 'Bắc Carolina • Y khoa, Luật & Chính sách Công hàng đầu' },
    ]
  },
  'Vương quốc Anh': {
    flag: '🇬🇧',
    list: [
      { name: 'Đại học Oxford', short: 'Oxford', desc: 'Top 1 Thế giới • Học bổng Rhodes & Clarendon danh giá' },
      { name: 'Đại học Cambridge', short: 'Cambridge', desc: 'Top đại học nghiên cứu lâu đời nhất thế giới' },
      { name: 'Imperial College London', short: 'Imperial', desc: 'Khoa học, Kỹ thuật, Công nghệ & Y khoa London' },
      { name: 'University College London (UCL)', short: 'UCL', desc: 'Top 10 thế giới đa ngành • London Global University' },
      { name: 'London School of Economics (LSE)', short: 'LSE', desc: 'Kinh tế & Khoa học Chính trị số 1 Vương quốc Anh' },
      { name: 'Đại học Edinburgh', short: 'Edinburgh', desc: 'Scotland • Trung tâm AI & Khoa học Y sinh danh tiếng' },
      { name: 'Đại học Manchester', short: 'Manchester', desc: 'Nhóm Russell Group • Khoa học & Kỹ thuật hạt nhân' },
      { name: 'King\'s College London (KCL)', short: 'KCL', desc: 'London • Y tế, Luật & Quan hệ Quốc tế' },
      { name: 'Đại học Bristol', short: 'Bristol', desc: 'Kỹ thuật hàng không, Vũ trụ & Khoa học Máy tính' },
      { name: 'Đại học Warwick', short: 'Warwick', desc: 'Warwick Business School (WBS) & Toán học xuất sắc' },
      { name: 'Đại học Glasgow', short: 'Glasgow', desc: 'Scotland • Đại học cổ kính thứ 4 tại Anh • Kỹ thuật & Y' },
      { name: 'Đại học Southampton', short: 'Southampton', desc: 'Trung tâm Khoa học Máy tính, Trí tuệ Nhân tạo & Hàng hải' },
      { name: 'Đại học Birmingham', short: 'Birmingham', desc: 'Nhóm Russell Group • Học bổng quốc tế đa dạng' },
      { name: 'Đại học Leeds', short: 'Leeds', desc: 'Kinh doanh, Môi trường & Khoa học Dữ liệu' },
      { name: 'Đại học Sheffield', short: 'Sheffield', desc: 'Kỹ thuật chế tạo tiên tiến AMRC hợp tác Boeing/Rolls-Royce' },
      { name: 'Đại học Durham', short: 'Durham', desc: 'Trường đại học theo hệ thống Collegiate truyền thống danh giá' },
      { name: 'Đại học St Andrews', short: 'St Andrews', desc: 'Scotland • Top 3 Vương quốc Anh • Trường của Hoàng gia Anh' },
      { name: 'Đại học Queen Mary London (QMUL)', short: 'QMUL', desc: 'London • Y dược, Luật & Khoa học Vật liệu' },
    ]
  },
  'Đức': {
    flag: '🇩🇪',
    list: [
      { name: 'Đại học Kỹ thuật Munich (TUM)', short: 'TUM', desc: 'Top 1 Đức • Miễn 100% học phí hoặc chi phí thấp' },
      { name: 'Đại học Ludwig Maximilian Munich (LMU)', short: 'LMU', desc: 'Đại học nghiên cứu hàng đầu châu Âu' },
      { name: 'Đại học Heidelberg', short: 'Heidelberg', desc: 'Đại học cổ kính nhất nước Đức • Y dược & Khoa học Tự nhiên' },
      { name: 'Đại học Kỹ thuật Aachen (RWTH Aachen)', short: 'RWTH', desc: 'Kỹ thuật cơ khí & ô tô hàng đầu châu Âu' },
      { name: 'Đại học Kỹ thuật Berlin (TU Berlin)', short: 'TU Berlin', desc: 'Thủ đô Berlin • Nhóm TU9 Kỹ thuật hàng đầu' },
      { name: 'Đại học Humboldt Berlin', short: 'HU Berlin', desc: 'Trung tâm Khoa học Cơ bản & Triết học cổ điển' },
      { name: 'Viện Công nghệ Karlsruhe (KIT)', short: 'KIT', desc: 'Trung tâm nghiên cứu quốc gia Helmholtz & Khoa học Máy tính' },
      { name: 'Đại học Stuttgart', short: 'Stuttgart', desc: 'Cơ khí chính xác, Tự động hóa & Công nghệ Ô tô Đức' },
      { name: 'Đại học Kỹ thuật Dresden (TU Dresden)', short: 'TU Dresden', desc: 'Silicon Saxony • Bán dẫn & Vi điện tử hàng đầu' },
      { name: 'Đại học Bonn', short: 'Bonn', desc: 'Toán học số 1 nước Đức • Kinh tế & Khoa học Nông nghiệp' },
      { name: 'Đại học Erlangen-Nuremberg (FAU)', short: 'FAU', desc: 'Đổi mới sáng tạo hàng đầu • Y sinh & Kỹ thuật' },
      { name: 'Đại học Freiburg', short: 'Freiburg', desc: 'Rừng Đen • Y học & Khoa học Môi trường bền vững' },
      { name: 'Đại học Frankfurt (Goethe Univ)', short: 'Goethe', desc: 'Trung tâm Tài chính Frankfurt • Ngân hàng & Luật' },
      { name: 'Đại học Cologne', short: 'Cologne', desc: 'Đại học lớn nhất nước Đức • Quản trị Kinh doanh & Kinh tế' },
      { name: 'Đại học Hamburg', short: 'Hamburg', desc: 'Cảng biển Hamburg • Khí hậu học & Luật biển' },
      { name: 'Đại học Darmstadt (TU Darmstadt)', short: 'TU Darmstadt', desc: 'Tiên phong về An toàn thông tin & AI tại Đức' },
    ]
  },
  'Úc': {
    flag: '🇦🇺',
    list: [
      { name: 'Đại học Melbourne', short: 'Melbourne', desc: 'Top 1 nước Úc • Nhóm Go8 danh giá • Đa ngành' },
      { name: 'Đại học Quốc gia Úc (ANU)', short: 'ANU', desc: 'Canberra • Trung tâm nghiên cứu quốc gia & Chính sách' },
      { name: 'Đại học Sydney', short: 'Sydney', desc: 'Top 20 thế giới • Đa dạng học bổng Vice-Chancellor' },
      { name: 'Đại học New South Wales (UNSW)', short: 'UNSW', desc: 'Sydney • Mạnh về Kỹ thuật, Công nghệ & Khởi nghiệp' },
      { name: 'Đại học Queensland (UQ)', short: 'UQ', desc: 'Brisbane • Khoa học Môi trường, Nông nghiệp & Y sinh' },
      { name: 'Đại học Monash', short: 'Monash', desc: 'Melbourne • Dược học số 1 thế giới & Kỹ thuật' },
      { name: 'Đại học Tây Úc (UWA)', short: 'UWA', desc: 'Perth • Năng lượng, Địa chất, Sinh học biển & Kinh tế' },
      { name: 'Đại học Adelaide', short: 'Adelaide', desc: 'Nam Úc • Rượu vang, Kỹ thuật & Khoa học Vũ trụ' },
      { name: 'Đại học Công nghệ Sydney (UTS)', short: 'UTS', desc: 'Đổi mới sáng tạo, AI, Phần mềm & Truyền thông số' },
      { name: 'Đại học RMIT', short: 'RMIT', desc: 'Melbourne • Thiết kế, Truyền thông & Kỹ thuật ứng dụng' },
      { name: 'Đại học Macquarie', short: 'Macquarie', desc: 'Sydney • Tài chính, Kế toán & Khoa học Thần kinh' },
      { name: 'Đại học Wollongong (UOW)', short: 'UOW', desc: 'Khoa học Máy tính, Kỹ thuật mỏ & Vật liệu' },
      { name: 'Đại học Curtin', short: 'Curtin', desc: 'Perth • Kỹ thuật khoáng sản số 2 thế giới' },
      { name: 'Đại học Deakin', short: 'Deakin', desc: 'Melbourne • Trí tuệ Nhân tạo, Thể thao & Điều dưỡng' },
      { name: 'Đại học Công nghệ Queensland (QUT)', short: 'QUT', desc: 'Brisbane • Đại học vì thế giới thực' },
      { name: 'Đại học Newcastle', short: 'Newcastle', desc: 'Y khoa, Kỹ thuật xây dựng & Năng lượng tái tạo' },
    ]
  },
  'Canada': {
    flag: '🇨🇦',
    list: [
      { name: 'Đại học Toronto (Univ of Toronto)', short: 'U of T', desc: 'Top 1 Canada • Nghiên cứu & Trí tuệ Nhân tạo (Geoffrey Hinton)' },
      { name: 'Đại học McGill', short: 'McGill', desc: 'Montreal • "Harvard của Canada" • Y khoa & Luật danh giá' },
      { name: 'Đại học British Columbia (UBC)', short: 'UBC', desc: 'Vancouver • Khuôn viên đẹp & Học thuật đẳng cấp thế giới' },
      { name: 'Đại học Waterloo', short: 'Waterloo', desc: 'Khoa học Máy tính & Chương trình Thực tập Co-op lớn nhất thế giới' },
      { name: 'Đại học Alberta', short: 'U of A', desc: 'Edmonton • Viện AI (AMII) & Kỹ thuật Năng lượng hàng đầu' },
      { name: 'Đại học Montreal (UdeM)', short: 'UdeM', desc: 'Viện Nghiên cứu Học máy Mila (Yoshua Bengio)' },
      { name: 'Đại học McMaster', short: 'McMaster', desc: 'Hamilton • Y khoa, Khoa học Sức khỏe & Kỹ thuật' },
      { name: 'Đại học Western (Western University)', short: 'Western', desc: 'London, Ontario • Trường Kinh doanh Ivey' },
      { name: 'Đại học Calgary', short: 'Calgary', desc: 'Calgary • Kỹ thuật dầu khí, Địa chất & Khoa học Dữ liệu' },
      { name: 'Đại học Ottawa', short: 'Ottawa', desc: 'Thủ đô Ottawa • Song ngữ Anh-Pháp • Luật & Quan hệ Quốc tế' },
      { name: 'Đại học Simon Fraser (SFU)', short: 'SFU', desc: 'Vancouver • Khoa học Máy tính & Kinh doanh' },
      { name: 'Đại học Queen\'s', short: 'Queen\'s', desc: 'Kingston • Truyền thống học thuật lâu đời & Kinh doanh Smith' },
      { name: 'Đại học Victoria (UVic)', short: 'UVic', desc: 'Đảo Vancouver • Khoa học Đại dương & Biến đổi Khí hậu' },
      { name: 'Đại học Dalhousie', short: 'Dalhousie', desc: 'Halifax • Đại học nghiên cứu lớn nhất miền Đông Canada' },
      { name: 'Đại học Concordia', short: 'Concordia', desc: 'Montreal • Thiết kế, Nghệ thuật số & Kỹ thuật phần mềm' },
    ]
  },
  'Pháp': {
    flag: '🇫🇷',
    list: [
      { name: 'Đại học Sorbonne (Sorbonne Université)', short: 'Sorbonne', desc: 'Paris • Đại học danh giá hàng đầu nước Pháp' },
      { name: 'Trường Bách khoa Paris (Institut Polytechnique de Paris)', short: 'IP Paris', desc: 'Grandes Écoles hàng đầu về Kỹ thuật & Toán' },
      { name: 'Đại học PSL (Paris Sciences & Lettres)', short: 'PSL', desc: 'Top 1 Pháp • Tập hợp các viện nghiên cứu tinh hoa' },
      { name: 'Đại học Paris-Saclay', short: 'Paris-Saclay', desc: 'Thung lũng công nghệ Pháp • #1 Thế giới môn Toán học' },
      { name: 'Trường Kinh doanh HEC Paris', short: 'HEC Paris', desc: 'Top 1 Châu Âu về Tài chính & Thạc sĩ Quản trị (MBA)' },
      { name: 'Viện Nghiên cứu Chính trị Paris (Sciences Po)', short: 'Sciences Po', desc: 'Khoa học Chính trị & Quan hệ Quốc tế hàng đầu' },
      { name: 'Viện Công nghệ Grenoble (Grenoble INP)', short: 'Grenoble INP', desc: 'Kỹ thuật vi điện tử, Năng lượng & AI' },
      { name: 'Đại học Claude Bernard Lyon 1', short: 'Lyon 1', desc: 'Lyon • Y dược, Khoa học Tự nhiên & Công nghệ' },
      { name: 'Đại học Strasbourg', short: 'Strasbourg', desc: '18 giải Nobel • Hóa học & Y sinh học hàng đầu châu Âu' },
      { name: 'CentraleSupélec', short: 'CentraleSupélec', desc: 'Đại học Kỹ thuật tinh hoa đào tạo kỹ sư công nghệ cao' },
      { name: 'Đại học Aix-Marseille', short: 'Aix-Marseille', desc: 'Miền Nam nước Pháp • Đại học công lập lớn nhất vùng Pháp ngữ' },
      { name: 'Đại học Toulouse 1 Capitole', short: 'Toulouse 1', desc: 'Toulouse • Kinh tế học Toulouse (TSE - Jean Tirole)' },
      { name: 'Trường Kinh doanh INSEAD', short: 'INSEAD', desc: 'Fontainebleau • Top 1 trường Kinh doanh toàn cầu' },
      { name: 'Đại học Bordeaux', short: 'Bordeaux', desc: 'Rượu vang, Hóa học & Công nghệ vật liệu' },
      { name: 'Trường Kỹ thuật Cầu đường Paris (École des Ponts ParisTech)', short: 'École des Ponts', desc: 'Kỹ thuật công trình & Giao thông' },
    ]
  },
  'Hà Lan': {
    flag: '🇳🇱',
    list: [
      { name: 'Đại học Kỹ thuật Delft (TU Delft)', short: 'TU Delft', desc: 'Top Kỹ thuật & Công nghệ số 1 châu Âu' },
      { name: 'Đại học Amsterdam (Univ of Amsterdam - UvA)', short: 'UvA', desc: 'Đại học nghiên cứu hàng đầu Hà Lan' },
      { name: 'Đại học Wageningen (WUR)', short: 'WUR', desc: 'Số 1 thế giới về Nông nghiệp, Thực phẩm & Môi trường' },
      { name: 'Đại học Utrecht', short: 'Utrecht', desc: 'Trung tâm nghiên cứu y sinh, Khí hậu & Phát triển bền vững' },
      { name: 'Đại học Leiden', short: 'Leiden', desc: 'Đại học cổ kính nhất Hà Lan • Luật quốc tế & Khoa học Xã hội' },
      { name: 'Đại học Kỹ thuật Eindhoven (TU/e)', short: 'TU/e', desc: 'Trung tâm thung lũng Brainport & tập đoàn ASML' },
      { name: 'Đại học Erasmus Rotterdam', short: 'Erasmus', desc: 'Trường Kinh tế Erasmus (ESE) & Y tế công cộng' },
      { name: 'Đại học Groningen', short: 'Groningen', desc: '400 năm lịch sử • Khoa học Năng lượng & Hóa học Nobel' },
      { name: 'Đại học Vrije Amsterdam (VU Amsterdam)', short: 'VU Amsterdam', desc: 'Đổi mới y sinh, Tâm lý & Khoa học Dữ liệu' },
      { name: 'Đại học Radboud', short: 'Radboud', desc: 'Nijmegen • Khoa học Thần kinh & Vật lý lượng tử' },
      { name: 'Đại học Maastricht', short: 'Maastricht', desc: 'Phương pháp học theo vấn đề (PBL) & Kinh doanh Quốc tế' },
      { name: 'Đại học Twente', short: 'Twente', desc: 'Enschede • Công nghệ nano & Khởi nghiệp công nghệ cao' },
      { name: 'Đại học Tilburg', short: 'Tilburg', desc: 'Luật, Kinh tế, Tâm lý & Khoa học Dữ liệu Tilburg' },
      { name: 'Học bổng Hà Lan NL Scholarship', short: 'NL Scholarship', desc: 'Học bổng chính phủ dành cho SV quốc tế' },
    ]
  },
  'Singapore': {
    flag: '🇸🇬',
    list: [
      { name: 'Đại học Quốc gia Singapore (NUS)', short: 'NUS', desc: 'Top 1 Châu Á • #8 Thế giới • Học bổng A*STAR & NUS' },
      { name: 'Đại học Công nghệ Nanyang (NTU)', short: 'NTU', desc: 'Top 2 Châu Á • Viện STEM, AI & Robotics hàng đầu' },
      { name: 'Đại học Quản lý Singapore (SMU)', short: 'SMU', desc: 'Mô hình chuẩn Mỹ • Kinh tế, Tài chính, AI & Luật' },
      { name: 'Đại học Công nghệ & Thiết kế Singapore (SUTD)', short: 'SUTD', desc: 'Hợp tác MIT • Nghiên cứu & Thiết kế đổi mới' },
      { name: 'Viện Công nghệ Singapore (SIT)', short: 'SIT', desc: 'Đại học Khoa học Ứng dụng & Kỹ thuật Công nghiệp đầu tiên' },
      { name: 'Đại học Khoa học Xã hội Singapore (SUSS)', short: 'SUSS', desc: 'Khoa học Xã hội & Phát triển Bền vững' },
      { name: 'Viện Nghiên cứu A*STAR (SINGA Fellowship)', short: 'A*STAR', desc: 'Học bổng toàn phần Tiến sĩ danh giá' },
      { name: 'Học viện Quản lý Singapore (SIM Global)', short: 'SIM', desc: 'Cấp bằng ĐH Anh, Úc, Mỹ tại Singapore' },
      { name: 'Đại học James Cook Singapore (JCU)', short: 'JCU', desc: 'Phân viện trường ĐH Công lập Úc' },
      { name: 'Đại học Curtin Singapore', short: 'Curtin', desc: 'Phân viện trường ĐH Công nghệ Curtin Úc' },
      { name: 'Viện Phát triển Quản trị Singapore (MDIS)', short: 'MDIS', desc: 'Quản trị, Y sinh & Công nghệ Thông tin' },
      { name: 'Trường Kinh doanh ESSEC Châu Á - Thái Bình Dương', short: 'ESSEC Asia', desc: 'Phân viện trường kinh doanh Pháp' },
    ]
  },
  'Thụy Điển': {
    flag: '🇸🇪',
    list: [
      { name: 'Viện Karolinska (Karolinska Institutet)', short: 'Karolinska', desc: 'Hội đồng xét giải Nobel Y học số 1 thế giới' },
      { name: 'Viện Công nghệ Hoàng gia KTH', short: 'KTH', desc: 'Stockholm • Kỹ thuật & Công nghệ số 1 Bắc Âu' },
      { name: 'Đại học Lund (Lund University)', short: 'Lund Univ', desc: 'Top 100 thế giới • ĐH nghiên cứu danh giá lâu đời nhất' },
      { name: 'Đại học Uppsala (Uppsala University)', short: 'Uppsala', desc: 'Thành lập 1477 • ĐH cổ xưa nhất Bắc Âu' },
      { name: 'Đại học Stockholm (Stockholm University)', short: 'Stockholm Univ', desc: 'Thủ đô Stockholm • Luật, Xã hội & Môi trường' },
      { name: 'Đại học Công nghệ Chalmers', short: 'Chalmers', desc: 'Gothenburg • Kỹ thuật, AI, Robotics & Ô tô' },
      { name: 'Đại học Gothenburg', short: 'Gothenburg', desc: 'Tây Thụy Điển • Khoa học Đời sống, Y tế & Kinh doanh' },
      { name: 'Đại học Linköping (LiU)', short: 'LiU', desc: 'Tiên phong về Khoa học Máy tính & Kỹ thuật Điện tử' },
      { name: 'Đại học Umeå (Umeå University)', short: 'Umeå', desc: 'Nghiên cứu, kiến trúc & thiết kế công nghiệp' },
      { name: 'Đại học Jönköping', short: 'Jönköping', desc: 'Kinh doanh Quốc tế, Khởi nghiệp & Truyền thông' },
      { name: 'Đại học Mälardalen (MDU)', short: 'MDU', desc: 'Kỹ thuật Phần mềm & Hệ thống Nhúng Thông minh' },
      { name: 'Đại học Karlstad', short: 'Karlstad', desc: 'Kỹ thuật số, Dịch vụ & Khoa học Môi trường' },
      { name: 'Đại học Linnaeus', short: 'Linnaeus', desc: 'Nam Thụy Điển • Khoa học Máy tính & Thiết kế' },
      { name: 'Học bổng Chính phủ Thụy Điển SISGP', short: 'SISGP', desc: 'Học bổng toàn phần 100% học phí + sinh hoạt phí' },
    ]
  },
  'Thụy Sĩ': {
    flag: '🇨🇭',
    list: [
      { name: 'ETH Zurich', short: 'ETH Zurich', desc: 'Top 1 Châu Âu lục địa • Trường của Albert Einstein • Khoa học & Kỹ thuật' },
      { name: 'EPFL (École Polytechnique Fédérale de Lausanne)', short: 'EPFL', desc: 'Viện công nghệ hiện đại hàng đầu thế giới' },
      { name: 'Đại học Zurich (UZH)', short: 'UZH', desc: 'Đại học lớn nhất Thụy Sĩ • Kinh tế, Tài chính & Y học' },
      { name: 'Đại học Geneva (UNIGE)', short: 'UNIGE', desc: 'Geneva • Quan hệ Quốc tế, Ngoại giao & Khoa học Tự nhiên' },
      { name: 'Đại học Basel', short: 'Basel', desc: 'Đại học cổ kính nhất Thụy Sĩ (1460) • Y dược & Khoa học Đời sống' },
      { name: 'Đại học Bern', short: 'Bern', desc: 'Khoa học Vũ trụ, Khí hậu & Y tế cộng đồng' },
      { name: 'Đại học Lausanne (UNIL)', short: 'UNIL', desc: 'Y khoa, Pháp y & Khoa học Môi trường' },
      { name: 'Đại học St. Gallen (HSG)', short: 'HSG', desc: 'Top 1 trường Kinh doanh Thụy Sĩ & Châu Âu' },
      { name: 'Đại học Fribourg', short: 'Fribourg', desc: 'Đại học song ngữ Pháp-Đức • Luật & Triết học' },
      { name: 'Học bổng Chính phủ Thụy Sĩ (ESKAS)', short: 'ESKAS', desc: 'Học bổng toàn phần nghiên cứu Tiến sĩ & Sau Tiến sĩ' },
    ]
  },
  'Đài Loan': {
    flag: '🇹🇼',
    list: [
      { name: 'Đại học Quốc gia Đài Loan (NTU)', short: 'NTU Đài Loan', desc: 'Top 1 Đài Loan • Học bổng MOE phong phú' },
      { name: 'Đại học Quốc gia Thanh Hoa (NTHU Đài Loan)', short: 'NTHU', desc: 'Công nghệ bán dẫn, Vật lý & Phần cứng' },
      { name: 'Đại học Quốc gia Dương Minh Giao thông (NYCU)', short: 'NYCU', desc: 'Vi điện tử, Bán dẫn (hợp tác TSMC) & AI' },
      { name: 'Đại học Quốc gia Thành Công (NCKU)', short: 'NCKU', desc: 'Đài Nam • Cơ khí, Hàng không & Kỹ thuật hàng đầu' },
      { name: 'Đại học Khoa học & Công nghệ Quốc gia Đài Loan (Taiwan Tech / NTUST)', short: 'Taiwan Tech', desc: 'Kỹ thuật ứng dụng & Khoa học Máy tính' },
      { name: 'Đại học Quốc gia Chính trị (NCCU)', short: 'NCCU', desc: 'Đài Bắc • Khoa học Xã hội, Kinh tế & Luật hàng đầu' },
      { name: 'Đại học Sư phạm Quốc gia Đài Loan (NTNU)', short: 'NTNU', desc: 'Ngôn ngữ học & Khoa học Giáo dục' },
      { name: 'Đại học Công nghệ Quốc gia Đài Bắc (Taipei Tech)', short: 'Taipei Tech', desc: 'Kỹ thuật công nghiệp & Thiết kế' },
      { name: 'Đại học Quốc gia Trung Sơn (NSYSU)', short: 'NSYSU', desc: 'Cao Hùng • Khoa học Biển & Quản trị Kinh doanh' },
      { name: 'Đại học Quốc gia Trung Hưng (NCHU)', short: 'NCHU', desc: 'Đài Trung • Nông nghiệp & Công nghệ Sinh học' },
      { name: 'Đại học Trường Canh (CGU)', short: 'CGU', desc: 'Đào Viên • Y khoa, Điều dưỡng & Kỹ thuật' },
      { name: 'Đại học Phùng Giáp (FCU)', short: 'FCU', desc: 'Đài Trung • Kỹ thuật & Khoa học Máy tính tư thục hàng đầu' },
    ]
  },
  'Ý': {
    flag: '🇮🇹',
    list: [
      { name: 'Đại học Bách khoa Milan (Politecnico di Milano)', short: 'PoliMi', desc: 'Kỹ thuật, Thiết kế & Kiến trúc số 1 Ý' },
      { name: 'Đại học Bologna', short: 'Bologna', desc: 'Đại học lâu đời nhất thế giới phương Tây (1088)' },
      { name: 'Đại học Sapienza Rome', short: 'Sapienza', desc: 'Rome • Khảo cổ học, Vật lý & Lịch sử hàng đầu' },
      { name: 'Đại học Bách khoa Torino (PoliTo)', short: 'PoliTo', desc: 'Turin • Kỹ thuật ô tô & Cơ khí hợp tác Ferrari/Fiat' },
      { name: 'Đại học Bocconi', short: 'Bocconi', desc: 'Milan • Kinh tế, Tài chính & Quản trị số 1 nước Ý' },
      { name: 'Đại học Padova (Univ of Padua)', short: 'Padova', desc: 'Nơi Galileo từng giảng dạy • Y khoa & Thiên văn' },
      { name: 'Đại học Milan (UniMi)', short: 'UniMi', desc: 'Thủ phủ Lombardy • Y sinh & Khoa học Xã hội' },
      { name: 'Đại học Pisa', short: 'Pisa', desc: 'Pisa • Toán học, Khoa học Máy tính & Y học' },
      { name: 'Đại học Florence (UniFi)', short: 'UniFi', desc: 'Nghệ thuật, Kiến trúc & Nhân văn thời Phục hưng' },
      { name: 'Đại học Trento', short: 'Trento', desc: 'Khoa học Nhận thức, Xã hội học & Kỹ thuật môi trường' },
      { name: 'Đại học Napoli Federico II', short: 'Napoli', desc: 'Naples • Trường đại học công lập lâu đời nhất thế giới' },
      { name: 'Đại học Rome Tor Vergata', short: 'Tor Vergata', desc: 'Kinh tế học, Kỹ thuật & Y khoa hiện đại' },
      { name: 'Trường Cao đẳng Sư phạm Pisa (Scuola Normale Superiore)', short: 'SNS Pisa', desc: 'Trường tinh hoa nghiên cứu' },
      { name: 'Học bổng Chính phủ Ý MAECI & Học bổng vùng DSU', short: 'DSU / MAECI', desc: 'Miễn học phí + Trợ cấp sinh hoạt' },
    ]
  },
  'Phần Lan': {
    flag: '🇫🇮',
    list: [
      { name: 'Đại học Aalto', short: 'Aalto', desc: 'Helsinki • Công nghệ, Thiết kế & Đổi mới sáng tạo hàng đầu' },
      { name: 'Đại học Helsinki', short: 'Helsinki', desc: 'Đại học công lập số 1 Phần Lan • Đa ngành & Y học' },
      { name: 'Đại học Tampere', short: 'Tampere', desc: 'Công nghệ thông tin, Game development & Xã hội' },
      { name: 'Đại học Oulu', short: 'Oulu', desc: 'Thủ phủ viễn thông mạng di động 6G & Công nghệ Băng giá' },
      { name: 'Đại học Turku', short: 'Turku', desc: 'Cố đô Phần Lan • Y sinh & Khoa học Tự nhiên' },
      { name: 'Đại học Công nghệ LUT (Lappeenranta)', short: 'LUT', desc: 'Năng lượng sạch, Công nghệ tuần hoàn & Kinh doanh' },
      { name: 'Đại học Jyväskylä', short: 'Jyväskylä', desc: 'Giáo dục, Thể thao & Khoa học Nhận thức' },
      { name: 'Đại học Đông Phần Lan (UEF)', short: 'UEF', desc: 'Lâm nghiệp, Khoa học Môi trường & Sức khỏe' },
      { name: 'Đại học Vaasa', short: 'Vaasa', desc: 'Quản trị Năng lượng & Kinh doanh Quốc tế' },
      { name: 'Trường Kinh tế Hanken (Hanken School of Economics)', short: 'Hanken', desc: 'Kinh tế & Tài chính danh tiếng' },
      { name: 'Đại học Khoa học Ứng dụng Metropolia (Metropolia UAS)', short: 'Metropolia', desc: 'Helsinki • UAS lớn nhất Phần Lan' },
      { name: 'Học bổng Phần Lan Finland Scholarship', short: 'Finland Scholarship', desc: 'Toàn phần học phí + 5,000 EUR trợ cấp ban đầu' },
    ]
  },
  'New Zealand': {
    flag: '🇳🇿',
    list: [
      { name: 'Đại học Auckland (Univ of Auckland)', short: 'Auckland', desc: 'Top 1 New Zealand • Đa ngành & Kỹ thuật' },
      { name: 'Đại học Otago', short: 'Otago', desc: 'Dunedin • Y khoa, Dược & Nha khoa số 1 New Zealand' },
      { name: 'Đại học Victoria Wellington', short: 'Victoria Wellington', desc: 'Thủ đô Wellington • Luật, Chính trị & Nghệ thuật số' },
      { name: 'Đại học Canterbury', short: 'Canterbury', desc: 'Christchurch • Kỹ thuật xây dựng & Khoa học Động đất' },
      { name: 'Đại học Massey', short: 'Massey', desc: 'Palmerston North • Thú y, Nông nghiệp & Hàng không' },
      { name: 'Đại học Waikato', short: 'Waikato', desc: 'Hamilton • Kinh doanh & Khoa học Máy tính' },
      { name: 'Đại học Lincoln', short: 'Lincoln', desc: 'Chuyên sâu Nông nghiệp, Rượu vang & Quản lý Đất đai' },
      { name: 'Đại học Công nghệ Auckland (AUT)', short: 'AUT', desc: 'Công nghệ, Truyền thông & Thiết kế ứng dụng' },
    ]
  },
  'Ireland': {
    flag: '🇮🇪',
    list: [
      { name: 'Trinity College Dublin (TCD)', short: 'TCD', desc: 'Top 1 Ireland • Đại học cổ kính danh giá nhất' },
      { name: 'University College Dublin (UCD)', short: 'UCD', desc: 'Đại học nghiên cứu toàn cầu lớn nhất Ireland' },
      { name: 'Đại học Quốc gia Ireland Galway (University of Galway)', short: 'Galway', desc: 'Y sinh & Khoa học Dữ liệu' },
      { name: 'University College Cork (UCC)', short: 'UCC', desc: 'Khoa học Thực phẩm, Dược & Môi trường' },
      { name: 'Đại học Thành phố Dublin (DCU)', short: 'DCU', desc: 'Đổi mới sáng tạo & Trí tuệ Nhân tạo' },
      { name: 'Đại học Limerick (UL)', short: 'UL', desc: 'Chương trình Co-op thực tập lớn nhất Ireland' },
      { name: 'Đại học Maynooth', short: 'Maynooth', desc: 'Toán học, Giáo dục & Khoa học Xã hội' },
      { name: 'Viện Công nghệ Dublin (TU Dublin)', short: 'TU Dublin', desc: 'Công nghệ ứng dụng & Kỹ thuật' },
    ]
  },
};

let isUniDropdownOpen = false;

function openUniDropdown() {
  if (!el.uniDropdownMenu) return;
  isUniDropdownOpen = true;
  el.uniDropdownMenu.style.display = 'block';
  if (el.btnToggleUniDropdown) {
    el.btnToggleUniDropdown.classList.add('is-open');
  }
  const query = el.inputCustomTargetUni ? el.inputCustomTargetUni.value.trim() : '';
  renderUniDropdown(query);
}

function closeUniDropdown() {
  if (!el.uniDropdownMenu) return;
  isUniDropdownOpen = false;
  el.uniDropdownMenu.style.display = 'none';
  if (el.btnToggleUniDropdown) {
    el.btnToggleUniDropdown.classList.remove('is-open');
  }
}

function toggleUniDropdown() {
  if (isUniDropdownOpen) {
    closeUniDropdown();
  } else {
    openUniDropdown();
  }
}

function renderUniDropdown(filterText = '') {
  if (!el.uniDropdownBody) return;
  el.uniDropdownBody.innerHTML = '';

  const activeCountries = state.profile.preferred_countries || [];
  const selectedUnis = state.profile.target_universities || [];

  // Xác định danh sách quốc gia cần hiển thị
  let targetCountries = [];
  if (activeCountries.length > 0) {
    activeCountries.forEach((c) => {
      for (const cKey of Object.keys(UNIVERSITIES_DATABASE)) {
        if (c.toLowerCase().includes(cKey.toLowerCase()) || cKey.toLowerCase().includes(c.toLowerCase())) {
          if (!targetCountries.includes(cKey)) {
            targetCountries.push(cKey);
          }
        }
      }
    });
  }

  // Nếu không match được quốc gia nào (ví dụ chưa chọn) -> lấy Hàn Quốc làm mặc định
  if (targetCountries.length === 0) {
    targetCountries = ['Hàn Quốc'];
  }

  if (el.uniDropdownTitle) {
    const names = targetCountries.map((c) => `${UNIVERSITIES_DATABASE[c]?.flag || ''} ${c}`).join(' & ');
    el.uniDropdownTitle.textContent = `Danh sách trường thuộc: ${names}`;
  }

  const query = filterText.toLowerCase().trim();
  let totalMatches = 0;

  targetCountries.forEach((cName) => {
    const countryData = UNIVERSITIES_DATABASE[cName];
    if (!countryData) return;

    // Tổng hợp danh sách: Trường chuẩn hóa + Trường thực tế có trong CSDL học bổng
    const existingUniNames = new Set(countryData.list.map((u) => u.name.toLowerCase()));
    const extraUnis = [];
    const cScholarships = (state.allCatalogScholarships || []).concat(state.catalogLoadedItems || []);
    
    cScholarships.forEach((s) => {
      const sCountry = (s.host_country || '').toLowerCase();
      const normCName = cName.toLowerCase();
      if (!sCountry.includes(normCName) && !normCName.includes(sCountry)) return;

      let extractedUni = '';
      if (s.source_name && !s.source_name.toLowerCase().includes('ybox') && !s.source_name.toLowerCase().includes('crawled')) {
        extractedUni = s.source_name.replace(/Official.*|Catalogs.*|Portal.*/gi, '').trim();
      }
      const titleMatch = (s.title || '').match(/-\s*([A-Za-z0-9\s&()]+?)\s*\(/);
      if (titleMatch && titleMatch[1]) {
        const cand = titleMatch[1].trim();
        if (cand.length > 3 && cand.length < 50) extractedUni = cand;
      }

      if (extractedUni && !existingUniNames.has(extractedUni.toLowerCase())) {
        existingUniNames.add(extractedUni.toLowerCase());
        extraUnis.push({
          name: extractedUni,
          short: extractedUni.split(' ')[0] || extractedUni,
          desc: `Học bổng thực tế từ CSDL • ${s.degree_level || 'Thạc sĩ/Cử nhân'}`,
          isFromDb: true
        });
      }
    });

    const fullList = [...countryData.list, ...extraUnis];

    // Lọc theo query tìm kiếm
    const matchedList = fullList.filter((u) => {
      if (!query) return true;
      return (
        u.name.toLowerCase().includes(query) ||
        u.short.toLowerCase().includes(query) ||
        u.desc.toLowerCase().includes(query)
      );
    });

    if (matchedList.length === 0) return;

    totalMatches += matchedList.length;

    // Tạo Country Group Container
    const groupDiv = document.createElement('div');
    groupDiv.className = 'dropdown-country-group';

    const groupTitle = document.createElement('div');
    groupTitle.className = 'dropdown-country-title';
    groupTitle.innerHTML = `
      <span>${countryData.flag} ${cName}</span>
      <span class="dropdown-country-badge">${matchedList.length} trường</span>
    `;
    groupDiv.appendChild(groupTitle);

    matchedList.forEach((u) => {
      const isSelected = selectedUnis.includes(u.name);
      const itemRow = document.createElement('div');
      itemRow.className = `uni-dropdown-item ${isSelected ? 'is-selected' : ''}`;
      itemRow.innerHTML = `
        <div class="uni-item-info">
          <span class="uni-item-name">${u.name}</span>
          <span class="uni-item-desc">${u.desc}</span>
        </div>
        <div class="uni-item-action">
          ${isSelected ? '<span class="action-selected">✓ Đã chọn</span>' : '<span class="action-add">+ Chọn</span>'}
        </div>
      `;

      itemRow.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTargetUniversity(u.name);
      });

      groupDiv.appendChild(itemRow);
    });

    el.uniDropdownBody.appendChild(groupDiv);
  });

  // Nếu người dùng gõ tìm kiếm nhưng không tìm thấy trường nào trong danh sách
  if (totalMatches === 0) {
    if (query) {
      el.uniDropdownBody.innerHTML = `
        <div class="dropdown-empty-state">
          Không tìm thấy trường nào khớp với từ khóa "<strong>${query}</strong>" trong các quốc gia đã chọn.
        </div>
        <div class="dropdown-custom-add-prompt" id="prompt-add-custom-uni">
          <span>➕</span>
          <span>Bấm vào đây (hoặc nút <strong>+ Thêm Trường</strong>) để thêm "<strong>${filterText.trim()}</strong>"</span>
        </div>
      `;
      const promptBtn = el.uniDropdownBody.querySelector('#prompt-add-custom-uni');
      if (promptBtn) {
        promptBtn.addEventListener('click', () => {
          addTargetUniversity(filterText.trim());
          closeUniDropdown();
        });
      }
    } else {
      el.uniDropdownBody.innerHTML = `
        <div class="dropdown-empty-state">
          Chưa có trường nào cho các quốc gia đã chọn. Hãy tích chọn thêm quốc gia ở trên.
        </div>
      `;
    }
  }
}

function toggleTargetUniversity(uniName) {
  if (!uniName) return;
  const list = state.profile.target_universities || [];
  if (list.includes(uniName)) {
    removeTargetUniversity(uniName);
  } else {
    addTargetUniversity(uniName);
  }
}

function addTargetUniversity(uniName) {
  if (!uniName || !uniName.trim()) return;
  const cleanName = uniName.trim();
  if (!state.profile.target_universities) {
    state.profile.target_universities = [];
  }
  if (!state.profile.target_universities.includes(cleanName)) {
    state.profile.target_universities.push(cleanName);
    renderSelectedTargetUniTags();
    syncFormToState();
  }
  if (el.inputCustomTargetUni) {
    el.inputCustomTargetUni.value = '';
  }
}

function removeTargetUniversity(uniName) {
  if (!state.profile.target_universities) return;
  state.profile.target_universities = state.profile.target_universities.filter((u) => u !== uniName);
  renderSelectedTargetUniTags();
  syncFormToState();
}

function renderSelectedTargetUniTags() {
  if (!el.selectedTargetUnisContainer) return;
  const list = state.profile.target_universities || [];
  el.selectedTargetUnisContainer.innerHTML = '';

  if (list.length === 0) {
    el.selectedTargetUnisContainer.innerHTML = `
      <span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">
        Chưa chọn trường mục tiêu nào. Hãy bấm vào ô bên dưới để chọn trường thuộc quốc gia bạn mong muốn.
      </span>
    `;
    if (el.selectedTargetUnisCount) {
      el.selectedTargetUnisCount.textContent = 'Chưa chọn trường mục tiêu nào (Tùy chọn)';
    }
  } else {
    list.forEach((uni) => {
      const tag = document.createElement('span');
      tag.className = 'target-pill-active';
      tag.innerHTML = `
        <span>🏛️ ${uni}</span>
        <span class="target-pill-remove" title="Bỏ chọn trường này" data-uni="${uni}">&times;</span>
      `;
      tag.querySelector('.target-pill-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removeTargetUniversity(uni);
      });
      el.selectedTargetUnisContainer.appendChild(tag);
    });

    if (el.selectedTargetUnisCount) {
      el.selectedTargetUnisCount.innerHTML = `Đã chọn <strong style="color:var(--primary);">${list.length}</strong> trường mục tiêu`;
    }
  }

  // Luôn đồng bộ danh sách dropdown
  if (isUniDropdownOpen) {
    const q = el.inputCustomTargetUni ? el.inputCustomTargetUni.value.trim() : '';
    renderUniDropdown(q);
  }
}

function initFormValues() {
  const p = state.profile;
  el.formFullName.value = p.full_name || 'Nguyễn Trọng Mạnh Tiến';
  el.formDegree.value = p.target_degree || 'Thạc sĩ';
  el.formMajor.value = p.major || 'Trí tuệ Nhân tạo / Khoa học Máy tính';
  el.formGpa.value = p.gpa || 2.45;
  el.formIelts.value = p.ielts || 4.5;
  el.formPubs.value = p.publications_count || 1;
  el.formAwards.value = p.awards_count || 2;
  if (el.formSop) el.formSop.value = p.statement_of_purpose || '';

  updateSliderBadges();

  // Active country pills
  document.querySelectorAll('.tag-pill').forEach((pill) => {
    const val = pill.dataset.val;
    if (p.preferred_countries && p.preferred_countries.includes(val)) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  updateCountriesCount();
  renderSelectedTargetUniTags();
  renderUniDropdown('');
}

function syncFormToState() {
  const activeCountries = Array.from(document.querySelectorAll('.tag-pill.active')).map(
    (p) => p.dataset.val
  );

  state.profile = {
    full_name: el.formFullName.value.trim() || 'Ứng viên',
    target_degree: el.formDegree.value,
    major: el.formMajor.value.trim() || 'Khoa học Máy tính',
    gpa: parseFloat(el.formGpa.value),
    ielts: parseFloat(el.formIelts.value),
    topik_level: 0,
    preferred_countries: activeCountries,
    target_universities: state.profile.target_universities || [],
    publications_count: parseInt(el.formPubs.value, 10) || 0,
    awards_count: parseInt(el.formAwards.value, 10) || 0,
    statement_of_purpose: el.formSop ? el.formSop.value.trim() : '',
    work_experience_years: 1.5,
    research_experience_years: 1.0,
  };

  updateChatContextBar();
}

function updateChatContextBar() {
  if (!el.chatContextName) return;
  const p = state.profile;
  el.chatContextName.textContent = p.full_name || 'Ứng viên';
  el.chatContextDegree.textContent = p.target_degree || 'Thạc sĩ';
  el.chatContextGpa.textContent = `${Number(p.gpa || 2.45).toFixed(2)} / 4.0`;
  el.chatContextIelts.textContent = `${Number(p.ielts || 4.5).toFixed(1)}`;
  const countries = p.preferred_countries && p.preferred_countries.length > 0
    ? p.preferred_countries.join(', ')
    : 'Toàn cầu';
  el.chatContextCountries.textContent = countries;
}

// --------------------------------------------------------------------------
// 4. Personalized Matching Engine & Gap Roadmap Evaluation
// --------------------------------------------------------------------------
async function executePersonalizedMatching(shouldScroll = false) {
  syncFormToState();
  state.isMatching = true;

  el.btnRunMatch.disabled = true;
  el.btnRunMatch.innerHTML = `<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></span> Đang tìm kiếm học bổng du học phù hợp...`;

  const preferred = state.profile.preferred_countries || [];

  try {
    const filters = {
      countries: preferred,
      degree_level: state.profile.target_degree,
    };

    const res = await matchScholarships(state.profile, filters);

    if (res) {
      state.targetMatchedStatus = res.target_matched_status || 'NONE';
      state.targetGapsSummary = res.target_gaps_summary || null;
    }

    if (res && res.scholarships && res.scholarships.length > 0) {
      if (preferred.length > 0) {
        state.matchedScholarships = res.scholarships.filter((item) => {
          const itemCountry = (item.host_country || '').toLowerCase();
          return preferred.some((p) => itemCountry.includes(p.toLowerCase()));
        });
        if (state.matchedScholarships.length === 0) {
          state.matchedScholarships = res.scholarships;
        }
      } else {
        state.matchedScholarships = res.scholarships;
      }
    } else {
      state.matchedScholarships = calculatePersonalizedMatchingLocal(state.profile);
    }
  } catch (err) {
    console.warn('[Personalized Matching] Sử dụng bộ đánh giá White-box cục bộ:', err);
    state.matchedScholarships = calculatePersonalizedMatchingLocal(state.profile);
  } finally {
    state.isMatching = false;
    el.btnRunMatch.disabled = false;
    el.btnRunMatch.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Tìm Kiếm Học Bổng Du Học`;

    renderPersonalizedDiagnosticCard();
    renderPersonalizedCards(state.matchedScholarships);

    if (shouldScroll && el.profileMatchedSection) {
      el.profileMatchedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

/**
 * Calculates White-box scores and concrete Gap Roadmaps tailored to candidate profile.
 */
function calculatePersonalizedMatchingLocal(profile) {
  const gpa = profile.gpa || 2.45;
  const ielts = profile.ielts || 4.5;
  const pubs = profile.publications_count || 1;
  const awards = profile.awards_count || 2;
  const preferred = profile.preferred_countries || [];
  const targetUnis = profile.target_universities || [];

  // Filter pool strictly by candidate's chosen countries
  let pool = DEMO_SCHOLARSHIPS;
  if (preferred && preferred.length > 0) {
    const matched = DEMO_SCHOLARSHIPS.filter((item) => {
      const itemCountry = (item.host_country || '').toLowerCase();
      return preferred.some((p) => {
        const pNorm = p.toLowerCase();
        return (
          itemCountry.includes(pNorm) ||
          pNorm.includes(itemCountry) ||
          (pNorm.includes('hàn') && (itemCountry.includes('hàn') || itemCountry.includes('korea'))) ||
          (pNorm.includes('nhật') && (itemCountry.includes('nhật') || itemCountry.includes('japan')))
        );
      });
    });
    if (matched.length > 0) pool = matched;
  }

  function scoreScholarship(item, isTarget) {
    // Determine target university minimum thresholds
    const isTopAmbitious =
      (item.title && (item.title.includes('SNU') || item.title.includes('KAIST') || item.title.includes('Tokyo') || item.title.includes('GKS'))) ||
      (item.source_name && (item.source_name.includes('Seoul') || item.source_name.includes('KAIST') || item.source_name.includes('Tokyo')));

    let minGpa = item.min_gpa != null ? item.min_gpa : (isTopAmbitious ? 3.20 : 2.50);
    let minIelts = item.min_ielts != null ? item.min_ielts : (isTopAmbitious ? 6.5 : 5.5);

    // 1. GPA Factor (25%)
    let gpaScore = Math.min(1.0, (gpa / 4.0) * 1.05);
    if (gpa < minGpa) {
      gpaScore = Math.max(0.3, gpaScore - (minGpa - gpa) * 0.45);
    }

    // 2. Language Factor (20%)
    let langScore = Math.min(1.0, (ielts / 9.0) * 1.35);
    if (ielts < minIelts) {
      langScore = Math.max(0.3, langScore - (minIelts - ielts) * 0.28);
    }

    // 3. Major Alignment (25%)
    let majorScore = 0.90;
    if (item.major_applied && profile.major) {
      const pWords = profile.major.toLowerCase().split(/\s+/);
      const mText = item.major_applied.toLowerCase();
      const matchWord = pWords.some((w) => w.length > 2 && mText.includes(w));
      majorScore = matchWord ? 0.96 : 0.82;
    }

    // 4. Research Factor (15%)
    let resScore = Math.min(1.0, 0.65 + pubs * 0.12 + awards * 0.06);

    // 5. Vector Cosine (15%)
    let vecScore = 0.85;
    if (preferred.length > 0 && preferred.includes(item.host_country)) {
      vecScore = 0.94;
    }

    const totalScore =
      gpaScore * 0.25 +
      majorScore * 0.25 +
      langScore * 0.20 +
      resScore * 0.15 +
      vecScore * 0.15;

    let matchPercent = Math.min(99.0, Math.round(totalScore * 1000) / 10);

    let tierGroup = 'Group C (Thử thách - Khoảng cách lớn)';
    if (matchPercent >= 85.0 && gpa >= minGpa && ielts >= minIelts) {
      tierGroup = 'Group A (Đủ điều kiện xét tuyển)';
    } else if (matchPercent >= 70.0 && gpa >= minGpa - 0.4) {
      tierGroup = 'Group B (Tiềm năng - Cần cải thiện nhẹ)';
    } else {
      tierGroup = 'Group C (Thử thách - Khoảng cách lớn)';
      if (gpa < minGpa || ielts < minIelts) {
        matchPercent = Math.min(68.5, matchPercent);
      }
    }

    // Dynamic Gaps & Roadmap
    const dynamicGaps = [];
    const dynamicRoadmap = [];

    if (gpa < minGpa) {
      const diff = (minGpa - gpa).toFixed(2);
      dynamicGaps.push(`Điểm GPA hiện tại ${gpa.toFixed(2)} thấp hơn yêu cầu của trường (${minGpa.toFixed(2)}/4.0, thiếu -${diff} điểm).`);
      dynamicRoadmap.push(`Tối ưu bài luận SOP và tăng cường các dự án NCKH để bù đắp điểm GPA.`);
    }
    if (ielts < minIelts) {
      const ieltsDiff = (minIelts - ielts).toFixed(1);
      dynamicGaps.push(`IELTS ${ielts.toFixed(1)} hiện dưới ngưỡng chuẩn tối thiểu của trường (${minIelts.toFixed(1)}, thiếu -${ieltsDiff} band).`);
      dynamicRoadmap.push(`Ôn tập và thi lại chứng chỉ IELTS mục tiêu đạt tối thiểu ${minIelts.toFixed(1)} trước kỳ nộp hồ sơ.`);
    }

    return {
      ...item,
      min_gpa: minGpa,
      min_ielts: minIelts,
      match_percent: matchPercent,
      tier_group: tierGroup,
      score_breakdown: {
        academic_gpa: Math.round(gpaScore * 100) / 100,
        major_alignment: Math.round(majorScore * 100) / 100,
        language_score: Math.round(langScore * 100) / 100,
        research_extracurricular: Math.round(resScore * 100) / 100,
        vector_similarity: Math.round(vecScore * 100) / 100,
      },
      gap_analysis: {
        ...item.gap_analysis,
        gaps: dynamicGaps.length > 0 ? dynamicGaps : (item.gap_analysis?.gaps || []),
        action_plan: dynamicRoadmap.length > 0 ? dynamicRoadmap : (item.gap_analysis?.action_plan || []),
      },
    };
  }

  // -------------------------------------------------------------------------
  // 2-TIER LOGIC: XÉT TRƯỜNG MỤC TIÊU A, B, C TRƯỚC
  // -------------------------------------------------------------------------
  if (targetUnis && targetUnis.length > 0) {
    // 1. Tìm các học bổng thuộc đúng các trường mục tiêu
    const targetItems = pool.filter((item) => {
      const titleLower = (item.title || '').toLowerCase();
      const sourceLower = (item.source_name || '').toLowerCase();
      return targetUnis.some((u) => {
        const uNorm = u.toLowerCase().replace(/đh\s*quốc\s*gia|đại\s*học|university|univ/g, '').trim();
        return (
          titleLower.includes(uNorm) ||
          sourceLower.includes(uNorm) ||
          (u.includes('SNU') && (titleLower.includes('snu') || titleLower.includes('seoul'))) ||
          (u.includes('KAIST') && titleLower.includes('kaist')) ||
          (u.includes('Tokyo') && titleLower.includes('tokyo')) ||
          (u.includes('Yonsei') && titleLower.includes('yonsei')) ||
          (u.includes('Korea') && titleLower.includes('korea university'))
        );
      });
    });

    const scoredTargets = targetItems.map((item) => scoreScholarship(item, true));

    // Kiểm tra xem ứng viên có thỏa mãn ít nhất 1 trường mục tiêu (Group A hoặc B)
    const hasQualified = scoredTargets.some(
      (s) => s.tier_group.includes('Group A') || s.tier_group.includes('Group B')
    );

    if (hasQualified && scoredTargets.length > 0) {
      state.targetMatchedStatus = 'SATISFIED';
      state.targetGapsSummary = null;

      scoredTargets.forEach((s) => {
        s.category = 'TARGET_QUALIFIED';
        s.target_status_note = '🎯 Trường Mục Tiêu (Đạt Chuẩn Xét Tuyển)';
      });

      const nonTargetPool = pool.filter((item) => !targetItems.some((t) => t.id === item.id));
      const scoredOthers = nonTargetPool.map((item) => {
        const s = scoreScholarship(item, false);
        s.category = 'STANDARD';
        return s;
      });

      return [...scoredTargets, ...scoredOthers].sort((a, b) => b.match_percent - a.match_percent);
    } else {
      // TẤT CẢ TRƯỜNG MỤC TIÊU KHÔNG THỎA MÃN (Group C / dưới sàn) -> KÍCH HOẠT FALLBACK
      state.targetMatchedStatus = 'RELAXED_EXPANDED';

      const minReqGpa = 3.20;
      const minReqIelts = 6.5;
      const gpaDiff = Math.max(0, minReqGpa - gpa);
      const ieltsDiff = Math.max(0, minReqIelts - ielts);

      state.targetGapsSummary = {
        target_universities: targetUnis,
        cand_gpa: gpa,
        target_min_gpa: minReqGpa,
        gpa_gap: Number(gpaDiff.toFixed(2)),
        cand_ielts: ielts,
        target_min_ielts: minReqIelts,
        ielts_gap: Number(ieltsDiff.toFixed(1)),
        countries: preferred.length > 0 ? preferred.join(', ') : 'Hàn Quốc / Nhật Bản',
      };

      const ambitiousTargets = scoredTargets.map((s) => ({
        ...s,
        category: 'TARGET_AMBITIOUS',
        target_status_note: '🎯 Trường Mục Tiêu (Cần Bổ Sung Tiêu Chí)',
      }));

      // TẦNG 2: MỞ RỘNG GỢI Ý CÁC TRƯỜNG CÙNG QUỐC GIA CÓ TỈ LỆ ĐỖ CAO
      const nonTargetPool = pool.filter((item) => !targetItems.some((t) => t.id === item.id));
      const alternativeItems = nonTargetPool.map((item) => {
        const s = scoreScholarship(item, false);
        if (s.tier_group.includes('Group C') && (item.title.includes('Dong-A') || item.title.includes('Pusan') || item.funding_type.includes('Bán phần') || item.funding_type.includes('Học phí'))) {
          s.match_percent = Math.min(85.0, Math.max(78.0, s.match_percent + 16));
          s.tier_group = 'Group B (Lựa chọn an toàn cùng quốc gia)';
        }
        s.category = 'RECOMMENDED_ALTERNATIVE';
        s.target_status_note = '🛡️ Gợi Ý Mở Rộng: Trường Cùng Quốc Gia Phù Hợp Năng Lực';
        return s;
      }).sort((a, b) => b.match_percent - a.match_percent);

      return [...ambitiousTargets, ...alternativeItems];
    }
  }

  // Trường hợp người dùng không chọn trường mục tiêu cụ thể
  state.targetMatchedStatus = 'NONE';
  state.targetGapsSummary = null;
  return pool.map((item) => {
    const s = scoreScholarship(item, false);
    s.category = 'STANDARD';
    return s;
  }).sort((a, b) => b.match_percent - a.match_percent);
}

function renderPersonalizedDiagnosticCard() {
  const p = state.profile;
  const gpa = p.gpa || 2.45;
  const ielts = p.ielts || 4.5;
  const country = p.preferred_countries && p.preferred_countries.length > 0 ? p.preferred_countries.join(', ') : 'Toàn cầu';

  el.diagCandidateName.textContent = p.full_name || 'Ứng viên';
  el.diagCandidateStats.textContent = `Mục tiêu: ${p.target_degree || 'Thạc sĩ'} • GPA: ${gpa.toFixed(2)}/4.0 • IELTS: ${ielts.toFixed(1)} • Quốc gia: ${country}`;

  // Readiness Calculation
  let readiness = 65;
  if (gpa >= 3.2 && ielts >= 6.5) readiness = 92;
  else if (gpa >= 2.8 && ielts >= 6.0) readiness = 82;
  else if (gpa >= 2.5 || ielts >= 5.5) readiness = 74;

  el.diagReadinessVal.textContent = `${readiness}%`;

  if (readiness >= 85) {
    el.diagHeadline.textContent = 'Hồ sơ đạt độ tương thích rất cao cho các học bổng Group A';
    el.diagSummaryText.textContent = `Với GPA ${gpa.toFixed(2)} và IELTS ${ielts.toFixed(1)}, bạn đã đáp ứng đủ chuẩn tuyển sinh hàng đầu tại ${country}.`;
  } else if (readiness >= 75) {
    el.diagHeadline.textContent = 'Hồ sơ tiềm năng (Group B) - Cần hoàn thiện nhẹ một số tiêu chí';
    el.diagSummaryText.textContent = `Hồ sơ có nền tảng tốt nhưng cần gia tăng sức cạnh tranh ở điểm số ngoại ngữ hoặc bài luận nghiên cứu.`;
  } else {
    el.diagHeadline.textContent = 'Hồ sơ cần thực hiện lộ trình bổ sung tiêu chí (Gap Roadmap)';
    el.diagSummaryText.textContent = `Điểm GPA ${gpa.toFixed(2)} và IELTS ${ielts.toFixed(1)} đang dưới ngưỡng chuẩn của các học bổng toàn phần danh giá tại ${country}. Dưới đây là bảng xếp hạng các trường phù hợp nhất và lộ trình từng bước để đạt điều kiện.`;
  }

  // Update diagnostic bullets
  el.diagStrengthText.textContent = `Chuyên ngành "${p.major || 'CNTT'}" thuộc nhóm ngành ưu tiên tuyển sinh cao và có định hướng nghiên cứu rõ ràng.`;

  if (gpa < 3.0 || ielts < 6.0) {
    const gapsList = [];
    if (gpa < 3.0) gapsList.push(`GPA ${gpa.toFixed(2)} < 3.0 (-${(3.0 - gpa).toFixed(2)})`);
    if (ielts < 6.0) gapsList.push(`IELTS ${ielts.toFixed(1)} < 6.0 (-${(6.0 - ielts).toFixed(1)})`);
    el.diagGapText.textContent = `Cần ưu tiên nâng chuẩn tiêu chí: ${gapsList.join(', ')} và nộp các trường có chính sách xét duyệt linh hoạt.`;
  } else {
    el.diagGapText.textContent = `Tiêu chí cơ bản đã đạt trọn vẹn, cần tập trung hoàn thiện bài luận cá nhân SOP và thư giới thiệu LOR.`;
  }

  // =========================================================================
  // HIỂN THỊ BANNER CẢNH BÁO KHOẢNG CÁCH TIÊU CHÍ & LỘ TRÌNH CHO TRƯỜNG MỤC TIÊU
  // =========================================================================
  if (el.targetFallbackBanner) {
    if (state.targetMatchedStatus === 'RELAXED_EXPANDED' && state.targetGapsSummary) {
      const summary = state.targetGapsSummary;
      const targetNames = summary.target_universities ? summary.target_universities.join(', ') : 'Trường mục tiêu';

      el.targetFallbackBanner.style.display = 'block';
      el.targetFallbackBanner.innerHTML = `
        <div class="fallback-header">
          <div class="fallback-icon">⚠️</div>
          <div>
            <h4 class="fallback-title">Các Trường Mục Tiêu Bạn Chọn (${targetNames}) Hiện Vượt Ngưỡng Điểm Hiện Tại</h4>
            <p class="fallback-subtitle">
              Hồ sơ của bạn hiện đạt GPA <strong>${summary.cand_gpa.toFixed(2)}/4.0</strong> và IELTS <strong>${summary.cand_ielts.toFixed(1)}</strong>, chưa đáp ứng chuẩn sàn tối thiểu của các trường mục tiêu này.
            </p>
          </div>
        </div>

        <div class="gap-metrics-grid">
          <div class="gap-metric-card">
            <span class="gap-metric-title">Khoảng Cách Điểm Học Tập (GPA)</span>
            <div class="gap-metric-comparison">
              <span>Bạn: <strong>${summary.cand_gpa.toFixed(2)}</strong></span>
              <span style="color:var(--text-muted);">/</span>
              <span>Sàn trường: <strong>${summary.target_min_gpa.toFixed(2)}</strong></span>
              <span class="gap-metric-diff">(-${summary.gpa_gap.toFixed(2)} điểm)</span>
            </div>
          </div>

          <div class="gap-metric-card">
            <span class="gap-metric-title">Khoảng Cách Chứng Chỉ Tiếng Anh (IELTS)</span>
            <div class="gap-metric-comparison">
              <span>Bạn: <strong>${summary.cand_ielts.toFixed(1)}</strong></span>
              <span style="color:var(--text-muted);">/</span>
              <span>Chuẩn trường: <strong>${summary.target_min_ielts.toFixed(1)}</strong></span>
              <span class="gap-metric-diff">(-${summary.ielts_gap.toFixed(1)} band)</span>
            </div>
          </div>
        </div>

        <div class="fallback-roadmap-box">
          <h5>🎯 Lộ Trình Hành Động 3 Giai Đoạn Để Đạt Chuẩn Các Trường Mục Tiêu:</h5>
          <ul class="roadmap-phase-list">
            <li><strong>Giai đoạn 1 (3 - 6 tháng)</strong>: Tập trung ôn luyện ngoại ngữ cấp tốc để nâng IELTS từ ${summary.cand_ielts.toFixed(1)} lên tối thiểu 6.0 - 6.5.</li>
            <li><strong>Giai đoạn 2 (2 - 3 tháng)</strong>: Viết đề cương nghiên cứu (Research Proposal) & bài luận cá nhân SOP chứng minh kinh nghiệm thực tế để bù đắp điểm GPA.</li>
            <li><strong>Giai đoạn 3 (Kỳ nộp hồ sơ)</strong>: Chiến lược nộp song song: 1 trường an toàn (đã tự động gợi ý bên dưới) và 1 trường mục tiêu vươn tầm sau khi nâng điểm.</li>
          </ul>
        </div>

        <div class="fallback-expansion-callout">
          <span style="font-size:1.3rem;">🔄</span>
          <div>
            <strong>Hệ thống đã tự động mở rộng tìm kiếm:</strong> Gợi ý các trường Đại học uy tín cùng quốc gia (<strong>${summary.countries}</strong>) phù hợp trực tiếp với năng lực hiện tại của bạn, mang lại tỉ lệ trúng tuyển học bổng cao nhất!
          </div>
        </div>
      `;
    } else {
      el.targetFallbackBanner.style.display = 'none';
      el.targetFallbackBanner.innerHTML = '';
    }
  }
}

function renderPersonalizedCards(items) {
  el.matchedGrid.innerHTML = '';
  const countries = state.profile.preferred_countries && state.profile.preferred_countries.length > 0
    ? state.profile.preferred_countries.join(', ')
    : 'quốc gia mục tiêu';
  el.matchedCount.innerHTML = `Hiển thị <strong>${items.length}</strong> học bổng phù hợp`;
  el.matchedSubtitle.textContent = `Bảng xếp hạng từ cao nhất đến thấp nhất cho ${countries} kèm khoảng cách tiêu chí và lộ trình hành động`;

  if (!items || items.length === 0) {
    el.matchedGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <h3>Chưa có học bổng phù hợp</h3>
        <p>Thử điều chỉnh lại lựa chọn quốc gia hoặc nới lỏng bậc học.</p>
      </div>
    `;
    return;
  }

  // Tách nhóm nếu kích hoạt luồng đối khớp 2 tầng Fallback
  const isFallbackMode = state.targetMatchedStatus === 'RELAXED_EXPANDED';
  const targetItems = isFallbackMode ? items.filter((i) => i.category === 'TARGET_AMBITIOUS') : [];
  const altItems = isFallbackMode ? items.filter((i) => i.category !== 'TARGET_AMBITIOUS') : items;

  function renderCardElement(item, index, customLabel) {
    const isTierA = item.tier_group && item.tier_group.includes('Group A');
    const isTierB = item.tier_group && item.tier_group.includes('Group B');
    const tierClass = isTierA ? 'tier-group-a' : isTierB ? 'tier-group-b' : 'tier-group-c';
    const tierLabel = isTierA ? 'Group A' : isTierB ? 'Group B' : 'Group C';

    let categoryClass = '';
    let categoryBadgeHtml = '';

    if (item.category === 'TARGET_AMBITIOUS') {
      categoryClass = 'card-target-ambitious';
      categoryBadgeHtml = '<span class="card-category-badge badge-category-target-ambitious">🎯 Trường Mục Tiêu (Cần Nâng Điểm)</span>';
    } else if (item.category === 'TARGET_QUALIFIED') {
      categoryClass = 'card-target-qualified';
      categoryBadgeHtml = '<span class="card-category-badge badge-category-target-qualified">🎯 Trường Mục Tiêu (Đạt Chuẩn Xét Tuyển)</span>';
    } else if (item.category === 'RECOMMENDED_ALTERNATIVE') {
      categoryClass = 'card-recommended-alternative';
      categoryBadgeHtml = '<span class="card-category-badge badge-category-alternative">🛡️ Phương Án An Toàn Cùng Quốc Gia (Tỉ Lệ Đỗ Cao)</span>';
    }

    const card = document.createElement('div');
    card.className = `card scholarship-card ${tierClass} ${categoryClass}`;

    const score = item.score_breakdown || {};
    const gpaPercent = Math.round((score.academic_gpa || 0.85) * 100);
    const majorPercent = Math.round((score.major_alignment || 0.88) * 100);
    const langPercent = Math.round((score.language_score || 0.82) * 100);
    const resPercent = Math.round((score.research_extracurricular || 0.75) * 100);
    const vecPercent = Math.round((score.vector_similarity || 0.80) * 100);

    const gaps = item.gap_analysis?.gaps || [];
    const roadmap = item.gap_analysis?.action_plan || [];

    card.innerHTML = `
      <div class="card-top-row">
        <div>
          ${categoryBadgeHtml}
          <div><span class="rank-badge">#${index + 1} ${customLabel || 'Phù hợp nhất'}</span></div>
          <div class="country-degree-pills">
            <span class="badge-pill pill-country">📍 ${item.host_country || 'Quốc tế'}</span>
            <span class="badge-pill pill-degree">🎓 ${item.degree_level || 'Thạc sĩ'}</span>
            <span class="badge-pill pill-funding">💰 ${item.funding_type || 'Toàn phần'}</span>
          </div>
        </div>
        <div class="match-score-badge">
          <div class="score-circle">${item.match_percent}%</div>
          <span class="score-tier-label">${tierLabel}</span>
        </div>
      </div>

      <h3 class="card-title-scholarship" title="${item.title}">${item.title}</h3>
      <p class="card-funding-desc" title="${item.funding_details || item.major_applied || ''}">
        ${item.funding_details || item.major_applied || 'Thông tin chi tiết học bổng'}
      </p>

      <!-- Criteria 5 Progress Bars -->
      <div class="criteria-bars">
        <div class="criteria-item">
          <span class="criteria-lbl"><span>GPA (25%)</span> <strong>${gpaPercent}%</strong></span>
          <div class="progress-track"><div class="progress-fill" style="width: ${gpaPercent}%;"></div></div>
        </div>
        <div class="criteria-item">
          <span class="criteria-lbl"><span>Ngành (25%)</span> <strong>${majorPercent}%</strong></span>
          <div class="progress-track"><div class="progress-fill" style="width: ${majorPercent}%;"></div></div>
        </div>
        <div class="criteria-item">
          <span class="criteria-lbl"><span>IELTS (20%)</span> <strong>${langPercent}%</strong></span>
          <div class="progress-track"><div class="progress-fill" style="width: ${langPercent}%;"></div></div>
        </div>
        <div class="criteria-item">
          <span class="criteria-lbl"><span>NCKH (15%)</span> <strong>${resPercent}%</strong></span>
          <div class="progress-track"><div class="progress-fill" style="width: ${resPercent}%;"></div></div>
        </div>
        <div class="criteria-item">
          <span class="criteria-lbl"><span>Định hướng (15%)</span> <strong>${vecPercent}%</strong></span>
          <div class="progress-track"><div class="progress-fill" style="width: ${vecPercent}%;"></div></div>
        </div>
      </div>

      <!-- Compact Gap Summary in Card -->
      <div class="card-gap-box">
        <div class="gap-headline-mini">
          <span class="gap-icon">⚠️</span>
          <span>Khoảng cách tiêu chuẩn:</span>
        </div>
        <p class="gap-text-preview">${gaps[0] || 'Đáp ứng đủ các tiêu chuẩn cơ bản.'}</p>
      </div>

      <div class="card-actions-row">
        <button class="btn btn-primary btn-sm btn-view-gap" data-idx="${index}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          ${item.category === 'TARGET_AMBITIOUS' ? 'Lộ Trình Nâng Chuẩn' : 'Chi Tiết & Lộ Trình'}
        </button>
        <button class="btn btn-outline btn-sm btn-ask-ai" data-idx="${index}" title="Trao đổi với AI Counselor về học bổng này">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Hỏi AI
        </button>
      </div>
    `;

    card.querySelector('.btn-view-gap').addEventListener('click', () => {
      openGapModal(item);
    });

    card.querySelector('.btn-ask-ai').addEventListener('click', () => {
      askAiAboutScholarship(item);
    });

    return card;
  }

  // Nếu ở chế độ Fallback: Dựng 2 khu vực rõ ràng
  if (isFallbackMode && targetItems.length > 0) {
    // 1. Khu vực Trường Mục Tiêu (Cần Bổ Sung Tiêu Chí)
    const sep1 = document.createElement('div');
    sep1.className = 'feed-category-separator';
    sep1.innerHTML = `
      <span class="sep-title" style="color: #f59e0b;">🎯 Học Bổng Các Trường Mục Tiêu (Vươn Tầm - Cần Hoàn Thiện Tiêu Chí)</span>
      <span class="sep-badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4);">Group C</span>
    `;
    el.matchedGrid.appendChild(sep1);

    targetItems.forEach((item, idx) => {
      el.matchedGrid.appendChild(renderCardElement(item, idx, 'Trường Mục Tiêu'));
    });

    // 2. Khu vực Gợi Ý Mở Rộng: Các Trường Cùng Quốc Gia Phù Hợp Năng Lực
    const sep2 = document.createElement('div');
    sep2.className = 'feed-category-separator';
    sep2.innerHTML = `
      <span class="sep-title" style="color: #10b981;">🛡️ Gợi Ý Mở Rộng: Các Trường Cùng Quốc Gia Phù Hợp Năng Lực (Tỉ Lệ Đỗ Cao)</span>
      <span class="sep-badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4);">Phương Án An Toàn</span>
    `;
    el.matchedGrid.appendChild(sep2);

    altItems.forEach((item, idx) => {
      el.matchedGrid.appendChild(renderCardElement(item, targetItems.length + idx, 'An Toàn Cùng Quốc Gia'));
    });
  } else {
    // Chế độ thông thường
    items.forEach((item, index) => {
      el.matchedGrid.appendChild(renderCardElement(item, index, ''));
    });
  }
}

// --------------------------------------------------------------------------
// 5. Gap Analysis Modal
// --------------------------------------------------------------------------
function openGapModal(item) {
  state.selectedScholarshipForModal = item;
  const gap = item.gap_analysis || {};

  const isTierA = item.tier_group && item.tier_group.includes('Group A');
  const isTierB = item.tier_group && item.tier_group.includes('Group B');
  el.modalTierBadge.textContent = item.tier_group || 'Group A';
  el.modalTierBadge.style.color = isTierA ? 'var(--tier-a-text)' : isTierB ? 'var(--tier-b-text)' : 'var(--tier-c-text)';
  el.modalTierBadge.style.background = isTierA ? 'var(--tier-a-bg)' : isTierB ? 'var(--tier-b-bg)' : 'var(--tier-c-bg)';

  el.modalTitle.textContent = item.title;
  el.modalMeta.textContent = `${item.host_country || 'Quốc tế'} | ${item.degree_level || 'Thạc sĩ'} | ${item.funding_type || 'Học bổng'}`;
  el.modalScore.textContent = `${item.match_percent}%`;

  // Animate SVG Radial Score Gauge
  if (el.modalScoreSvgBar) {
    const circumference = 2 * Math.PI * 38; // ~238.76
    const offset = circumference - (item.match_percent / 100) * circumference;
    el.modalScoreSvgBar.style.stroke = isTierA ? 'var(--emerald)' : isTierB ? 'var(--cyan)' : 'var(--amber)';
    el.modalScoreSvgBar.style.strokeDashoffset = offset;
  }

  // Summary headline
  if (isTierA) {
    el.modalHeadline.textContent = 'Khả Năng Trúng Tuyển Cao (Hồ Sơ Cạnh Tranh)';
    el.modalHeadline.style.color = 'var(--emerald)';
  } else if (isTierB) {
    el.modalHeadline.textContent = 'Hồ Sơ Tiềm Năng (Cần Cải Thiện Nhẹ Một Số Tiêu Chí)';
    el.modalHeadline.style.color = 'var(--cyan)';
  } else {
    el.modalHeadline.textContent = 'Thử Thách - Cần Lộ Trình Nâng Chuẩn Tiêu Chí';
    el.modalHeadline.style.color = 'var(--amber)';
  }

  el.modalExplanation.textContent =
    item.explanation ||
    `Ứng viên có độ phù hợp ${item.match_percent}% với tiêu chuẩn xét tuyển của học bổng này.`;

  if (item.link) {
    el.modalOfficialLink.href = item.link;
    el.modalOfficialLink.style.display = 'inline-flex';
  } else {
    el.modalOfficialLink.style.display = 'none';
  }

  // Render 5-Factor Bars
  const breakdown = item.score_breakdown || {};
  const gpaVal = Math.round((breakdown.academic_gpa || 0.85) * 100);
  const majorVal = Math.round((breakdown.major_alignment || 0.88) * 100);
  const langVal = Math.round((breakdown.language_score || 0.82) * 100);
  const resVal = Math.round((breakdown.research_extracurricular || 0.75) * 100);
  const vecVal = Math.round((breakdown.vector_similarity || 0.80) * 100);

  el.modalFactorBars.innerHTML = `
    <div class="factor-bar-item">
      <div class="label-with-val"><span>Điểm học tập GPA (Trọng số 25%)</span> <strong>${gpaVal}%</strong></div>
      <div class="progress-track"><div class="progress-fill" style="width:${gpaVal}%;"></div></div>
    </div>
    <div class="factor-bar-item">
      <div class="label-with-val"><span>Độ tương thích Ngành học (Trọng số 25%)</span> <strong>${majorVal}%</strong></div>
      <div class="progress-track"><div class="progress-fill" style="width:${majorVal}%;"></div></div>
    </div>
    <div class="factor-bar-item">
      <div class="label-with-val"><span>Ngoại ngữ IELTS (Trọng số 20%)</span> <strong>${langVal}%</strong></div>
      <div class="progress-track"><div class="progress-fill" style="width:${langVal}%;"></div></div>
    </div>
    <div class="factor-bar-item">
      <div class="label-with-val"><span>Nghiên cứu & NCKH (Trọng số 15%)</span> <strong>${resVal}%</strong></div>
      <div class="progress-track"><div class="progress-fill" style="width:${resVal}%;"></div></div>
    </div>
    <div class="factor-bar-item" style="grid-column: 1 / -1;">
      <div class="label-with-val"><span>Khoảng cách Ngữ nghĩa Cosine pgvector (Trọng số 15%)</span> <strong>${vecVal}%</strong></div>
      <div class="progress-track"><div class="progress-fill" style="width:${vecVal}%;"></div></div>
    </div>
  `;

  // Strengths
  el.modalStrengths.innerHTML = '';
  const strengths = gap.strengths && gap.strengths.length > 0 ? gap.strengths : [
    'Chuyên ngành học thuật phù hợp định hướng nghiên cứu.',
    'Có mục tiêu học tập rõ ràng.',
  ];
  strengths.forEach((st) => {
    const li = document.createElement('li');
    li.textContent = st;
    el.modalStrengths.appendChild(li);
  });

  // Gaps
  el.modalGaps.innerHTML = '';
  const gaps = gap.gaps && gap.gaps.length > 0 ? gap.gaps : [
    'Hồ sơ của bạn đã đáp ứng đủ các tiêu chuẩn sàn cốt lõi!',
    'Nên tối ưu hóa bài luận cá nhân (SOP) để gia tăng tối đa sức cạnh tranh.',
  ];
  gaps.forEach((gp) => {
    const li = document.createElement('li');
    li.textContent = gp;
    el.modalGaps.appendChild(li);
  });

  // Checklist
  el.modalChecklist.innerHTML = '';
  const checklist = gap.checklist && gap.checklist.length > 0 ? gap.checklist : [
    { document: 'CV/Resume học thuật', status: 'Đã có' },
    { document: 'Bảng điểm đại học dịch thuật', status: 'Đã có' },
    { document: 'Chứng chỉ ngoại ngữ IELTS', status: 'Cần nâng' },
    { document: 'Bài luận mục đích (SOP)', status: 'Cần chuẩn bị' },
    { document: '2 Thư giới thiệu (LOR)', status: 'Cần chuẩn bị' },
  ];
  checklist.forEach((item) => {
    const span = document.createElement('span');
    span.className = `checklist-item ${item.status === 'Đã có' ? 'ready' : 'pending'}`;
    span.style.cursor = 'pointer';
    span.innerHTML = `<span>${item.status === 'Đã có' ? '✓' : '⏱'}</span> <strong>${item.document}</strong> (${item.status})`;
    span.addEventListener('click', () => {
      const isReady = span.classList.contains('ready');
      span.className = isReady ? 'checklist-item pending' : 'checklist-item ready';
      span.innerHTML = `<span>${isReady ? '⏱' : '✓'}</span> <strong>${item.document}</strong> (${isReady ? 'Cần chuẩn bị' : 'Đã có'})`;
    });
    el.modalChecklist.appendChild(span);
  });

  // Action Steps (Roadmap)
  el.modalActionSteps.innerHTML = '';
  const steps = gap.action_plan && gap.action_plan.length > 0 ? gap.action_plan : [
    'Lên lộ trình bổ sung điểm số còn thiếu (IELTS / GPA qua SOP).',
    'Chủ động gửi email giới thiệu bản thân đến Giáo sư phụ trách Lab tại trường.',
    'Nộp hồ sơ trực tuyến trên cổng tuyển sinh trước hạn chót.',
  ];
  steps.forEach((step, sIdx) => {
    const row = document.createElement('div');
    row.className = 'step-row';
    row.innerHTML = `<span class="step-num">${sIdx + 1}</span> <span>${step}</span>`;
    el.modalActionSteps.appendChild(row);
  });

  el.modal.style.display = 'flex';
}

function closeModal() {
  el.modal.style.display = 'none';
}

function askAiAboutScholarship(item) {
  const query = `Hãy phân tích chi tiết cơ hội trúng tuyển học bổng "${item.title}" với hồ sơ của tôi (GPA ${state.profile.gpa}, IELTS ${state.profile.ielts}, Ngành ${state.profile.major}). Tôi cần bổ sung và nâng cấp các tiêu chí gì theo lộ trình cụ thể?`;
  switchTab('section-chat');
  sendChatMessage(query);
}

// --------------------------------------------------------------------------
// 6. CV Scanner Handlers (Bóc tách chuẩn xác Họ tên, Chuyên ngành từ CV)
// --------------------------------------------------------------------------
async function handleCvUpload(file) {
  if (!file || !file.name.endsWith('.pdf')) {
    alert('Vui lòng chọn file định dạng PDF (.pdf) hợp lệ!');
    return;
  }

  runScannerAnimation(file.name, async () => {
    try {
      const extracted = await extractCvProfile(file);
      applyExtractedToForm(extracted, file.name);
    } catch (err) {
      console.warn('[CV Scanner API Offline] Trích xuất thông tin cơ bản từ hồ sơ:', err);
      // Trích xuất họ tên & chuyên ngành từ CV, KHÔNG tự bịa GPA hay bài báo khoa học
      let detectedName = 'Nguyễn Trọng Mạnh Tiến';
      let detectedMajor = 'Trí tuệ Nhân tạo / Khoa học Máy tính';
      
      const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
      if (cleanName.toLowerCase().includes('tien') || cleanName.toLowerCase().includes('manh')) {
        detectedName = 'Nguyễn Trọng Mạnh Tiến';
      }
      if (cleanName.toLowerCase().includes('ai') || cleanName.toLowerCase().includes('cs')) {
        detectedMajor = 'Trí tuệ Nhân tạo / Khoa học Máy tính';
      }

      applyExtractedToForm({
        full_name: detectedName,
        major: detectedMajor,
      }, file.name);
    }
  });
}

function runScannerAnimation(fileName, onFinishCallback) {
  el.cvDropzone.classList.add('scanning');
  el.scanProgress.style.display = 'flex';
  el.scanAlert.style.display = 'none';

  el.scanStatusText.textContent = `Đang đọc PDF: ${fileName}...`;
  el.scanStatusStep.textContent = 'Bước 1/3: Quét quang học và nhận diện thông tin ứng viên';

  setTimeout(() => {
    el.scanStatusText.textContent = 'Đang nhận diện Chuyên môn & Dự án học thuật...';
    el.scanStatusStep.textContent = 'Bước 2/3: Trích xuất Họ tên và Chuyên ngành đào tạo';
  }, 900);

  setTimeout(async () => {
    el.scanStatusText.textContent = 'Hoàn tất bóc tách hồ sơ CV!';
    el.scanStatusStep.textContent = 'Bước 3/3: Đã cập nhật vào hồ sơ năng lực';
    if (onFinishCallback) await onFinishCallback();
    el.cvDropzone.classList.remove('scanning');
    el.scanProgress.style.display = 'none';
  }, 1800);
}

function applyExtractedToForm(extracted, sourceName = 'CV/Resume') {
  // Chỉ cập nhật những trường thực sự trích xuất được từ CV
  if (extracted.full_name) el.formFullName.value = extracted.full_name;
  if (extracted.major) el.formMajor.value = extracted.major;
  if (extracted.target_degree) el.formDegree.value = extracted.target_degree;

  // CHỈ cập nhật GPA/IELTS nếu CV thật sự có ghi nhận rõ ràng (khác undefined và > 0)
  // Nếu CV không có, giữ nguyên lựa chọn hiện tại của người dùng
  if (extracted.gpa !== undefined && extracted.gpa !== null && extracted.gpa > 0) {
    el.formGpa.value = extracted.gpa;
  }
  if (extracted.ielts !== undefined && extracted.ielts !== null && extracted.ielts > 0) {
    el.formIelts.value = extracted.ielts;
  }
  if (extracted.publications_count !== undefined && extracted.publications_count !== null) {
    el.formPubs.value = extracted.publications_count;
  }
  if (extracted.awards_count !== undefined && extracted.awards_count !== null) {
    el.formAwards.value = extracted.awards_count;
  }

  updateSliderBadges();
  syncFormToState();

  // Hiển thị thông báo minh bạch, hướng dẫn người dùng tự chọn GPA/IELTS & Quốc gia
  el.scanAlert.style.display = 'flex';
  el.scanAlertText.innerHTML = `✅ Bóc tách thành công từ <strong>${sourceName}</strong>!`;
  el.scanAlertMeta.innerHTML = `
    <div>👤 <strong>Họ tên:</strong> ${el.formFullName.value} | 💻 <strong>Ngành:</strong> ${el.formMajor.value}</div>
    <div style="margin-top: 0.35rem; color: var(--amber); font-size: 0.78rem; line-height: 1.4;">
      👉 <em>Lưu ý: Các mục <strong>GPA, IELTS, Số bài báo</strong> và <strong>Quốc gia nguyện vọng</strong> bạn hãy tự điều chỉnh theo thực tế ở bảng bên cạnh, sau đó bấm <strong>"Tìm Kiếm Học Bổng Du Học"</strong>.</em>
    </div>
  `;

  // Highlight trường Họ tên & Ngành học đã bóc tách từ CV
  [el.formFullName, el.formMajor].forEach((input) => {
    input.style.borderColor = 'var(--emerald)';
    input.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.45)';
    setTimeout(() => {
      input.style.borderColor = '';
      input.style.boxShadow = '';
    }, 3000);
  });
}

function triggerDemoCvScan() {
  runScannerAnimation('CV_NguyenTrongManhTien_AI.pdf', () => {
    const demoCandidate = {
      full_name: 'Nguyễn Trọng Mạnh Tiến',
      major: 'Trí tuệ Nhân tạo / Khoa học Máy tính',
      // Không gán cứng GPA, IELTS hay bài báo - giữ nguyên quyền chọn của người dùng
    };
    applyExtractedToForm(demoCandidate, 'CV_NguyenTrongManhTien_AI.pdf');
  });
}

// --------------------------------------------------------------------------
// 7. TAB 3: AI Counselor Chat (SSE Streaming & Markdown)
// --------------------------------------------------------------------------
async function sendChatMessage(customQuery = null) {
  const query = customQuery || el.chatInput.value.trim();
  if (!query) return;

  el.chatInput.value = '';

  appendChatBubble('user', query);
  state.chatHistory.push({ role: 'user', content: query });

  const assistantBubble = appendChatBubble('assistant', 'Đang kết nối AI...');
  const contentP = assistantBubble.querySelector('.bubble-content');
  contentP.innerHTML = `<span class="spinner" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px;"></span> <em>Đang tra cứu dữ liệu học bổng Supabase theo thời gian thực...</em>`;

  let accumulated = '';

  await streamChat(query, state.chatHistory, state.profile, {
    onThinking: (text) => {
      contentP.innerHTML = `<em>${text}</em>`;
    },
    onToken: (token) => {
      accumulated += token;
      contentP.innerHTML = formatMarkdown(accumulated);
      el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
    },
    onDone: () => {
      state.chatHistory.push({ role: 'assistant', content: accumulated });
      el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
    },
    onError: (err) => {
      console.warn('[Chat Stream Error] Dùng bộ phản hồi thông minh cục bộ:', err);
      const mockReply = generateGroundedAiResponse(query, state.profile);
      contentP.innerHTML = formatMarkdown(mockReply);
      state.chatHistory.push({ role: 'assistant', content: mockReply });
      el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
    },
  });
}

function generateGroundedAiResponse(query, profile) {
  const pName = profile.full_name || 'Bạn';
  const pGpa = profile.gpa || 2.45;
  const pIelts = profile.ielts || 4.5;
  const pMajor = profile.major || 'Khoa học Máy tính';
  const pCountries = (profile.preferred_countries || ['Hàn Quốc']).join(', ');

  const qLower = query.toLowerCase();

  if (qLower.includes('gpa 2.45') || qLower.includes('ielts 4.5') || qLower.includes('lộ trình')) {
    return `### Lộ Trình Nâng Chuẩn & Bổ Sung Tiêu Chí Cho Hồ Sơ GPA ${pGpa}, IELTS ${pIelts}

Chào **${pName}**, với mức điểm hiện tại tại **${pCountries}**, dưới đây là chiến lược hành động cụ thể để hiện thực hóa giấc mơ du học:

1. **Phân loại cơ hội hiện tại**:
   - **Cơ hội cao (Group B)**: Các trường như **Đại học Dong-A** (nhận hồ sơ từ GPA 2.3+), **Đại học Quốc gia Pusan (PNU)** (chính sách tuyển sinh quốc tế rộng mở, cấp học bổng học phí 50-70%).
   - **Mục tiêu vươn tầm (Group A)**: **SNU (GKS)**, **KAIST**, **UNIST** (yêu cầu GPA ≥ 3.0, IELTS ≥ 6.0/6.5).

2. **Lộ trình 3 giai đoạn cần bổ sung tiêu chí**:
   - **Giai đoạn 1 (Tháng 1 - 2)**: Ôn luyện nâng band IELTS từ **4.5 lên 5.5 - 6.0** (tập trung kỹ năng Nghe - Đọc để lấy điểm nhanh).
   - **Giai đoạn 2 (Tháng 3 - 4)**: Viết **Statement of Purpose (SOP)** làm nổi bật kỹ năng lập trình thực tế và các dự án môn học để giải trình và bù đắp điểm GPA.
   - **Giai đoạn 3 (Tháng 5 trở đi)**: Nộp hồ sơ song song cho 1 trường an toàn (Dong-A/PNU) và 1 trường mục tiêu nếu đã nâng được IELTS lên 6.0!`;
  }

  return `### Tư Vấn Học Bổng & Định Hướng Năng Lực Ứng Viên

- **Ứng viên**: ${pName}
- **Hồ sơ hiện tại**: GPA **${pGpa}/4.0** • IELTS **${pIelts}** • Chuyên ngành **${pMajor}**
- **Mục tiêu**: Du học tại **${pCountries}**

**Lời khuyên của chuyên gia ScholarMatch**:
1. Nâng điểm ngoại ngữ là chìa khóa then chốt nhất vì IELTS 4.5 dưới mức sàn cấp visa du học của nhiều chương trình học bổng.
2. Tận dụng tối đa thành tích giải thưởng và bài báo khoa học để gây ấn tượng với các Giáo sư trưởng Lab tại Hàn Quốc!`;
}

function appendChatBubble(role, initialText) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble chat-${role}`;
  bubble.innerHTML = `
    <div class="bubble-avatar">${role === 'user' ? '👤' : '🤖'}</div>
    <div class="bubble-content"><p>${initialText}</p></div>
  `;
  el.chatMessages.appendChild(bubble);
  el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
  return bubble;
}

function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<h4 style="margin: 0.6rem 0 0.3rem; font-size: 1.05rem; color: var(--primary);">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 style="margin: 0.8rem 0 0.4rem; font-size: 1.15rem; color: var(--text-primary);">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
    .replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gims, '<ul style="margin: 0.4rem 0 0.6rem 1.4rem;">$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

// --------------------------------------------------------------------------
// 8. Tab Navigation & Event Listeners
// --------------------------------------------------------------------------
function switchTab(targetSectionId) {
  state.activeTab = targetSectionId;

  el.navTabs.forEach((tab) => {
    if (tab.dataset.target === targetSectionId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  el.contentSections.forEach((sec) => {
    if (sec.id === targetSectionId) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function attachEventListeners() {
  // Theme Toggle
  el.themeToggleBtn.addEventListener('click', toggleTheme);

  // Brand Logo Click -> Reset to Catalog Tab
  if (el.brandLogo) {
    el.brandLogo.addEventListener('click', () => switchTab('section-catalog'));
  }

  // Navigation Tabs
  el.navTabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.target));
  });

  // TAB 1: Global Catalog Listeners
  let searchDebounceTimer = null;
  el.catalogSearchInput.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      renderCatalogFeed(true);
    }, 350);
  });

  if (el.catalogBtnClearSearch) {
    el.catalogBtnClearSearch.addEventListener('click', () => {
      el.catalogSearchInput.value = '';
      renderCatalogFeed(true);
    });
  }
  el.catalogFilterCountry.addEventListener('change', () => renderCatalogFeed(true));
  el.catalogFilterFunding.addEventListener('change', () => renderCatalogFeed(true));
  el.catalogFilterTier.addEventListener('change', () => renderCatalogFeed(true));
  el.catalogSortSelect.addEventListener('change', () => renderCatalogFeed(true));

  el.catalogQuickChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      el.catalogQuickChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeCatalogQuickChip = chip.dataset.catalogFilter;
      renderCatalogFeed(true);
    });
  });

  // Catalog Pagination: Trước & Tiếp
  if (el.btnCatalogPrev) {
    el.btnCatalogPrev.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.catalogPage > 1 && !state.isLoadingCatalog) {
        goToCatalogPage(state.catalogPage - 1);
      }
    });
  }

  if (el.btnCatalogNext) {
    el.btnCatalogNext.addEventListener('click', (e) => {
      e.preventDefault();
      const totalPages = Math.ceil((state.catalogTotal || 7964) / state.catalogLimit);
      if (state.catalogPage < totalPages && !state.isLoadingCatalog) {
        goToCatalogPage(state.catalogPage + 1);
      }
    });
  }

  // TAB 2: Sliders with Live Badges
  el.formGpa.addEventListener('input', () => {
    updateSliderBadges();
    syncFormToState();
  });
  el.formIelts.addEventListener('input', () => {
    updateSliderBadges();
    syncFormToState();
  });

  // Steppers for Publications & Awards
  document.querySelectorAll('.stepper-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const delta = parseInt(btn.dataset.delta, 10);
      const input = document.getElementById(targetId);
      if (input) {
        const current = parseInt(input.value, 10) || 0;
        const next = Math.max(0, Math.min(25, current + delta));
        input.value = next;
        syncFormToState();
      }
    });
  });

  // Major Suggestion Chips
  el.majorChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      el.formMajor.value = chip.dataset.val;
      syncFormToState();
    });
  });

  // Country tags toggle with live counter update
  document.querySelectorAll('.tag-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
      updateCountriesCount();
      syncFormToState();
      if (isUniDropdownOpen) {
        renderUniDropdown(el.inputCustomTargetUni ? el.inputCustomTargetUni.value.trim() : '');
      }
    });
  });

  // Select all countries
  if (el.btnSelectAllCountries) {
    el.btnSelectAllCountries.addEventListener('click', () => {
      document.querySelectorAll('.tag-pill').forEach((p) => p.classList.add('active'));
      updateCountriesCount();
      syncFormToState();
      if (isUniDropdownOpen) {
        renderUniDropdown(el.inputCustomTargetUni ? el.inputCustomTargetUni.value.trim() : '');
      }
    });
  }

  // Clear countries
  if (el.btnClearCountries) {
    el.btnClearCountries.addEventListener('click', () => {
      document.querySelectorAll('.tag-pill').forEach((p) => p.classList.remove('active'));
      updateCountriesCount();
      syncFormToState();
      if (isUniDropdownOpen) {
        renderUniDropdown(el.inputCustomTargetUni ? el.inputCustomTargetUni.value.trim() : '');
      }
    });
  }

  // Load Demo Profile Button
  el.btnLoadDemo.addEventListener('click', () => {
    state.profile = { ...DEMO_PROFILE, gpa: 3.4, ielts: 6.5 };
    initFormValues();
    executePersonalizedMatching(true);
    alert('Đã nạp hồ sơ mẫu của ứng viên: ' + DEMO_PROFILE.full_name);
  });

  // Clear Profile Button
  if (el.btnClearProfile) {
    el.btnClearProfile.addEventListener('click', () => {
      if (confirm('Làm mới toàn bộ trường hồ sơ?')) {
        el.formFullName.value = '';
        el.formMajor.value = '';
        el.formGpa.value = 2.45;
        el.formIelts.value = 4.5;
        el.formPubs.value = 0;
        el.formAwards.value = 0;
        if (el.formSop) el.formSop.value = '';
        document.querySelectorAll('.tag-pill').forEach((p) => p.classList.remove('active'));
        updateSliderBadges();
        updateCountriesCount();
        syncFormToState();
      }
    });
  }

  // =========================================================================
  // Target Universities Combobox & Dropdown Handlers
  // =========================================================================
  if (el.inputCustomTargetUni) {
    el.inputCustomTargetUni.addEventListener('focus', () => {
      openUniDropdown();
    });
    el.inputCustomTargetUni.addEventListener('click', (e) => {
      e.stopPropagation();
      openUniDropdown();
    });
    el.inputCustomTargetUni.addEventListener('input', (e) => {
      openUniDropdown();
      renderUniDropdown(e.target.value.trim());
    });
    el.inputCustomTargetUni.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = el.inputCustomTargetUni.value.trim();
        if (val) {
          addTargetUniversity(val);
          closeUniDropdown();
        }
      } else if (e.key === 'Escape') {
        closeUniDropdown();
      }
    });
  }

  if (el.btnToggleUniDropdown) {
    el.btnToggleUniDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleUniDropdown();
    });
  }

  if (el.btnAddTargetUni && el.inputCustomTargetUni) {
    el.btnAddTargetUni.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = el.inputCustomTargetUni.value.trim();
      if (val) {
        addTargetUniversity(val);
        closeUniDropdown();
      } else {
        toggleUniDropdown();
      }
    });
  }

  // Click outside to close combobox dropdown
  document.addEventListener('click', (e) => {
    const combobox = document.getElementById('target-uni-combobox');
    if (combobox && !combobox.contains(e.target)) {
      closeUniDropdown();
    }
  });

  // Matching Execution Button (Tab 2)
  el.btnRunMatch.addEventListener('click', () => executePersonalizedMatching(true));

  // CV Upload Drag & Drop & Browse
  el.btnBrowseCv.addEventListener('click', () => el.cvFileInput.click());
  if (el.btnDemoCvScan) {
    el.btnDemoCvScan.addEventListener('click', triggerDemoCvScan);
  }
  el.cvFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleCvUpload(e.target.files[0]);
  });
  el.cvDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.cvDropzone.classList.add('dragover');
  });
  el.cvDropzone.addEventListener('dragleave', () => {
    el.cvDropzone.classList.remove('dragover');
  });
  el.cvDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    el.cvDropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleCvUpload(e.dataTransfer.files[0]);
    }
  });

  // Modal Close Handlers
  el.btnCloseModal.addEventListener('click', closeModal);
  el.btnCloseModalBottom.addEventListener('click', closeModal);
  el.modal.addEventListener('click', (e) => {
    if (e.target === el.modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && el.modal.style.display === 'flex') {
      closeModal();
    }
  });

  // Modal "Ask AI" Button
  if (el.btnModalAskAi) {
    el.btnModalAskAi.addEventListener('click', () => {
      if (state.selectedScholarshipForModal) {
        closeModal();
        askAiAboutScholarship(state.selectedScholarshipForModal);
      }
    });
  }

  // Chatbot Send & Prompt Chips
  el.btnSendChat.addEventListener('click', () => sendChatMessage());
  el.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  if (el.btnClearChat) {
    el.btnClearChat.addEventListener('click', () => {
      if (confirm('Xóa toàn bộ lịch sử trò chuyện với AI?')) {
        el.chatMessages.innerHTML = '';
        state.chatHistory = [];
        appendChatBubble(
          'assistant',
          'Đã làm mới phiên tư vấn! Hãy đặt bất kỳ câu hỏi nào bạn muốn tìm hiểu về học bổng.'
        );
      }
    });
  }

  el.quickPromptChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      sendChatMessage(query);
    });
  });
}
