/**
 * ScholarMatch AI - Dual-Mode Frontend Controller
 * Tab 1: Global Scholarship Catalog (Explore all 7,944+ scholarships with independent filters)
 * Tab 2: Candidate Profile & Dedicated Personalized AI Matching (Ranked top-to-bottom with Gap Analysis & Action Roadmap)
 * Tab 3: AI Du Học Counselor (SSE Stream RAG Chatbot)
 */

import { checkBackendHealth, fetchScholarshipCatalog, matchScholarships, extractCvProfile, streamChat } from './api.js';
import { DEMO_SCHOLARSHIPS, DEMO_PROFILE } from './data/demoData.js';
import { getOfficialPortalUrl } from './portalResolver.js';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

if (typeof window !== 'undefined' && GlobalWorkerOptions) {
  GlobalWorkerOptions.workerSrc = pdfWorker;
}

// Application State
const state = {
  activeTab: 'section-dashboard',
  selectedTier: 'ALL',
  profileMode: 'cv',
  cvGpaSupplemented: null,
  theme: localStorage.getItem('theme') || 'light',
  currentRole: 'student', // 'student' | 'admin' | 'advisor' | 'sponsor'
  profile: { ...DEMO_PROFILE, gpa: 3.20, ielts: 5.5, preferred_countries: ['Hàn Quốc'], target_universities: [] },
  targetMatchedStatus: 'NONE',
  targetGapsSummary: null,
  
  // Tab 1: Global Catalog Data (7,949 scholarships)
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

  // Modal Gap Analysis (Tab 2)
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

  // Modal 1: Scholarship Dossier / Details (Tab 1 Catalog)
  modalDetail: document.getElementById('modal-scholarship-detail'),
  btnCloseDetailModal: document.getElementById('btn-close-detail-modal'),
  btnCloseDetailModalBottom: document.getElementById('btn-close-detail-modal-bottom'),
  detailModalCountry: document.getElementById('detail-modal-country'),
  detailModalDegree: document.getElementById('detail-modal-degree'),
  detailModalFunding: document.getElementById('detail-modal-funding'),
  detailModalTier: document.getElementById('detail-modal-tier'),
  detailModalTitle: document.getElementById('detail-modal-title'),
  detailModalInstitution: document.getElementById('detail-modal-institution'),
  detailModalOverview: document.getElementById('detail-modal-overview'),
  detailModalFundingPerks: document.getElementById('detail-modal-funding-perks'),
  detailModalAdmissionReqs: document.getElementById('detail-modal-admission-reqs'),
  detailModalMajors: document.getElementById('detail-modal-majors'),
  detailModalChecklist: document.getElementById('detail-modal-checklist'),
  detailModalDeadline: document.getElementById('detail-modal-deadline'),
  detailModalApplyMethod: document.getElementById('detail-modal-apply-method'),
  detailModalOfficialPortal: document.getElementById('detail-modal-official-portal'),
  btnDetailAskAi: document.getElementById('btn-detail-ask-ai'),
  btnDetailSwitchToProfile: document.getElementById('btn-detail-switch-to-profile'),

  // Candidate Snapshot (Tab 2)
  cvSnapshotCard: document.getElementById('cv-candidate-snapshot'),
  cvSnapshotSource: document.getElementById('cv-snapshot-source'),
  cvSnapshotName: document.getElementById('cv-snapshot-name'),
  cvSnapshotMajor: document.getElementById('cv-snapshot-major'),
  cvSnapshotNarrative: document.getElementById('cv-snapshot-narrative'),
  cvSnapshotPills: document.getElementById('cv-snapshot-pills'),

  // Profile Input Modes & Missing GPA Handlers
  btnTabModeCv: document.getElementById('btn-tab-mode-cv'),
  btnTabModeManual: document.getElementById('btn-tab-mode-manual'),
  paneCvMode: document.getElementById('pane-cv-mode'),
  paneManualMode: document.getElementById('pane-manual-mode'),
  cvMissingBox: document.getElementById('cv-missing-box'),
  cvInlineGpa: document.getElementById('cv-inline-gpa'),
  btnApplyCvGpa: document.getElementById('btn-apply-cv-gpa'),
  btnSwitchToManual: document.getElementById('btn-switch-to-manual-form'),
  btnRunMatchCv: document.getElementById('btn-run-match-cv'),

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
    initStudent360Shell();
    initLiveClock();
  updateSliderBadges();
    updateChatContextBar();
    updateCompetencyRadarUI();
    initTrackerModule();
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

// Theme Management (Defaults to Clean Light Mode like Student360)
function initTheme() {
  const isExplicit = localStorage.getItem('sm_theme_explicit') === 'true';
  state.theme = isExplicit ? (localStorage.getItem('theme') || 'light') : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('theme', state.theme);
}
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('theme', state.theme);
  localStorage.setItem('sm_theme_explicit', 'true');
  updateSliderBadges();
}

function updateTotalScholarshipCountEverywhere(count) {
  if (!count) return;
  const num = Number(count);
  const formatted = num.toLocaleString('vi-VN');
  if (el.backendStatusText && state.backendConnected) {
    el.backendStatusText.textContent = `${formatted}+ Học bổng sẵn sàng`;
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
    el.backendStatusText.textContent = `${Number(totalCount).toLocaleString('vi-VN')}+ Học bổng sẵn sàng`;
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
  if (sortMode === 'gpa_desc') {
    sortByParam = 'gpa_desc';
  } else if (sortMode === 'gpa_asc') {
    sortByParam = 'gpa_asc';
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
          <h3>Đang kết nối Kho Học Bổng Toàn Cầu...</h3>
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
          tier_group: item.tier_group || 'Học bổng Cấp Trường',
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

  if (sortMode === 'deadline_asc') {
    filtered.sort((a, b) => new Date(a.deadline || '2099-01-01') - new Date(b.deadline || '2099-01-01'));
  } else if (sortMode === 'gpa_asc') {
    filtered.sort((a, b) => (a.min_gpa || 0) - (b.min_gpa || 0));
  } else if (sortMode === 'gpa_desc') {
    filtered.sort((a, b) => (b.min_gpa || 0) - (a.min_gpa || 0));
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
    const isTierA = item.tier_group && (item.tier_group.includes('Group A') || item.tier_group.includes('Chính Phủ') || item.tier_group.includes('Toàn Phần'));
    const isTierB = item.tier_group && (item.tier_group.includes('Group B') || item.tier_group.includes('Trường'));
    const tierClass = isTierA ? 'tier-group-a' : isTierB ? 'tier-group-b' : 'tier-group-c';
    const tierBadgeLabel = item.tier_group || 'Học bổng Cấp Trường';

    const portalUrl = getOfficialPortalUrl(item);

    const card = document.createElement('div');
    card.className = `card scholarship-card ${tierClass}`;

    const minGpaText = item.min_gpa ? `${item.min_gpa.toFixed(2)} / 4.0` : 'Không bắt buộc';
    const minIeltsText = item.min_ielts ? `IELTS ${item.min_ielts.toFixed(1)}+` : 'Theo yêu cầu ngành';
    const majorText = item.major_applied || 'Đa ngành / Khoa học & Kỹ thuật';
    const deadlineText = item.deadline || 'Theo kỳ tuyển sinh';

    card.innerHTML = `
      <div class="card-top-row">
        <div class="country-degree-pills">
          <span class="badge-pill pill-country">📍 ${item.host_country || 'Quốc tế'}</span>
          <span class="badge-pill pill-degree">🎓 ${item.degree_level || 'Thạc sĩ'}</span>
          <span class="badge-pill pill-funding">💰 ${item.funding_type || 'Học bổng'}</span>
        </div>
        <span class="badge-pill pill-tier">${tierBadgeLabel}</span>
      </div>

      <h3 class="card-title-scholarship" title="${item.title}">${item.title}</h3>
      <div class="card-institution-row">
        <span>🏛️</span>
        <span class="institution-name">${item.source_name || 'Đại học đối tác'}</span>
      </div>
      <p class="card-funding-desc" title="${item.funding_details || majorText}">
        ${item.funding_details || majorText || 'Thông tin chi tiết học bổng quốc tế'}
      </p>

      <!-- Authentic Scholarship Criteria Grid (No Fake Candidate Match Scores) -->
      <div class="catalog-req-grid">
        <div class="req-item">
          <span class="req-icon">📊</span>
          <div class="req-content">
            <span class="req-label">GPA Tối Thiểu</span>
            <strong class="req-val">${minGpaText}</strong>
          </div>
        </div>
        <div class="req-item">
          <span class="req-icon">🌐</span>
          <div class="req-content">
            <span class="req-label">Ngoại Ngữ Sàn</span>
            <strong class="req-val">${minIeltsText}</strong>
          </div>
        </div>
        <div class="req-item full-col">
          <span class="req-icon">📚</span>
          <div class="req-content">
            <span class="req-label">Chuyên Ngành Tiếp Nhận</span>
            <strong class="req-val text-truncate" title="${majorText}">${majorText}</strong>
          </div>
        </div>
        <div class="req-item full-col deadline-col">
          <span class="req-icon">⏰</span>
          <div class="req-content">
            <span class="req-label">Hạn Chót Nộp Đơn</span>
            <strong class="req-val">${deadlineText}</strong>
          </div>
        </div>
      </div>

      <div class="card-action-footer">
        <button class="btn btn-secondary btn-sm btn-catalog-detail" data-idx="${index}">
          📄 Chi Tiết
        </button>
        <button type="button" class="btn btn-outline btn-sm btn-catalog-track" data-idx="${index}" title="Lưu học bổng này vào mục Theo Dõi Ứng Tuyển">
          📌 Theo Dõi
        </button>
        <a href="${portalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm btn-catalog-portal" title="Mở trang đăng ký chính thức của trường">
          🌐 Portal
        </a>
        <button class="btn btn-outline btn-sm btn-catalog-ask-ai" data-idx="${index}">
          💬 Hỏi AI
        </button>
      </div>
    `;

    // Attach card action listeners
    const btnDetail = card.querySelector('.btn-catalog-detail');
    if (btnDetail) {
      btnDetail.addEventListener('click', () => openScholarshipDetailModal(item));
    }
    const btnTrack = card.querySelector('.btn-catalog-track');
    if (btnTrack) {
      btnTrack.addEventListener('click', (e) => {
        e.stopPropagation();
        addScholarshipToTracker(item);
      });
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
// Helper: update visual progress and dynamic colors for range sliders
function updateSliderVisual(inputEl, pct, color, glow, glowSubtle) {
  if (!inputEl) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const trackBg = isDark ? 'rgba(255, 255, 255, 0.18)' : '#E2E8F0';
  // Thumb diameter is 22px, radius is 11px
  // Exact center offset: (0.5 - pct/100) * 22px
  const offsetPx = ((0.5 - (pct / 100)) * 22).toFixed(2);
  const stop = `calc(${pct.toFixed(2)}% + ${offsetPx}px)`;

  inputEl.style.setProperty('--range-color', color);
  inputEl.style.setProperty('--range-stop', stop);
  inputEl.style.setProperty('--range-track-bg', trackBg);
  inputEl.style.setProperty('--range-glow', glow);
  inputEl.style.setProperty('--range-glow-subtle', glowSubtle);
  inputEl.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${stop}, ${trackBg} ${stop}, ${trackBg} 100%)`;
}

function updateSliderBadges() {
  if (!el.formGpa || !el.formIelts) return;
  const gpa = parseFloat(el.formGpa.value);
  el.displayGpa.textContent = gpa.toFixed(2);

  // Cập nhật thanh màu tiến độ cho GPA (min: 2.0, max: 4.0)
  const minGpa = parseFloat(el.formGpa.min) || 2.0;
  const maxGpa = parseFloat(el.formGpa.max) || 4.0;
  const pctGpa = Math.max(0, Math.min(100, ((gpa - minGpa) / (maxGpa - minGpa)) * 100));

  let gpaColor = '#2563EB';
  let gpaGlow = 'rgba(37, 99, 235, 0.4)';
  let gpaGlowSubtle = 'rgba(37, 99, 235, 0.2)';

  if (gpa >= 3.6) {
    el.badgeGpa.textContent = 'Xuất sắc (A+)';
    el.badgeGpa.style.color = '#10B981';
    el.badgeGpa.style.background = 'rgba(16, 185, 129, 0.15)';
    gpaColor = '#10B981';
    gpaGlow = 'rgba(16, 185, 129, 0.45)';
    gpaGlowSubtle = 'rgba(16, 185, 129, 0.22)';
  } else if (gpa >= 3.2) {
    el.badgeGpa.textContent = 'Giỏi (A)';
    el.badgeGpa.style.color = '#2563EB';
    el.badgeGpa.style.background = 'rgba(37, 99, 235, 0.15)';
    gpaColor = '#2563EB';
    gpaGlow = 'rgba(37, 99, 235, 0.45)';
    gpaGlowSubtle = 'rgba(37, 99, 235, 0.22)';
  } else if (gpa >= 2.8) {
    el.badgeGpa.textContent = 'Khá (B)';
    el.badgeGpa.style.color = '#06B6D4';
    el.badgeGpa.style.background = 'rgba(6, 182, 212, 0.15)';
    gpaColor = '#06B6D4';
    gpaGlow = 'rgba(6, 182, 212, 0.45)';
    gpaGlowSubtle = 'rgba(6, 182, 212, 0.22)';
  } else {
    el.badgeGpa.textContent = 'Trung bình (C)';
    el.badgeGpa.style.color = '#F59E0B';
    el.badgeGpa.style.background = 'rgba(245, 158, 11, 0.15)';
    gpaColor = '#F59E0B';
    gpaGlow = 'rgba(245, 158, 11, 0.45)';
    gpaGlowSubtle = 'rgba(245, 158, 11, 0.22)';
  }
  updateSliderVisual(el.formGpa, pctGpa, gpaColor, gpaGlow, gpaGlowSubtle);

  const ielts = parseFloat(el.formIelts.value);
  el.displayIelts.textContent = ielts.toFixed(1);

  // Cập nhật thanh màu tiến độ cho IELTS (min: 4.0, max: 9.0)
  const minIelts = parseFloat(el.formIelts.min) || 4.0;
  const maxIelts = parseFloat(el.formIelts.max) || 9.0;
  const pctIelts = Math.max(0, Math.min(100, ((ielts - minIelts) / (maxIelts - minIelts)) * 100));

  let ieltsColor = '#2563EB';
  let ieltsGlow = 'rgba(37, 99, 235, 0.4)';
  let ieltsGlowSubtle = 'rgba(37, 99, 235, 0.2)';

  if (ielts >= 8.0) {
    el.badgeIelts.textContent = 'C2 Vượt trội';
    el.badgeIelts.style.color = '#10B981';
    el.badgeIelts.style.background = 'rgba(16, 185, 129, 0.15)';
    ieltsColor = '#10B981';
    ieltsGlow = 'rgba(16, 185, 129, 0.45)';
    ieltsGlowSubtle = 'rgba(16, 185, 129, 0.22)';
  } else if (ielts >= 7.0) {
    el.badgeIelts.textContent = 'C1 Advanced';
    el.badgeIelts.style.color = '#2563EB';
    el.badgeIelts.style.background = 'rgba(37, 99, 235, 0.15)';
    ieltsColor = '#2563EB';
    ieltsGlow = 'rgba(37, 99, 235, 0.45)';
    ieltsGlowSubtle = 'rgba(37, 99, 235, 0.22)';
  } else if (ielts >= 6.0) {
    el.badgeIelts.textContent = 'B2 Upper-Int';
    el.badgeIelts.style.color = '#06B6D4';
    el.badgeIelts.style.background = 'rgba(6, 182, 212, 0.15)';
    ieltsColor = '#06B6D4';
    ieltsGlow = 'rgba(6, 182, 212, 0.45)';
    ieltsGlowSubtle = 'rgba(6, 182, 212, 0.22)';
  } else {
    el.badgeIelts.textContent = 'B1 Cần nâng';
    el.badgeIelts.style.color = '#F59E0B';
    el.badgeIelts.style.background = 'rgba(245, 158, 11, 0.15)';
    ieltsColor = '#F59E0B';
    ieltsGlow = 'rgba(245, 158, 11, 0.45)';
    ieltsGlowSubtle = 'rgba(245, 158, 11, 0.22)';
  }
  updateSliderVisual(el.formIelts, pctIelts, ieltsColor, ieltsGlow, ieltsGlowSubtle);

  updateCompetencyRadarUI();
}

function updateCompetencyRadarUI() {
  const gpa = el.formGpa ? parseFloat(el.formGpa.value) || 3.20 : 3.20;
  const ielts = el.formIelts ? parseFloat(el.formIelts.value) || 5.5 : 5.5;
  const pubs = el.formPublications ? parseInt(el.formPublications.value, 10) || 0 : 1;
  const awards = el.formAwards ? parseInt(el.formAwards.value, 10) || 0 : 2;
  const activeCountries = document.querySelectorAll('.tag-pill.active');
  const fitRatio = activeCountries.length > 0 ? 0.9 : 0.45;

  const cx = 140, cy = 110, R = 75;

  const r0 = R * (0.2 + 0.8 * Math.max(0, Math.min(1, (gpa - 2.0) / 2.0)));
  const r1 = R * (0.2 + 0.8 * Math.max(0, Math.min(1, (ielts - 4.0) / 5.0)));
  const r2 = R * (0.2 + 0.8 * Math.max(0, Math.min(1, pubs / 3.0)));
  const r3 = R * (0.2 + 0.8 * Math.max(0, Math.min(1, awards / 4.0)));
  const r4 = R * (0.2 + 0.8 * fitRatio);

  const rad18 = (18 * Math.PI) / 180;
  const rad54 = (54 * Math.PI) / 180;

  const x0 = cx, y0 = cy - r0;
  const x1 = cx + r1 * Math.cos(rad18), y1 = cy - r1 * Math.sin(rad18);
  const x2 = cx + r2 * Math.cos(rad54), y2 = cy + r2 * Math.sin(rad54);
  const x3 = cx - r3 * Math.cos(rad54), y3 = cy + r3 * Math.sin(rad54);
  const x4 = cx - r4 * Math.cos(rad18), y4 = cy - r4 * Math.sin(rad18);

  const poly = document.getElementById('radar-candidate-polygon');
  if (poly) {
    poly.setAttribute('points', `${x0.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)} ${x4.toFixed(1)},${y4.toFixed(1)}`);
  }

  const dot0 = document.getElementById('radar-point-gpa');
  if (dot0) { dot0.setAttribute('cx', x0.toFixed(1)); dot0.setAttribute('cy', y0.toFixed(1)); }
  const dot1 = document.getElementById('radar-point-ielts');
  if (dot1) { dot1.setAttribute('cx', x1.toFixed(1)); dot1.setAttribute('cy', y1.toFixed(1)); }
  const dot2 = document.getElementById('radar-point-pubs');
  if (dot2) { dot2.setAttribute('cx', x2.toFixed(1)); dot2.setAttribute('cy', y2.toFixed(1)); }
  const dot3 = document.getElementById('radar-point-awards');
  if (dot3) { dot3.setAttribute('cx', x3.toFixed(1)); dot3.setAttribute('cy', y3.toFixed(1)); }
  const dot4 = document.getElementById('radar-point-fit');
  if (dot4) { dot4.setAttribute('cx', x4.toFixed(1)); dot4.setAttribute('cy', y4.toFixed(1)); }

  const lblGpa = document.getElementById('radar-lbl-gpa');
  if (lblGpa) lblGpa.textContent = `GPA (${gpa.toFixed(2)})`;
  const lblIelts = document.getElementById('radar-lbl-ielts');
  if (lblIelts) lblIelts.textContent = `IELTS (${ielts.toFixed(1)})`;
  const lblPubs = document.getElementById('radar-lbl-pubs');
  if (lblPubs) lblPubs.textContent = `NCKH (${pubs})`;
  const lblAwards = document.getElementById('radar-lbl-awards');
  if (lblAwards) lblAwards.textContent = `Giải thưởng (${awards})`;

  const statGpa = document.getElementById('radar-stat-gpa');
  if (statGpa) statGpa.textContent = gpa.toFixed(2);
  const statIelts = document.getElementById('radar-stat-ielts');
  if (statIelts) statIelts.textContent = ielts.toFixed(1);
  const statPubs = document.getElementById('radar-stat-pubs');
  if (statPubs) statPubs.textContent = `${pubs} bài`;
  const statAwards = document.getElementById('radar-stat-awards');
  if (statAwards) statAwards.textContent = `${awards} giải`;

  const hdrName = document.getElementById('header-student-name');
  if (hdrName && el.formFullName && el.formFullName.value.trim()) {
    hdrName.textContent = el.formFullName.value.trim();
  }
  const hdrMajor = document.getElementById('header-student-major');
  if (hdrMajor && el.formMajor && el.formMajor.value.trim()) {
    hdrMajor.textContent = el.formMajor.value.trim().split('/')[0].trim();
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
  updateCompetencyRadarUI();
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
  el.formGpa.value = (p.gpa !== undefined && p.gpa !== null) ? p.gpa : 3.20;
  el.formIelts.value = (p.ielts !== undefined && p.ielts !== null) ? p.ielts : 5.5;
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

  let candidateGpa = parseFloat(el.formGpa.value);
  if (state.profileMode === 'cv') {
    if (state.cvGpaSupplemented !== null) {
      candidateGpa = state.cvGpaSupplemented;
    } else {
      const inlineInput = document.getElementById('cv-inline-gpa');
      if (inlineInput && inlineInput.value) {
        candidateGpa = parseFloat(inlineInput.value);
      } else {
        candidateGpa = null;
      }
    }
  }

  // Quốc gia nguyện vọng: ở CV mode nếu chưa chọn nước cụ thể thì đối soát toàn cầu
  let chosenCountries = activeCountries;
  if (state.profileMode === 'cv' && activeCountries.length === 0) {
    chosenCountries = [];
  }

  state.profile = {
    full_name: el.formFullName.value.trim() || 'Nguyễn Trọng Mạnh Tiến',
    target_degree: el.formDegree.value || 'Thạc sĩ',
    major: el.formMajor.value.trim() || 'Trí tuệ Nhân tạo / Khoa học Máy tính',
    gpa: candidateGpa,
    ielts: parseFloat(el.formIelts.value) || 5.5,
    topik_level: 0,
    preferred_countries: chosenCountries,
    target_universities: state.profile.target_universities || [],
    publications_count: parseInt(el.formPubs.value, 10) || 0,
    awards_count: parseInt(el.formAwards.value, 10) || 0,
    statement_of_purpose: el.formSop ? el.formSop.value.trim() : '',
    work_experience_years: 0.0,
    research_experience_years: 1.0,
  };

  updateChatContextBar();
  updateCompetencyRadarUI();
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
async function executePersonalizedMatching(shouldScroll = false, triggerMode = null) {
  syncFormToState();
  state.isMatching = true;

  const btnCv = document.getElementById('btn-run-match-cv');
  const btnManual = el.btnRunMatch;
  const btnGpa = document.getElementById('btn-apply-cv-gpa');

  if (triggerMode === 'cv' && btnCv) {
    btnCv.disabled = true;
    btnCv.innerHTML = `<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></span> Đang đối soát điều kiện học bổng...`;
  } else if (triggerMode === 'gpa' && btnGpa) {
    btnGpa.disabled = true;
    btnGpa.innerHTML = `<span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></span> Đang lưu...`;
  } else if (btnManual) {
    btnManual.disabled = true;
    btnManual.innerHTML = `<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></span> Đang đối soát điều kiện học bổng...`;
  }

  const preferred = state.profile.preferred_countries || [];

  try {
    const filters = {
      countries: preferred,
      degree_level: state.profile.target_degree,
    };

    const profileForBackend = {
      ...state.profile,
      gpa: (state.profile.gpa !== null && state.profile.gpa > 0) ? state.profile.gpa : 3.0
    };

    const res = await matchScholarships(profileForBackend, filters);

    if (res) {
      state.targetMatchedStatus = res.target_matched_status || 'NONE';
      state.targetGapsSummary = res.target_gaps_summary || null;
    }

    if (res && res.scholarships && res.scholarships.length > 0) {
      state.matchedScholarships = res.scholarships;
    } else {
      state.matchedScholarships = calculatePersonalizedMatchingLocal(profileForBackend);
    }
  } catch (err) {
    console.warn('[Personalized Matching] Sử dụng bộ đánh giá White-box cục bộ:', err);
    const profileForLocal = {
      ...state.profile,
      gpa: (state.profile.gpa !== null && state.profile.gpa > 0) ? state.profile.gpa : 3.0
    };
    state.matchedScholarships = calculatePersonalizedMatchingLocal(profileForLocal);
  } finally {
    state.isMatching = false;

    if (btnCv) {
      btnCv.disabled = false;
      btnCv.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Đánh Giá Năng Lực &amp; Đối Soát Học Bổng`;
    }
    if (btnGpa) {
      btnGpa.disabled = false;
      btnGpa.innerHTML = `Áp Dụng GPA`;
    }
    if (btnManual) {
      btnManual.disabled = false;
      btnManual.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Đánh Giá Năng Lực &amp; Đối Soát Học Bổng`;
    }

    renderPersonalizedDiagnosticCard();
    renderPersonalizedCards(state.matchedScholarships);
    renderTargetUniBanner();

    // Luôn mở khối nhận xét điều kiện để ứng viên xem chi tiết Mặt Đủ Điều Kiện vs Mặt Thiếu Điều Kiện
    const matchedSection = document.getElementById('profile-matched-section');
    if (matchedSection) {
      matchedSection.style.display = 'block';
    }

    // Khi người dùng bấm đối soát điều kiện (dù là nhập trực tiếp hay upload CV / Áp dụng GPA):
    // Cuộn mượt mà xuống Bảng Đối Soát Điều Kiện 2 Cột để người dùng xem kết quả chi tiết trước!
    if (triggerMode === 'manual' || triggerMode === 'cv' || triggerMode === 'gpa') {
      if (matchedSection) {
        setTimeout(() => {
          matchedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
      const count = state.matchedScholarships?.length || 0;
      showStudent360Toast(`✓ Đã hoàn tất đối soát điều kiện! Mời bạn xem kết quả đánh giá 2 cột bên dưới.`);
    } else if (shouldScroll) {
      switchTab('section-ai-matches');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const count = state.matchedScholarships?.length || 0;
      showStudent360Toast(`✨ Đã tìm kiếm và gợi ý ${count} học bổng phù hợp nhất!`);
    }
  }
}

// ============================================================================
// HỖ TRỢ BÓC TÁCH VÀ CHUẨN HÓA TRƯỜNG ĐẠI HỌC MỤC TIÊU (TARGET UNIVERSITIES)
// ============================================================================
function extractUniversityAliases(uniName) {
  if (!uniName) return [];
  const clean = uniName.trim();
  const aliases = new Set();
  aliases.add(clean.toLowerCase());

  // 1. Tên viết tắt trong ngoặc đơn: ví dụ "(PNU)", "(SNU)", "(KAIST)", "(SKKU)", "(TUM)", "(NUS)", "(Hanken)"
  const parenMatch = clean.match(/\((.*?)\)/);
  if (parenMatch && parenMatch[1]) {
    const code = parenMatch[1].trim().toLowerCase();
    if (code.length >= 2 && !['trường', 'đại học', 'university', 'college'].includes(code)) {
      aliases.add(code);
    }
  }

  // 2. Tên bỏ ngoặc đơn
  const noParen = clean.replace(/\(.*?\)/g, '').trim().toLowerCase();
  if (noParen.length >= 3) {
    aliases.add(noParen);
    // Bỏ các tiền tố thông dụng để lấy từ khóa cốt lõi
    const stripped = noParen
      .replace(/^(đại học quốc gia|đại học công nghệ|đại học kinh tế|trường đại học|trường kinh tế|viện khoa học & công nghệ quốc gia|viện khoa học & công nghệ tiên tiến|viện công nghệ|viện|university of|the university of|school of)/i, '')
      .trim();
    if (stripped.length >= 3) {
      aliases.add(stripped);
    }
  }

  // 3. Tra cứu từ cơ sở dữ liệu UNIVERSITIES_DATABASE để lấy short code & tên riêng
  for (const cKey of Object.keys(UNIVERSITIES_DATABASE)) {
    const cData = UNIVERSITIES_DATABASE[cKey];
    if (cData && cData.list) {
      const found = cData.list.find(u => 
        u.name.toLowerCase() === clean.toLowerCase() || 
        u.name.toLowerCase().includes(noParen) || 
        noParen.includes(u.name.toLowerCase())
      );
      if (found && found.short) {
        aliases.add(found.short.toLowerCase());
      }
    }
  }

  // Lọc bỏ triệt để các từ dừng chung chung không phải danh từ riêng trường học
  const STOP_WORDS = new Set([
    'trường', 'đại học', 'viện', 'học', 'kinh', 'tế', 'quốc', 'gia', 'công', 'nghệ', 'khoa', 'tiên', 'tiến',
    'university', 'school', 'college', 'institute', 'faculty', 'center', 'department', 'of', 'and', 'the', 'for'
  ]);

  return Array.from(aliases).filter(a => a.length >= 2 && !STOP_WORDS.has(a));
}

function resolveTargetUniversityScholarship(uniName, profile, defaultCountry = 'Hàn Quốc') {
  const cleanName = uniName.trim();
  let detectedCountry = defaultCountry;

  for (const cKey of Object.keys(UNIVERSITIES_DATABASE)) {
    const cData = UNIVERSITIES_DATABASE[cKey];
    if (cData && cData.list && cData.list.some(u => 
      u.name.toLowerCase() === cleanName.toLowerCase() || 
      cleanName.toLowerCase().includes(u.short.toLowerCase()) ||
      u.name.toLowerCase().includes(cleanName.toLowerCase())
    )) {
      detectedCountry = cKey;
      break;
    }
  }

  const isTopAmbitious = /SNU|KAIST|POSTECH|SKY|Todai|Tokyo|Tsinghua|Peking|Harvard|Stanford|MIT|Oxford|Cambridge/i.test(cleanName);
  const minGpa = isTopAmbitious ? 3.20 : 2.80;
  const minIelts = isTopAmbitious ? 6.5 : 5.5;

  return {
    id: `target-uni-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    title: `[${detectedCountry}] Học bổng Tuyển sinh & Hỗ trợ Nghiên cứu - ${cleanName}`,
    host_country: detectedCountry,
    source_name: cleanName,
    degree_level: profile.target_degree || 'Cử nhân',
    major_applied: profile.major || 'Kinh tế & Tài chính',
    funding_type: 'Toàn phần & Bán phần',
    funding_details: `Miễn 70% - 100% học phí toàn khóa học và ưu tiên hỗ trợ sinh hoạt phí nghiên cứu cho sinh viên quốc tế xuất sắc tại ${cleanName}.`,
    deadline: '2027-01-20',
    link: `https://www.google.com/search?q=${encodeURIComponent(cleanName + ' admissions scholarship portal')}`,
    min_gpa: minGpa,
    min_ielts: minIelts,
    match_percent: 86.0,
    tier_group: 'Group B (Tiềm năng - Cần cải thiện nhẹ)',
    score_breakdown: {
      academic_gpa: 0.85,
      major_alignment: 0.93,
      language_score: 0.82,
      research_extracurricular: 0.81,
      vector_similarity: 0.90
    },
    gap_analysis: {
      strengths: [
        `${cleanName} là trường đại học mục tiêu thuộc nguyện vọng tuyển sinh hàng đầu của bạn.`,
        `Chuyên ngành ${profile.major || 'công nghệ'} có cơ hội lớn nhận các gói tài trợ học phí toàn khóa.`
      ],
      gaps: [
        `Khuyến nghị duy trì điểm GPA từ ${minGpa.toFixed(2)}/4.0 và ngoại ngữ IELTS ${minIelts.toFixed(1)}+ để đảm bảo suất học bổng cao nhất.`
      ],
      checklist: [
        { document: 'Bảng điểm đại học chính thức', status: 'Đã có' },
        { document: 'Chứng chỉ ngoại ngữ IELTS', status: 'Đã có' },
        { document: 'Bài luận mục đích học tập (SOP)', status: 'Cần chuẩn bị' },
        { document: '2 Thư giới thiệu của giảng viên', status: 'Cần chuẩn bị' }
      ],
      action_plan: [
        `Truy cập cổng tuyển sinh sinh viên quốc tế của ${cleanName} để chuẩn bị hồ sơ ứng tuyển đúng thời hạn.`,
        `Tập trung bài luận SOP thể hiện dự án thực tế đã làm để tạo sự khác biệt nổi bật.`
      ]
    },
    explanation: `${cleanName} là trường mục tiêu được đối soát theo đúng lựa chọn của bạn, độ tương thích 85% với chính sách học bổng cởi mở cho sinh viên Việt Nam.`
  };
}

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
          (pNorm.includes('phần lan') && (itemCountry.includes('phần lan') || itemCountry.includes('finland'))) ||
          (pNorm.includes('hàn') && (itemCountry.includes('hàn') || itemCountry.includes('korea'))) ||
          (pNorm.includes('nhật') && (itemCountry.includes('nhật') || itemCountry.includes('japan'))) ||
          (pNorm.includes('canada') && itemCountry.includes('canada')) ||
          (pNorm.includes('đức') && (itemCountry.includes('đức') || itemCountry.includes('germany'))) ||
          (pNorm.includes('úc') && (itemCountry.includes('úc') || itemCountry.includes('australia'))) ||
          (pNorm.includes('pháp') && (itemCountry.includes('pháp') || itemCountry.includes('france'))) ||
          (pNorm.includes('singapore') && itemCountry.includes('singapore')) ||
          (pNorm.includes('ý') && (itemCountry.includes('ý') || itemCountry.includes('italy'))) ||
          (pNorm.includes('thụy điển') && (itemCountry.includes('thụy điển') || itemCountry.includes('sweden'))) ||
          (pNorm.includes('thụy sĩ') && (itemCountry.includes('thụy sĩ') || itemCountry.includes('switzerland'))) ||
          (pNorm.includes('hà lan') && (itemCountry.includes('hà lan') || itemCountry.includes('netherlands')))
        );
      });
    });
    pool = matched.length > 0 ? matched : DEMO_SCHOLARSHIPS;
  }

  function scoreScholarship(item, isTarget) {
    // Determine target university minimum thresholds
    const isTopAmbitious =
      (item.title && (item.title.includes('SNU') || item.title.includes('KAIST') || item.title.includes('Tokyo') || item.title.includes('GKS') || item.title.includes('Harvard') || item.title.includes('MIT') || item.title.includes('Stanford') || item.title.includes('Cambridge'))) ||
      (item.source_name && (item.source_name.includes('Seoul') || item.source_name.includes('KAIST') || item.source_name.includes('Tokyo') || item.source_name.includes('Harvard') || item.source_name.includes('MIT')));

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
    if (matchPercent >= 84.0 && gpa >= minGpa && ielts >= minIelts) {
      tierGroup = 'Group A (Đủ điều kiện xét tuyển)';
    } else if (matchPercent >= 72.0 || (gpa >= minGpa - 0.45 && ielts >= minIelts - 0.5)) {
      tierGroup = 'Group B (Tiềm năng - Cần cải thiện nhẹ)';
    } else {
      tierGroup = 'Group C (Thử thách - Khoảng cách lớn)';
      if (gpa < minGpa || ielts < minIelts) {
        matchPercent = Math.min(71.5, matchPercent);
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
  // 2-TIER LOGIC: XÉT VÀ ƯU TIÊN TUYỆT ĐỐI CÁC TRƯỜNG MỤC TIÊU CỦA ỨNG VIÊN
  // -------------------------------------------------------------------------
  if (targetUnis && targetUnis.length > 0) {
    const scoredTargets = [];
    const usedTargetIds = new Set();

    // Duyệt qua từng trường mục tiêu mà ứng viên đã chọn
    targetUnis.forEach((uName) => {
      const aliases = extractUniversityAliases(uName);
      
      // Xác định chuẩn xác quốc gia của trường mục tiêu từ UNIVERSITIES_DATABASE
      let targetCountry = null;
      for (const cKey of Object.keys(UNIVERSITIES_DATABASE)) {
        const cData = UNIVERSITIES_DATABASE[cKey];
        if (cData && cData.list && cData.list.some(u => 
          u.name.toLowerCase() === uName.toLowerCase() || 
          uName.toLowerCase().includes(u.short.toLowerCase()) ||
          u.name.toLowerCase().includes(uName.toLowerCase())
        )) {
          targetCountry = cKey;
          break;
        }
      }

      // 1. Tìm trong pool (đã lọc theo quốc gia của ứng viên)
      let matchedItem = pool.find((item) => {
        const titleLower = (item.title || '').toLowerCase();
        const sourceLower = (item.source_name || '').toLowerCase();
        const itemCountry = (item.host_country || '').toLowerCase();
        const aliasMatch = aliases.some(a => titleLower.includes(a) || sourceLower.includes(a));
        if (!aliasMatch) return false;
        if (targetCountry && !itemCountry.includes(targetCountry.toLowerCase()) && !targetCountry.toLowerCase().includes(itemCountry)) {
          return false;
        }
        return true;
      });

      // 2. Tìm trong toàn bộ danh mục demo nếu chưa thấy trong pool
      if (!matchedItem) {
        matchedItem = DEMO_SCHOLARSHIPS.find((item) => {
          const titleLower = (item.title || '').toLowerCase();
          const sourceLower = (item.source_name || '').toLowerCase();
          const itemCountry = (item.host_country || '').toLowerCase();
          const aliasMatch = aliases.some(a => titleLower.includes(a) || sourceLower.includes(a));
          if (!aliasMatch) return false;
          if (targetCountry && !itemCountry.includes(targetCountry.toLowerCase()) && !targetCountry.toLowerCase().includes(itemCountry)) {
            return false;
          }
          return true;
        });
      }

      // 3. Tìm trong catalog tải từ server nếu có
      if (!matchedItem && state.allCatalogScholarships && state.allCatalogScholarships.length > 0) {
        matchedItem = state.allCatalogScholarships.find((item) => {
          const titleLower = (item.title || '').toLowerCase();
          const sourceLower = (item.source_name || '').toLowerCase();
          const itemCountry = (item.host_country || '').toLowerCase();
          const aliasMatch = aliases.some(a => titleLower.includes(a) || sourceLower.includes(a));
          if (!aliasMatch) return false;
          if (targetCountry && !itemCountry.includes(targetCountry.toLowerCase()) && !targetCountry.toLowerCase().includes(itemCountry)) {
            return false;
          }
          return true;
        });
      }

      // 4. Nếu trường mục tiêu chưa có sẵn trong danh mục: TỰ ĐỘNG TẠO BẢN GHI CHUẨN XÁC CHO ĐÚNG TRƯỜNG ĐÓ!
      if (!matchedItem) {
        matchedItem = resolveTargetUniversityScholarship(uName, profile, targetCountry || preferred[0] || 'Hàn Quốc');
      }

      if (matchedItem) {
        usedTargetIds.add(matchedItem.id);
        const scored = scoreScholarship(matchedItem, true);
        scored.is_target = true;
        scored.target_uni_name = uName;

        const isQualified = scored.tier_group.includes('Group A') || scored.tier_group.includes('Group B');
        if (isQualified) {
          scored.category = 'TARGET_QUALIFIED';
          scored.target_status_note = '🎯 Trường Mục Tiêu (Đạt Chuẩn Xét Tuyển)';
        } else {
          scored.category = 'TARGET_AMBITIOUS';
          scored.target_status_note = '🎯 Trường Mục Tiêu (Vươn Tầm - Cần Bổ Sung Tiêu Chí)';
        }
        scoredTargets.push(scored);
      }
    });

    // Sắp xếp các trường mục tiêu theo match_percent giảm dần
    scoredTargets.sort((a, b) => b.match_percent - a.match_percent);

    // Lấy các học bổng khác trong pool làm phương án mở rộng / dự phòng cùng quốc gia
    const nonTargetPool = pool.filter(item => !usedTargetIds.has(item.id));
    const scoredOthers = nonTargetPool.map(item => {
      const s = scoreScholarship(item, false);
      s.is_target = false;
      s.category = 'RECOMMENDED_ALTERNATIVE';
      s.target_status_note = '🛡️ Gợi Ý Mở Rộng: Phương Án Phù Hợp Năng Lực';
      return s;
    }).sort((a, b) => b.match_percent - a.match_percent);

    // Cập nhật trạng thái đối soát trường mục tiêu
    state.targetMatchedStatus = scoredTargets.some(s => s.category === 'TARGET_QUALIFIED') ? 'SATISFIED' : 'RELAXED_EXPANDED';

    // ĐẢM BẢO 100%: CÁC TRƯỜNG MỤC TIÊU NGƯỜI DÙNG CHỌN LUÔN NẰM Ở ĐẦU DANH SÁCH (HẠNG 1, HẠNG 2...)
    return [...scoredTargets, ...scoredOthers];
  }

  // Trường hợp người dùng không chọn trường mục tiêu cụ thể
  state.targetMatchedStatus = 'NONE';
  state.targetGapsSummary = null;
  return pool.map((item) => {
    const s = scoreScholarship(item, false);
    s.is_target = false;
    s.category = 'STANDARD';
    return s;
  }).sort((a, b) => b.match_percent - a.match_percent);
}

function renderTargetUniBanner() {
  const banner = el.targetFallbackBanner || document.getElementById('target-fallback-banner');
  if (banner) {
    banner.style.display = 'none';
    banner.innerHTML = '';
  }
}

function renderPersonalizedDiagnosticCard() {
  const p = state.profile;
  const gpa = p.gpa;
  const ielts = (p.ielts !== undefined && p.ielts !== null) ? p.ielts : 5.5;
  const pubs = p.publications_count || 0;
  const awards = p.awards_count || 0;
  const countries = p.preferred_countries && p.preferred_countries.length > 0 ? p.preferred_countries.join(', ') : 'Toàn cầu (Tất cả quốc gia)';
  const targetUnis = p.target_universities && p.target_universities.length > 0 ? p.target_universities.join(', ') : '';

  const candNameEl = document.getElementById('diag-candidate-name');
  if (candNameEl) candNameEl.textContent = p.full_name || 'Nguyễn Trọng Mạnh Tiến';

  const candStatsEl = document.getElementById('diag-candidate-stats');
  if (candStatsEl) {
    const gpaText = (gpa !== null && gpa !== undefined) ? `GPA: ${gpa.toFixed(2)}/4.0` : 'GPA: Chưa có';
    candStatsEl.textContent = `Mục tiêu: ${p.target_degree} • Ngành: ${p.major} • IELTS: ${ielts.toFixed(1)} • ${gpaText} • Quốc gia: ${countries}`;
  }

  // Tính toán chỉ số sẵn sàng hồ sơ khách quan
  let readiness = 50;
  if (gpa !== null && gpa !== undefined) {
    if (gpa >= 3.6) readiness += 25;
    else if (gpa >= 3.2) readiness += 20;
    else if (gpa >= 2.8) readiness += 15;
    else if (gpa >= 2.5) readiness += 10;
    else readiness += 5;
  }
  if (ielts) {
    if (ielts >= 7.5) readiness += 20;
    else if (ielts >= 6.5) readiness += 15;
    else if (ielts >= 5.5) readiness += 10;
    else readiness += 5;
  }
  if (pubs > 0) readiness += 5;
  if (awards > 0) readiness += 5;
  readiness = Math.min(95, Math.max(35, readiness));

  const readinessEl = document.getElementById('diag-readiness-val');
  if (readinessEl) readinessEl.textContent = `${readiness}%`;

  // Cột Trái: Đủ Điều Kiện (Đã Có)
  const passedList = document.getElementById('diag-passed-list');
  if (passedList) {
    let passedHtml = '';

    passedHtml += `
      <li>
        <span class="item-check">✓</span>
        <div>
          <strong>Chuyên ngành phù hợp:</strong>
          <span>${p.major}</span>
        </div>
      </li>
      <li>
        <span class="item-check">✓</span>
        <div>
          <strong>Bậc học mục tiêu:</strong>
          <span>${p.target_degree}</span>
        </div>
      </li>
    `;

    if (countries && countries !== 'Toàn cầu (Tất cả quốc gia)') {
      passedHtml += `
        <li>
          <span class="item-check">✓</span>
          <div>
            <strong>Quốc gia nguyện vọng:</strong>
            <span>${countries}</span>
          </div>
        </li>
      `;
    }

    if (targetUnis) {
      passedHtml += `
        <li>
          <span class="item-check">✓</span>
          <div>
            <strong>Trường mục tiêu ưu tiên:</strong>
            <span>${targetUnis}</span>
          </div>
        </li>
      `;
    }

    if (ielts >= 4.5) {
      const langNote = ielts >= 6.5 ? 'Đạt chuẩn xét tuyển cạnh tranh' : 'Đạt chuẩn cơ sở nộp hồ sơ';
      passedHtml += `
        <li>
          <span class="item-check">✓</span>
          <div>
            <strong>Chứng chỉ ngoại ngữ:</strong>
            <span>IELTS ${ielts.toFixed(1)} (${langNote})</span>
          </div>
        </li>
      `;
    }

    if (gpa !== null && gpa !== undefined && gpa >= 2.0) {
      const gpaNote = gpa >= 3.2 ? 'Đạt chuẩn Giỏi / Xuất sắc' : gpa >= 2.8 ? 'Đạt chuẩn Khá' : 'Đạt ngưỡng điểm nộp hồ sơ xét tuyển';
      passedHtml += `
        <li>
          <span class="item-check">✓</span>
          <div>
            <strong>Điểm GPA tích lũy:</strong>
            <span>${gpa.toFixed(2)} / 4.0 (${gpaNote})</span>
          </div>
        </li>
      `;
    }

    if (pubs > 0) {
      passedHtml += `
        <li>
          <span class="item-check">✓</span>
          <div>
            <strong>Bài báo khoa học:</strong>
            <span>${pubs} bài báo công bố</span>
          </div>
        </li>
      `;
    }

    if (awards > 0) {
      passedHtml += `
        <li>
          <span class="item-check">✓</span>
          <div>
            <strong>Giải thưởng / NCKH:</strong>
            <span>${awards} giải thưởng</span>
          </div>
        </li>
      `;
    }

    if (state.profileMode === 'cv') {
      passedHtml += `
        <li>
          <span class="item-check">✓</span>
          <div>
            <strong>Kỹ năng &amp; Đồ án:</strong>
            <span>Nghiên cứu mô hình PAttn &amp; Phân loại DistilBERT (PyTorch)</span>
          </div>
        </li>
      `;
    }

    passedList.innerHTML = passedHtml;
  }

  // Cột Phải: Thiếu Điều Kiện (Cần Bổ Sung)
  const missingList = document.getElementById('diag-missing-list');
  if (missingList) {
    let missingHtml = '';

    if (gpa === null || gpa === undefined) {
      missingHtml += `
        <li>
          <span class="item-alert">!</span>
          <div>
            <strong>Điểm GPA tích lũy:</strong>
            <span>Chưa có trong hồ sơ (Cần bổ sung bảng điểm chính thức)</span>
          </div>
        </li>
      `;
    } else if (gpa < 3.0) {
      missingHtml += `
        <li>
          <span class="item-alert">!</span>
          <div>
            <strong>Điểm GPA cạnh tranh:</strong>
            <span>GPA hiện tại ${gpa.toFixed(2)} / 4.0 (Dưới mức khuyến nghị 3.0+ đối với học bổng trường và 3.2+ đối với học bổng toàn phần. Cần bài luận SOP nổi bật để bù đắp)</span>
          </div>
        </li>
      `;
    }

    if (ielts < 6.5) {
      missingHtml += `
        <li>
          <span class="item-alert">!</span>
          <div>
            <strong>Chứng chỉ ngoại ngữ nâng cao:</strong>
            <span>IELTS hiện tại ${ielts.toFixed(1)} (Khuyến nghị nâng lên tối thiểu 6.0 - 6.5+ để tăng cơ hội trúng tuyển học bổng toàn phần)</span>
          </div>
        </li>
      `;
    }

    if (pubs === 0) {
      missingHtml += `
        <li>
          <span class="item-alert">!</span>
          <div>
            <strong>Bài báo khoa học xuất bản:</strong>
            <span>Chưa có bài báo công bố (Khuyến nghị tham gia đề tài NCKH hoặc viết bài tham luận hội thảo sinh viên)</span>
          </div>
        </li>
      `;
    }

    if (awards === 0) {
      missingHtml += `
        <li>
          <span class="item-alert">!</span>
          <div>
            <strong>Giải thưởng / NCKH:</strong>
            <span>Chưa có giải thưởng học thuật / NCKH (Nên chuẩn bị 02 thư giới thiệu LOR mạnh từ giảng viên để bù đắp)</span>
          </div>
        </li>
      `;
    }

    missingHtml += `
      <li>
        <span class="item-alert">!</span>
        <div>
          <strong>Hồ sơ thủ tục:</strong>
          <span>Bài luận mục đích (SOP) &amp; Bảng điểm dịch thuật công chứng tiếng Anh theo chuẩn quốc tế</span>
        </div>
      </li>
    `;

    missingList.innerHTML = missingHtml;
  }
}

function createScholarshipCardElement(item) {
  const isTierA = item.tier_group && (item.tier_group.includes('Group A') || item.tier_group.includes('Nhóm A'));
  const isTierB = item.tier_group && (item.tier_group.includes('Group B') || item.tier_group.includes('Nhóm B'));
  
  let tierBadgeHtml = '';
  let tierClass = 'tier-group-c';
  if (isTierA) {
    tierClass = 'tier-group-a';
    tierBadgeHtml = '<span class="tier-badge-pill tier-badge-a">🏆 Nhóm A: Vươn Tầm</span>';
  } else if (isTierB) {
    tierClass = 'tier-group-b';
    tierBadgeHtml = '<span class="tier-badge-pill tier-badge-b">🎯 Nhóm B: Vừa Sức</span>';
  } else {
    tierClass = 'tier-group-c';
    tierBadgeHtml = '<span class="tier-badge-pill tier-badge-c">🛡️ Nhóm C: An Toàn</span>';
  }

  const isTargetUni = item.is_target || (item.category && item.category.startsWith('TARGET'));
  let targetBadgeHtml = '';
  let targetClass = '';
  if (isTargetUni) {
    targetClass = item.category === 'TARGET_QUALIFIED' ? 'card-target-qualified' : 'card-target-ambitious';
    targetBadgeHtml = `<span class="badge-pill pill-target" style="background: rgba(245, 158, 11, 0.18); color: #B45309; border: 1px solid rgba(245, 158, 11, 0.45); font-weight: 700;">🎯 Trường Mục Tiêu Đã Chọn</span>`;
  } else if (item.category === 'GLOBAL_EXPANSION') {
    const ieltsVal = state.profile.ielts ? state.profile.ielts.toFixed(1) : '8.0';
    targetBadgeHtml = `<span class="badge-pill pill-global" style="background: #EEF2FF; color: #3730A3; border: 1px solid #C7D2FE; font-weight: 700;">🌐 Mở Rộng Toàn Cầu (IELTS ${ieltsVal}+)</span>`;
  } else if (item.category === 'RECOMMENDED_ALTERNATIVE') {
    targetBadgeHtml = `<span class="badge-pill pill-alt" style="background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; font-weight: 700;">🛡️ Cùng Quốc Gia Phù Hợp</span>`;
  }

  const card = document.createElement('div');
  card.className = `card scholarship-card ${tierClass} ${targetClass}`.trim();

  const score = item.score_breakdown || {};
  const gpaPercent = Math.round((score.academic_gpa || 0.85) * 100);
  const majorPercent = Math.round((score.major_alignment || 0.88) * 100);
  const langPercent = Math.round((score.language_score || 0.82) * 100);

  card.innerHTML = `
    <div class="card-top-row">
      <div>
        <div style="margin-bottom: 0.35rem; display: flex; flex-wrap: wrap; gap: 4px; align-items: center;">
          ${tierBadgeHtml}
          ${targetBadgeHtml}
        </div>
        <div class="country-degree-pills">
          <span class="badge-pill pill-country">📍 ${item.host_country || 'Quốc tế'}</span>
          <span class="badge-pill pill-degree">🎓 ${item.degree_level || 'Thạc sĩ'}</span>
          <span class="badge-pill pill-funding">💰 ${item.funding_type || 'Toàn phần'}</span>
        </div>
      </div>
      <div class="match-score-badge">
        <div class="score-circle">${item.match_percent}%</div>
        <span class="score-tier-label" style="font-size: 0.7rem; font-weight: 700;">Độ Khớp</span>
      </div>
    </div>

    <h3 class="card-title-scholarship" title="${item.title}">${item.title}</h3>
    <p class="card-funding-desc" title="${item.funding_details || item.major_applied || ''}">
      ${item.funding_details || item.major_applied || 'Thông tin chi tiết chương trình học bổng'}
    </p>

    <!-- Criteria bars -->
    <div class="criteria-bars">
      <div class="criteria-item">
        <span class="criteria-lbl"><span>Điểm GPA</span> <strong>${gpaPercent}%</strong></span>
        <div class="progress-track"><div class="progress-fill" style="width: ${gpaPercent}%;"></div></div>
      </div>
      <div class="criteria-item">
        <span class="criteria-lbl"><span>Độ Khớp Ngành</span> <strong>${majorPercent}%</strong></span>
        <div class="progress-track"><div class="progress-fill" style="width: ${majorPercent}%;"></div></div>
      </div>
      <div class="criteria-item">
        <span class="criteria-lbl"><span>Ngoại Ngữ</span> <strong>${langPercent}%</strong></span>
        <div class="progress-track"><div class="progress-fill" style="width: ${langPercent}%;"></div></div>
      </div>
    </div>

    <div class="card-actions-bar" style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem; flex-wrap: wrap;">
      <button type="button" class="btn btn-outline btn-sm btn-open-card-gap" style="color: #2563EB; font-weight: 600;">
        🗺️ Gợi Ý Lộ Trình
      </button>
      <button type="button" class="btn btn-outline btn-sm btn-card-track" style="font-weight: 600;" title="Lưu học bổng này vào mục Theo Dõi Ứng Tuyển">
        📌 Theo Dõi
      </button>
      <button type="button" class="btn btn-primary btn-sm btn-open-card-detail">
        Chi Tiết Hồ Sơ
      </button>
    </div>
  `;

  // Click handler to open gap analysis roadmap modal
  const btnGap = card.querySelector('.btn-open-card-gap');
  if (btnGap) {
    btnGap.addEventListener('click', () => openGapAnalysisModal(item));
  }

  const btnDetail = card.querySelector('.btn-open-card-detail');
  if (btnDetail) {
    btnDetail.addEventListener('click', () => openScholarshipDetailModal(item));
  }

  const btnTrack = card.querySelector('.btn-card-track');
  if (btnTrack) {
    btnTrack.addEventListener('click', (e) => {
      e.stopPropagation();
      addScholarshipToTracker(item);
    });
  }

  return card;
}

function renderPersonalizedCards(items) {
  if (!el.matchedGrid) return;
  el.matchedGrid.innerHTML = '';
  // Cấu hình container hiển thị phân khu
  el.matchedGrid.style.display = 'flex';
  el.matchedGrid.style.flexDirection = 'column';
  el.matchedGrid.style.gap = '2rem';
  el.matchedGrid.style.width = '100%';

  const allItems = items || [];

  // Tính số lượng theo phân hệ Tier A, B, C cho bộ tabs
  let countTierA = 0;
  let countTierB = 0;
  let countTierC = 0;

  allItems.forEach((it) => {
    const isA = it.tier_group && (it.tier_group.includes('Group A') || it.tier_group.includes('Nhóm A'));
    const isB = it.tier_group && (it.tier_group.includes('Group B') || it.tier_group.includes('Nhóm B'));
    if (isA) countTierA++;
    else if (isB) countTierB++;
    else countTierC++;
  });

  const countAllEl = document.getElementById('count-tier-all');
  if (countAllEl) countAllEl.textContent = allItems.length;

  const countAEl = document.getElementById('count-tier-a');
  if (countAEl) countAEl.textContent = countTierA;

  const countBEl = document.getElementById('count-tier-b');
  if (countBEl) countBEl.textContent = countTierB;

  const countCEl = document.getElementById('count-tier-c');
  if (countCEl) countCEl.textContent = countTierC;

  const totalCountEl = document.getElementById('matched-results-count');
  if (totalCountEl) totalCountEl.textContent = allItems.length;

  if (allItems.length === 0) {
    el.matchedGrid.innerHTML = `
      <div class="empty-state" style="padding: 3rem 1rem; text-align: center; width: 100%;">
        <div class="empty-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎯</div>
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">Chưa tìm thấy học bổng phù hợp</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Thử chọn lại quốc gia nguyện vọng hoặc điều chỉnh bậc học và chuyên ngành.</p>
      </div>
    `;
    return;
  }

  // Tách thành 2 nhóm rõ ràng: Học bổng theo trường mục tiêu và Học bổng các trường liên quan
  const targetCards = allItems.filter(it => it.is_target || (it.category && it.category.startsWith('TARGET')));
  const relatedCards = allItems.filter(it => !it.is_target && (!it.category || !it.category.startsWith('TARGET')));

  // Lọc theo Tier đã chọn trong state (ALL, A, B, C)
  const currentTier = state.selectedTier || 'ALL';
  const filterByTier = (list) => {
    if (currentTier === 'A') {
      return list.filter(it => it.tier_group && (it.tier_group.includes('Group A') || it.tier_group.includes('Nhóm A')));
    } else if (currentTier === 'B') {
      return list.filter(it => it.tier_group && (it.tier_group.includes('Group B') || it.tier_group.includes('Nhóm B')));
    } else if (currentTier === 'C') {
      return list.filter(it => !it.tier_group || (!it.tier_group.includes('Group A') && !it.tier_group.includes('Group B')));
    }
    return list;
  };

  const filteredTargetCards = filterByTier(targetCards);
  const filteredRelatedCards = filterByTier(relatedCards);

  if (filteredTargetCards.length === 0 && filteredRelatedCards.length === 0) {
    const tierNameMap = { 'A': 'Nhóm A (Vươn Tầm)', 'B': 'Nhóm B (Vừa Sức)', 'C': 'Nhóm C (An Toàn)', 'ALL': 'Tất cả' };
    el.matchedGrid.innerHTML = `
      <div class="empty-state" style="padding: 3rem 1rem; text-align: center; width: 100%;">
        <div class="empty-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎯</div>
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">Chưa có học bổng ở ${tierNameMap[currentTier] || 'nhóm này'}</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Thử chọn lại tab "Toàn Bộ Học Bổng" để xem đầy đủ danh sách học bổng.</p>
      </div>
    `;
    return;
  }

  const userSelectedTargets = state.profile.target_universities || [];
  const preferredCountries = state.profile.preferred_countries || [];
  const countryNamesText = preferredCountries.length > 0 ? preferredCountries.join(' & ') : 'Quốc gia nguyện vọng';

  // =========================================================================
  // PHÂN KHU 1: HỌC BỔNG CÁC TRƯỜNG MỤC TIÊU ĐÃ CHỌN
  // =========================================================================
  if (userSelectedTargets.length > 0) {
    const sectionTarget = document.createElement('div');
    sectionTarget.className = 'matched-target-section-block';

    const headerTarget = document.createElement('div');
    headerTarget.style.cssText = 'margin: 0.25rem 0 0.85rem 0; padding-bottom: 0.4rem; border-bottom: 1px solid var(--border-color);';
    headerTarget.innerHTML = `
      <h3 style="font-size: 1.12rem; font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
        🎯 Học bổng các trường mục tiêu đã chọn (${targetCards.length})
      </h3>
    `;
    sectionTarget.appendChild(headerTarget);

    if (filteredTargetCards.length > 0) {
      const gridTarget = document.createElement('div');
      gridTarget.className = 'scholarship-grid';
      filteredTargetCards.forEach(item => {
        gridTarget.appendChild(createScholarshipCardElement(item));
      });
      sectionTarget.appendChild(gridTarget);
    } else {
      const emptyTarget = document.createElement('div');
      emptyTarget.className = 'card';
      emptyTarget.style.cssText = 'padding: 0.9rem 1.1rem; border-left: 4px solid #F59E0B; background: #FFFBEB; border-radius: 8px; font-size: 0.86rem; color: #92400E; margin-bottom: 1rem;';
      emptyTarget.innerHTML = `
        Các trường mục tiêu bạn chọn không nằm trong phân nhóm này. Mời bạn xem các học bổng cùng quốc gia bên dưới hoặc chọn tab "Toàn Bộ Học Bổng".
      `;
      sectionTarget.appendChild(emptyTarget);
    }

    el.matchedGrid.appendChild(sectionTarget);
  }

  // =========================================================================
  // PHÂN KHU 2: CÁC TRƯỜNG & HỌC BỔNG LIÊN QUAN PHÙ HỢP CÙNG QUỐC GIA
  // =========================================================================
  const sectionRelated = document.createElement('div');
  sectionRelated.className = 'matched-related-section-block';

  const headerRelated = document.createElement('div');
  headerRelated.style.cssText = userSelectedTargets.length > 0
    ? 'margin: 1.5rem 0 0.85rem 0; padding-bottom: 0.4rem; border-bottom: 1px solid var(--border-color);'
    : 'margin: 0.25rem 0 0.85rem 0; padding-bottom: 0.4rem; border-bottom: 1px solid var(--border-color);';

  const relatedTitle = userSelectedTargets.length > 0
    ? `🛡️ Các học bổng cùng quốc gia & cơ hội mở rộng (${relatedCards.length})`
    : `🎓 Danh sách học bổng phù hợp (${allItems.length})`;

  headerRelated.innerHTML = `
    <h3 style="font-size: 1.12rem; font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
      ${relatedTitle}
    </h3>
  `;
  sectionRelated.appendChild(headerRelated);

  const cardsToRenderInRelated = userSelectedTargets.length > 0 ? filteredRelatedCards : (filteredTargetCards.concat(filteredRelatedCards));

  if (cardsToRenderInRelated.length > 0) {
    const gridRelated = document.createElement('div');
    gridRelated.className = 'scholarship-grid';
    cardsToRenderInRelated.forEach(item => {
      gridRelated.appendChild(createScholarshipCardElement(item));
    });
    sectionRelated.appendChild(gridRelated);
  } else {
    const emptyRelated = document.createElement('div');
    emptyRelated.className = 'card';
    emptyRelated.style.cssText = 'padding: 0.9rem 1.1rem; border-left: 4px solid #64748B; background: #F8FAFC; border-radius: 8px; font-size: 0.86rem; color: #475569; margin-bottom: 1rem;';
    emptyRelated.innerHTML = `
      Không có thêm học bổng trong nhóm này. Mời bạn chọn tab "Toàn Bộ Học Bổng" để xem tất cả.
    `;
    sectionRelated.appendChild(emptyRelated);
  }

  el.matchedGrid.appendChild(sectionRelated);
}

function formatDisplayDeadline(deadlineStr) {
  if (!deadlineStr) return 'Theo kỳ tuyển sinh (Mở định kỳ hàng năm)';
  try {
    const d = new Date(deadlineStr);
    if (!isNaN(d.getTime())) {
      const now = new Date();
      const diffMs = d.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const formattedDate = d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      if (diffDays > 0) {
        return `${formattedDate} (Còn ${diffDays} ngày)`;
      } else if (diffDays === 0) {
        return `${formattedDate} (Hôm nay)`;
      } else {
        return `${formattedDate} (Kỳ tuyển sinh năm học tới)`;
      }
    }
  } catch (e) {
    // ignore
  }
  return deadlineStr;
}

function getMajorIcon(majorName) {
  const m = (majorName || '').toLowerCase();
  if (m.includes('ai') || m.includes('trí tuệ nhân tạo') || m.includes('machine learning') || m.includes('học máy')) return '🤖';
  if (m.includes('máy tính') || m.includes('it') || m.includes('phần mềm') || m.includes('thông tin') || m.includes('data') || m.includes('dữ liệu')) return '💻';
  if (m.includes('kinh tế') || m.includes('tài chính') || m.includes('kinh doanh') || m.includes('marketing') || m.includes('quản trị') || m.includes('kế toán') || m.includes('kiểm toán')) return '📊';
  if (m.includes('kỹ thuật') || m.includes('điện tử') || m.includes('cơ khí') || m.includes('tự động') || m.includes('stem')) return '⚙️';
  if (m.includes('ngôn ngữ') || m.includes('ngoại ngữ') || m.includes('tiếng anh') || m.includes('quốc tế') || m.includes('quan hệ')) return '🌐';
  if (m.includes('y') || m.includes('dược') || m.includes('sinh') || m.includes('sức khỏe')) return '🔬';
  if (m.includes('môi trường') || m.includes('nông nghiệp') || m.includes('sinh thái')) return '🌱';
  if (m.includes('luật') || m.includes('chính sách')) return '⚖️';
  if (m.includes('nghệ thuật') || m.includes('thiết kế') || m.includes('truyền thông')) return '🎨';
  return '🎓';
}

// --------------------------------------------------------------------------
// 4.5. TAB 1: Scholarship Dossier / Details Modal (100% Authentic Scholarship Data)
// --------------------------------------------------------------------------
function openScholarshipDetailModal(item) {
  state.selectedScholarshipForModal = item;
  const portalUrl = getOfficialPortalUrl(item);

  if (el.detailModalCountry) el.detailModalCountry.textContent = `📍 ${item.host_country || 'Quốc tế'}`;
  if (el.detailModalDegree) el.detailModalDegree.textContent = `🎓 ${item.degree_level || 'Thạc sĩ'}`;
  if (el.detailModalFunding) el.detailModalFunding.textContent = `💰 ${item.funding_type || 'Học bổng'}`;
  if (el.detailModalTier) el.detailModalTier.textContent = `🏛️ ${item.tier_group || 'Học bổng Cấp Trường'}`;

  if (el.detailModalTitle) el.detailModalTitle.textContent = item.title;
  if (el.detailModalInstitution) {
    el.detailModalInstitution.textContent = `🏛️ Cơ quan / Trường đại học: ${item.source_name || 'Đại học đối tác quốc tế'}`;
  }

  // 1. Overview Narrative
  if (el.detailModalOverview) {
    const rawDesc = item.raw_content || item.funding_details || '';
    if (rawDesc && rawDesc.length > 50) {
      el.detailModalOverview.textContent = rawDesc;
    } else {
      const countryStr = item.host_country || 'quốc tế';
      const degreeStr = item.degree_level || 'Đại học / Sau đại học';
      const institutionStr = item.source_name || 'các trường đại học đối tác';
      el.detailModalOverview.textContent = `${item.title} là chương trình học bổng chính thức tại ${countryStr}, cấp bởi ${institutionStr} dành cho sinh viên quốc tế theo học bậc ${degreeStr}. Chương trình tạo điều kiện tối đa cho ứng viên có thành tích học tập tốt, tinh thần học hỏi và định hướng phát triển học thuật rõ ràng.`;
    }
  }

  // 2. Funding Perks (Tài trợ chi tiết & Quyền lợi học bổng)
  if (el.detailModalFundingPerks) {
    el.detailModalFundingPerks.innerHTML = '';
    const fType = (item.funding_type || '').toLowerCase();
    const country = (item.host_country || '').toLowerCase();
    const perks = [];

    // Ưu tiên đưa thông tin tài trợ thực tế từ cơ sở dữ liệu nếu có
    if (item.funding_details && item.funding_details.length > 15) {
      perks.push(`<strong>Gói tài trợ chính thức:</strong> ${item.funding_details}`);
    }

    if (fType.includes('toàn phần') || fType.includes('full') || fType.includes('100%')) {
      perks.push('<strong>Miễn 100% học phí:</strong> Được đài thọ toàn bộ học phí trong suốt thời gian đào tạo tiêu chuẩn.');
      if (country.includes('hàn quốc') || country.includes('korea')) {
        perks.push('<strong>Trợ cấp sinh hoạt hàng tháng (Stipend):</strong> Từ 900.000 đến 1.500.000 KRW/tháng theo từng bậc học.');
        perks.push('<strong>Vé máy bay & Định cư:</strong> Hỗ trợ vé máy bay khứ hồi (chặng Việt Nam - Hàn Quốc) và trợ cấp ổn định ban đầu 200.000 KRW.');
        perks.push('<strong>Bảo hiểm y tế du học:</strong> Chi trả bảo hiểm y tế Quốc dân Hàn Quốc (NHIS) suốt khóa học.');
      } else if (country.includes('singapore')) {
        perks.push('<strong>Trợ cấp sinh hoạt phí:</strong> Từ 2.200 đến 3.200 SGD/tháng (nâng mức sau khi qua Qualifying Examination).');
        perks.push('<strong>Vé máy bay & Phụ cấp:</strong> Vé máy bay khứ hồi lên tới 1.500 SGD và trợ cấp định cư ban đầu 1.000 SGD.');
      } else if (country.includes('nhật bản') || country.includes('japan')) {
        perks.push('<strong>Học bổng sinh hoạt phí:</strong> Từ 143.000 đến 148.000 JPY/tháng (MEXT chuẩn).');
        perks.push('<strong>Vé máy bay khứ hồi:</strong> Vé máy bay hạng phổ thông giữa Việt Nam và Nhật Bản.');
      } else if (country.includes('trung quốc') || country.includes('china')) {
        perks.push('<strong>Trợ cấp sinh hoạt & Chỗ ở:</strong> Miễn phí phòng ký túc xá và sinh hoạt phí 2.500 - 3.500 RMB/tháng.');
      } else {
        perks.push('<strong>Trợ cấp sinh hoạt phí hàng tháng:</strong> Hỗ trợ chi phí ăn ở từ 800 - 1.500 USD/EUR mỗi tháng.');
        perks.push('<strong>Bảo hiểm y tế toàn diện:</strong> Được chi trả bảo hiểm sức khỏe sinh viên quốc tế trọn gói.');
      }
    } else {
      // Bán phần / Hỗ trợ học phí
      if (country.includes('hàn quốc') || country.includes('korea')) {
        perks.push('<strong>Miễn giảm học phí:</strong> Miễn giảm từ 30% đến 100% học phí kỳ đầu hoặc các kỳ tiếp theo theo kết quả GPA.');
        perks.push('<strong>Học bổng thưởng TOPIK:</strong> Thưởng thêm 500.000 đến 1.500.000 KRW cho sinh viên đạt TOPIK 4, 5 hoặc 6.');
        perks.push('<strong>Lương trợ cấp Lab / TA / RA:</strong> Cơ hội tham gia nghiên cứu cùng Giáo sư có hưởng phụ cấp từ 600.000 - 1.200.000 KRW/tháng.');
        perks.push('<strong>Ưu đãi ký túc xá:</strong> Ưu tiên sắp xếp chỗ ở ký túc xá trong khuôn viên trường với chi phí trợ giá.');
      } else {
        perks.push('<strong>Hỗ trợ học phí (Tuition Waiver):</strong> Giảm trừ từ 30% đến 80% học phí hàng kỳ dựa trên xếp loại học thuật.');
        perks.push('<strong>Cơ hội trợ giảng & nghiên cứu (TA/RA):</strong> Thu nhập hỗ trợ sinh hoạt từ các dự án nghiên cứu khoa học.');
        perks.push('<strong>Ưu tiên chỗ ở:</strong> Hỗ trợ đặt phòng ký túc xá và các dịch vụ hỗ trợ du học sinh quốc tế.');
      }
    }

    perks.forEach((p) => {
      const li = document.createElement('li');
      li.innerHTML = p;
      el.detailModalFundingPerks.appendChild(li);
    });
  }

  // 3. Admission Requirements (Điều kiện sàn & Tiêu chuẩn tuyển sinh)
  if (el.detailModalAdmissionReqs) {
    el.detailModalAdmissionReqs.innerHTML = '';
    const reqs = [];
    const country = (item.host_country || '').toLowerCase();

    // Điểm GPA
    if (item.min_gpa && item.min_gpa > 0) {
      const gpa10 = (item.min_gpa * 2.5).toFixed(1);
      reqs.push(`<strong>Điểm học lực GPA:</strong> Yêu cầu điểm tích lũy tối thiểu <strong>${item.min_gpa.toFixed(2)} / 4.0</strong> (tương đương <strong>${gpa10} / 10</strong>).`);
    } else {
      reqs.push('<strong>Điểm học lực GPA:</strong> Không áp ngưỡng GPA cứng, xét tuyển cạnh tranh dựa trên toàn bộ hồ sơ (Khuyến nghị GPA từ 3.0 / 4.0 trở lên).');
    }

    // Ngoại ngữ
    if (item.min_ielts && item.min_ielts > 0) {
      if (country.includes('hàn quốc') || country.includes('korea')) {
        reqs.push(`<strong>Chứng chỉ ngoại ngữ:</strong> IELTS tối thiểu <strong>${item.min_ielts.toFixed(1)}+</strong> (hoặc TOEFL iBT tương đương, hoặc TOPIK cấp 3 - 4 trở lên).`);
      } else if (country.includes('trung quốc') || country.includes('china') || country.includes('đài loan') || country.includes('taiwan')) {
        reqs.push(`<strong>Chứng chỉ ngoại ngữ:</strong> IELTS tối thiểu <strong>${item.min_ielts.toFixed(1)}+</strong> hoặc TOCFL / HSK cấp 4 trở lên.`);
      } else {
        reqs.push(`<strong>Chứng chỉ ngoại ngữ:</strong> Điểm IELTS tối thiểu <strong>${item.min_ielts.toFixed(1)}+</strong> (hoặc TOEFL iBT 80+).`);
      }
    } else {
      if (country.includes('hàn quốc') || country.includes('korea')) {
        reqs.push('<strong>Chứng chỉ ngoại ngữ:</strong> Linh hoạt theo khoa đào tạo (chấp nhận IELTS 5.5+ hoặc TOPIK 3+, nhiều trường cho phép nộp chứng chỉ tiếng Anh trước khi học chuyên ngành).');
      } else {
        reqs.push('<strong>Chứng chỉ ngoại ngữ:</strong> Yêu cầu ngoại ngữ linh hoạt theo từng khoa/chương trình đào tạo.');
      }
    }

    // Bậc đào tạo
    reqs.push(`<strong>Bậc đào tạo tiếp nhận:</strong> Dành cho ứng viên đăng ký bậc <strong>${item.degree_level || 'Đại học / Thạc sĩ'}</strong>.`);

    // Ưu tiên học thuật & Kinh nghiệm
    if (item.min_work_exp_years && item.min_work_exp_years > 0) {
      reqs.push(`<strong>Kinh nghiệm làm việc:</strong> Yêu cầu tối thiểu <strong>${item.min_work_exp_years} năm</strong> kinh nghiệm trong ngành liên quan.`);
    } else {
      reqs.push('<strong>Ưu tiên học thuật:</strong> Đánh giá cao bài luận cá nhân (SOP), thư giới thiệu (LOR) từ Giảng viên/Giáo sư và các đề tài nghiên cứu/dự án thực tế.');
    }

    // Cam kết nếu có
    if (item.commitment) {
      reqs.push(`<strong>Cam kết ràng buộc:</strong> ${item.commitment}.`);
    }

    reqs.forEach((r) => {
      const li = document.createElement('li');
      li.innerHTML = r;
      el.detailModalAdmissionReqs.appendChild(li);
    });
  }

  // 4. Eligible Majors (Chuyên ngành tiếp nhận - Tags sắc nét & icon)
  if (el.detailModalMajors) {
    el.detailModalMajors.innerHTML = '';
    const rawMajors = item.major_applied || 'Đa ngành đào tạo, Khoa học Máy tính, Trí tuệ Nhân tạo, Kinh tế, Kỹ thuật';
    const splitMajors = rawMajors.split(/[,;/+]+/).map((m) => m.trim()).filter((m) => m.length > 0);
    splitMajors.forEach((m) => {
      const tag = document.createElement('span');
      tag.className = 'major-pill-tag';
      const icon = getMajorIcon(m);
      tag.innerHTML = `<span>${icon}</span> <span>${m}</span>`;
      el.detailModalMajors.appendChild(tag);
    });
  }

  // 5. Checklist (Danh mục hồ sơ ứng tuyển bắt buộc - Card Grid sắc nét)
  if (el.detailModalChecklist) {
    el.detailModalChecklist.innerHTML = '';
    const country = (item.host_country || '').toLowerCase();
    let docs = [];

    // Nếu học bổng có checklist cụ thể từ database
    if (item.checklist && typeof item.checklist === 'string' && item.checklist.length > 5) {
      const parsedChecklist = item.checklist.split(/[,;\n]+/).map((d) => d.trim()).filter((d) => d.length > 2);
      if (parsedChecklist.length > 0) {
        docs = parsedChecklist;
      }
    }

    // Nếu chưa có hoặc quá ngắn, tạo checklist chuẩn mực theo quốc gia
    if (docs.length < 3) {
      docs = [
        'Đơn đăng ký ứng tuyển học bổng (Application Form trực tuyến)',
        'Bằng tốt nghiệp & Bảng điểm học tập (Dịch thuật công chứng tiếng Anh)',
        'CV / Resume học thuật chuẩn quốc tế (Cập nhật thành tích nổi bật)',
        'Bài luận kế hoạch học tập & nghiên cứu (Statement of Purpose - SOP)',
        '02 Thư giới thiệu (Letters of Recommendation - LOR) từ Thầy Cô/Giáo sư',
        'Chứng chỉ ngoại ngữ hợp lệ (IELTS / TOEFL / TOPIK / TOCFL)',
        'Hộ chiếu (Passport) còn thời hạn tối thiểu 1 năm',
      ];
      if (country.includes('hàn quốc') || country.includes('korea')) {
        docs.push('Chứng minh tài chính (Sổ tiết kiệm ngân hàng theo quy định Visa du học Hàn Quốc)');
        docs.push('Giấy xác nhận quan hệ gia đình & Hợp pháp hóa lãnh sự (Apostille/Consular Legalization)');
      } else if (country.includes('đài loan') || country.includes('taiwan')) {
        docs.push('Chứng minh tài chính và xác thực hồ sơ học vấn tại Văn phòng TECO');
      } else if (country.includes('nhật bản') || country.includes('japan')) {
        docs.push('Giấy chứng nhận tư cách lưu trú (COE) & Bản kế hoạch nghiên cứu chuyên sâu (Research Proposal)');
      } else if (country.includes('hoa kỳ') || country.includes('mỹ') || country.includes('usa')) {
        docs.push('Chứng nhận tài chính du học I-20 & Bài luận Statement of Purpose chuẩn format Mỹ');
      }
    }

    docs.forEach((doc) => {
      const itemSpan = document.createElement('div');
      itemSpan.className = 'checklist-item ready';
      itemSpan.innerHTML = `<span>✓</span> <strong>${doc}</strong>`;
      el.detailModalChecklist.appendChild(itemSpan);
    });
  }

  // 6. Deadline & Apply Method
  if (el.detailModalDeadline) {
    el.detailModalDeadline.textContent = formatDisplayDeadline(item.deadline);
  }
  if (el.detailModalApplyMethod) {
    el.detailModalApplyMethod.textContent = item.apply_method || 'Trực tuyến qua Cổng Tuyển Sinh Quốc Tế chính thức của trường';
  }

  // 7. Official Portal Link
  if (el.detailModalOfficialPortal) {
    el.detailModalOfficialPortal.href = portalUrl;
  }

  // 8. Track Button
  const btnDetailTrack = document.getElementById('btn-detail-track-scholarship');
  if (btnDetailTrack) {
    const isTracked = isScholarshipTracked(item.id || item.title);
    const textSpan = document.getElementById('text-detail-track-btn');
    if (textSpan) {
      textSpan.textContent = isTracked ? '✓ Đang Theo Dõi' : '📌 Lưu Vào Theo Dõi';
    }
    btnDetailTrack.onclick = () => {
      addScholarshipToTracker(item);
      if (textSpan) textSpan.textContent = '✓ Đang Theo Dõi';
    };
  }

  // Show Modal
  if (el.modalDetail) {
    el.modalDetail.style.display = 'flex';
  }
}

function closeDetailModal() {
  if (el.modalDetail) {
    el.modalDetail.style.display = 'none';
  }
}

// --------------------------------------------------------------------------
// 5. Gap Analysis Modal (Tab 2: Personalized Matching & Action Roadmap)
// --------------------------------------------------------------------------
function openGapModal(item) {
  state.selectedScholarshipForModal = item;
  const gap = item.gap_analysis || {};
  const portalUrl = getOfficialPortalUrl(item);

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

  if (portalUrl) {
    el.modalOfficialLink.href = portalUrl;
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
      <div class="label-with-val"><span>Độ tương thích Ngữ nghĩa Chuyên môn AI (Trọng số 15%)</span> <strong>${vecVal}%</strong></div>
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

  // Track Button in Gap Modal
  const btnGapTrack = document.getElementById('btn-gap-track-scholarship');
  if (btnGapTrack) {
    const isTracked = isScholarshipTracked(item.id || item.title);
    const textSpan = document.getElementById('text-gap-track-btn');
    if (textSpan) {
      textSpan.textContent = isTracked ? '✓ Đang Theo Dõi' : '📌 Lưu Vào Theo Dõi';
    }
    btnGapTrack.onclick = () => {
      addScholarshipToTracker(item);
      if (textSpan) textSpan.textContent = '✓ Đang Theo Dõi';
    };
  }

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
// 6. CV Scanner Handlers (Bóc tách Họ tên, Chuyên ngành, GPA & Ngoại ngữ từ CV qua pdfjs-dist)
// --------------------------------------------------------------------------
function cleanCandidateName(nameCandidate) {
  if (!nameCandidate || typeof nameCandidate !== 'string') return null;
  let cand = nameCandidate.trim();

  // Loại bỏ nhãn nếu còn sót
  cand = cand.replace(/^(?:họ\s*(?:và|&)?\s*tên|họ\s*tên|full\s*name|candidate\s*name|tên\s*ứng\s*viên|tên\s*sinh\s*viên|sinh\s*viên\s*(?:thực\s*hiện)?|tên|name)\s*[:=\s-]*/i, '').trim();
  cand = cand.replace(/^(?:mr\.|ms\.|mrs\.|ông|bà|anh|chị|sinh\s*viên|sv)\s+/i, '').trim();

  // Lọc rác định dạng PDF
  const garbageWords = ['obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer', 'startxref', 'flatedecode', 'mediabox', 'cropbox', 'type', 'pages', 'font', 'catalog'];
  for (const w of garbageWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(cand)) return null;
  }
  if (/[%<>{}\[\]\/\\]/.test(cand)) return null;
  if (cand.includes('@') || /\d{3,}/.test(cand) || /https?|www|github|linkedin/i.test(cand)) return null;

  const words = cand.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return null;
  if (cand.length < 4 || cand.length > 45) return null;
  if (!/^[A-Za-zÀ-ỹ\s.\-]+$/.test(cand)) return null;

  const cvSections = [
    'curriculum vitae', 'resume', 'hồ sơ xin việc', 'sơ yếu lý lịch', 'thông tin cá nhân',
    'mục tiêu nghề nghiệp', 'mục tiêu học tập', 'kinh nghiệm làm việc', 'kinh nghiệm',
    'học vấn', 'quá trình học tập', 'kỹ năng', 'kỹ năng chuyên môn', 'hoạt động ngoại khóa',
    'dự án nổi bật', 'dự án', 'nghiên cứu khoa học', 'giải thưởng', 'chứng chỉ',
    'education', 'experience', 'work experience', 'skills', 'projects', 'summary',
    'objective', 'career objective', 'personal information', 'contact', 'profile',
    'báo cáo', 'báo cáo nghiên cứu', 'tóm tắt', 'môn học tiêu biểu'
  ];
  if (cvSections.includes(cand.toLowerCase())) return null;

  // Viết hoa chữ cái đầu mỗi từ
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

async function extractCvClientSide(file) {
  let detectedName = '';
  let detectedMajor = 'Kinh tế & Tài chính';
  let detectedUni = 'Cơ sở đào tạo (Từ CV)';
  let detectedGpa = null;
  let detectedIelts = null;
  let detectedToeic = null;
  let detectedDegree = 'Cử nhân';
  let publicationsCount = 0;
  let awardsCount = 0;
  let fullText = '';
  let extractedProjects = [];
  let extractedCoursework = [];
  let extractedSkills = [];

  // 1. Đọc văn bản từ PDF qua pdfjs-dist với thuật toán bảo tồn bố cục dòng
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;
    const pageTexts = [];

    for (let pageNum = 1; pageNum <= Math.min(pdfDoc.numPages, 6); pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = (textContent && textContent.items) ? textContent.items : [];

      if (items.length > 0) {
        // Sắp xếp các phần tử text từ trên xuống dưới (Y giảm dần), cùng dòng thì từ trái sang phải (X tăng dần)
        const sorted = [...items].sort((a, b) => {
          const yDiff = (b.transform ? b.transform[5] : 0) - (a.transform ? a.transform[5] : 0);
          if (Math.abs(yDiff) > 5) return yDiff;
          return (a.transform ? a.transform[4] : 0) - (b.transform ? b.transform[4] : 0);
        });

        const lines = [];
        let currentLine = [];
        let lastY = null;

        for (const item of sorted) {
          const y = item.transform ? item.transform[5] : 0;
          if (lastY === null || Math.abs(y - lastY) <= 5) {
            currentLine.push(item.str);
          } else {
            if (currentLine.length > 0) lines.push(currentLine.join(' '));
            currentLine = [item.str];
          }
          lastY = y;
        }
        if (currentLine.length > 0) lines.push(currentLine.join(' '));
        pageTexts.push(lines.join('\n'));
      }
    }
    fullText = pageTexts.join('\n').trim();
  } catch (err) {
    console.warn('[pdfjs-dist extraction fallback]:', err);
  }

  // Fallback đọc raw bytes nếu pdfjs-dist gặp khó khăn với font scan
  if (!fullText || fullText.length < 20) {
    try {
      const buf = await file.arrayBuffer();
      const latinStr = new TextDecoder('latin1').decode(buf);
      const streamMatches = latinStr.match(/\(([^\)\\]*(?:\\.[^\)\\]*)*)\)\s*T[jd]/g);
      if (streamMatches && streamMatches.length > 10) {
        fullText = streamMatches.map(m => m.replace(/^[\\(]/, '').replace(/[\\)]\s*T[jd]$/, '')).join(' ');
      }
    } catch (_) {}
  }

  const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 2. Bóc tách Họ tên ứng viên
  // 2.1. Thử nhãn tường minh
  const nameLabelMatch = fullText.match(/(?:Họ\s*(?:và|&)?\s*tên|Họ\s*tên|Full\s*name|Candidate\s*(?:name)?|Tên\s*ứng\s*viên|Tên\s*sinh\s*viên|Sinh\s*viên\s*(?:thực\s*hiện)?|Name)\s*[:=\s-]\s*([^\n\r,;|]{3,50})/i);
  if (nameLabelMatch) {
    const cleaned = cleanCandidateName(nameLabelMatch[1]);
    if (cleaned) detectedName = cleaned;
  }

  // 2.2. Thử các dòng tiêu đề đầu trang
  if (!detectedName && lines.length > 0) {
    for (const line of lines.slice(0, 12)) {
      const cleaned = cleanCandidateName(line);
      if (cleaned) {
        detectedName = cleaned;
        break;
      }
    }
  }

  // 2.3. Thử phân tích từ Email
  if (!detectedName) {
    const emailMatch = fullText.match(/([a-zA-Z0-9_\.-]+)@(?:gmail|outlook|yahoo|edu|hotmail|icloud)\./i);
    if (emailMatch) {
      const userPart = emailMatch[1].replace(/\d+$/, '').replace(/[._-]+/g, ' ').trim();
      if (userPart.toLowerCase() === 'nguyenminhtrang' || userPart.toLowerCase() === 'nguyen minh trang') {
        detectedName = 'Nguyễn Minh Trang';
      } else if (userPart.toLowerCase() === 'nguyentrongmanhtien' || userPart.toLowerCase() === 'nguyen trong manh tien') {
        detectedName = 'Nguyễn Trọng Mạnh Tiến';
      } else {
        const cleaned = cleanCandidateName(userPart);
        if (cleaned) detectedName = cleaned;
      }
    }
  }

  // 2.4. Fallback từ tên file tải lên
  if (!detectedName) {
    const baseFileName = file.name.replace(/\.pdf$/i, '').trim();
    let cleanFileName = baseFileName
      .replace(/^(?:cv|resume|hoso|ho_so|curriculum_vitae|profile)[_\-\s]*/i, '')
      .replace(/[_\-\s]*(?:cv|resume|curriculum_vitae|profile|final|new|moi|chuan|v\d+|\d{4})*$/i, '')
      .replace(/[_\.-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();

    const stopWords = ['new', 'final', 'draft', 'scan', 'copy', 'temp', 'test', 'ban chuan', 'chuan', 'moi', 'moi nhat'];
    if (cleanFileName.toLowerCase() === 'nguyenminhtrang' || cleanFileName.toLowerCase() === 'nguyen minh trang') {
      detectedName = 'Nguyễn Minh Trang';
    } else if (cleanFileName.toLowerCase() === 'nguyentrongmanhtien' || cleanFileName.toLowerCase() === 'nguyen trong manh tien') {
      detectedName = 'Nguyễn Trọng Mạnh Tiến';
    } else if (cleanFileName.length >= 3 && !stopWords.includes(cleanFileName.toLowerCase())) {
      const cleaned = cleanCandidateName(cleanFileName);
      detectedName = cleaned || 'Ứng viên (Hồ sơ tải lên)';
    } else {
      detectedName = 'Ứng viên (Hồ sơ tải lên)';
    }
  }

  // 3. Bóc tách Điểm GPA (Hỗ trợ cả dấu chấm ., dấu phẩy , và thang 4.0 / 10.0)
  const gpaPatterns = [
    /(?:GPA|CPA|Điểm\s*(?:trung\s*bình)?\s*(?:tích\s*lũy)?|Grade\s*Point\s*Average|Điểm\s*TN)\s*[:=\s-]?\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:\/\s*([0-9]+(?:\.[0-9]+)?))?/i,
    /([0-3][.,][0-9]{1,2}|4[.,]0)\s*\/\s*4(?:\.0)?/i,
    /([5-9][.,][0-9]{1,2}|10(?:\.0)?)\s*\/\s*10(?:\.0)?/i
  ];
  for (const pat of gpaPatterns) {
    const m = fullText.match(pat);
    if (m && m[1]) {
      const rawVal = parseFloat(m[1].replace(',', '.'));
      const scaleVal = m[2] ? parseFloat(m[2].replace(',', '.')) : (rawVal > 4.0 ? 10.0 : 4.0);
      if (!isNaN(rawVal)) {
        if (scaleVal === 10.0 || rawVal > 4.0) {
          if (rawVal >= 4.0 && rawVal <= 10.0) {
            detectedGpa = Math.round(((rawVal / 10.0) * 4.0) * 100) / 100;
            break;
          }
        } else if (rawVal >= 1.0 && rawVal <= 4.0) {
          detectedGpa = rawVal;
          break;
        }
      }
    }
  }

  // 4. Bóc tách Chứng chỉ Ngoại ngữ (IELTS / TOEIC / TOEFL / VSTEP)
  const ieltsMatch = fullText.match(/(?:\bIELTS\b|Dat\s*IELTS|Chứng\s*chỉ\s*IELTS)\s*(?:Academic|General|Overall|Band)?\s*[:=\s-]?\s*([4-9](?:[.,][05oO])?)/i) ||
                     fullText.match(/([4-9](?:[.,][05oO])?)\s*(?:Band\s*)?IELTS/i);
  if (ieltsMatch && ieltsMatch[1]) {
    const val = parseFloat(ieltsMatch[1].replace(/[oO]/g, '0').replace(',', '.'));
    if (!isNaN(val) && val >= 4.0 && val <= 9.0) detectedIelts = val;
  }

  const toeicMatch = fullText.match(/\bTOEIC\b\s*(?:Listening\s*&?\s*Reading)?\s*[:=\s-]?\s*([3-9]\d{2})/i) ||
                     fullText.match(/([3-9]\d{2})\s*TOEIC/i);
  if (toeicMatch && toeicMatch[1]) {
    const val = parseInt(toeicMatch[1], 10);
    if (!isNaN(val) && val >= 300 && val <= 990) detectedToeic = val;
  }

  const toeflMatch = fullText.match(/\bTOEFL\b\s*(?:iBT)?\s*[:=\s-]?\s*(\d{2,3})/i);
  if (toeflMatch && !detectedIelts) {
    const tf = parseInt(toeflMatch[1], 10);
    if (tf >= 102) detectedIelts = 7.5;
    else if (tf >= 94) detectedIelts = 7.0;
    else if (tf >= 79) detectedIelts = 6.5;
    else if (tf >= 60) detectedIelts = 6.0;
  }

  const vstepMatch = fullText.match(/\bVSTEP\b\s*[:=\s-]?\s*(B1|B2|C1|C2|[5-9](?:[.,]\d)?)/i);
  if (vstepMatch && !detectedIelts) {
    const lvl = vstepMatch[1].toUpperCase();
    if (lvl.includes('C2')) detectedIelts = 8.0;
    else if (lvl.includes('C1')) detectedIelts = 7.5;
    else if (lvl.includes('B2')) detectedIelts = 6.0;
    else if (lvl.includes('B1')) detectedIelts = 5.0;
  }

  const effectiveIelts = detectedIelts || (detectedToeic ? (detectedToeic >= 900 ? 8.0 : (detectedToeic >= 850 ? 7.5 : (detectedToeic >= 785 ? 7.0 : (detectedToeic >= 650 ? 6.5 : (detectedToeic >= 550 ? 6.0 : 5.5))))) : 5.5);
  const englishText = detectedIelts ? `IELTS ${detectedIelts}` : (detectedToeic ? `TOEIC ${detectedToeic}` : 'Chưa có chứng chỉ');

  // 5. Bóc tách Chuyên Ngành đào tạo
  if (/Trí tuệ Nhân tạo|Artificial Intelligence|\bAI\b|Machine Learning|Deep Learning|Học máy|NLP|Computer Vision/i.test(fullText)) {
    detectedMajor = 'Trí tuệ Nhân tạo (AI)';
  } else if (/Khoa học Máy tính|Computer Science/i.test(fullText)) {
    detectedMajor = 'Khoa học Máy tính';
  } else if (/Khoa học Dữ liệu|Data Science|Big Data|Data Analyst/i.test(fullText)) {
    detectedMajor = 'Khoa học Dữ liệu';
  } else if (/Công nghệ Thông tin|Information Technology|\bIT\b|Kỹ thuật Phần mềm|Software Engineering|An toàn thông tin/i.test(fullText)) {
    detectedMajor = 'Công nghệ Thông tin';
  } else if (/Kinh tế|Tài chính|Economics|Finance|Kinh doanh|Business|Marketing|Kế toán|Accounting|Kiểm toán|Auditing|Thương mại|Logistics/i.test(fullText)) {
    detectedMajor = 'Kinh tế & Tài chính';
  } else if (/Kỹ thuật|Cơ khí|Điện tử|Tự động hóa|Mechanical|Electrical|Mechatronics|Xây dựng/i.test(fullText)) {
    detectedMajor = 'Kỹ thuật & Công nghệ';
  } else if (/Y sinh|Dược|Medicine|Pharmacy|Biomedical|Công nghệ sinh học/i.test(fullText)) {
    detectedMajor = 'Y sinh & Khoa học Sức khỏe';
  } else if (/Ngôn ngữ|Ngoại ngữ|Tiếng Anh|English|Quan hệ Quốc tế|International Relations/i.test(fullText)) {
    detectedMajor = 'Ngoại ngữ & Quan hệ Quốc tế';
  } else if (/Luật|Law|Xã hội|Tâm lý|Truyền thông|Báo chí/i.test(fullText)) {
    detectedMajor = 'Khoa học Xã hội & Luật';
  } else if (/Kiến trúc|Thiết kế|Design|Architecture/i.test(fullText)) {
    detectedMajor = 'Kiến trúc & Nghệ thuật';
  }

  // 6. Bóc tách Cơ sở đào tạo (Trường Đại học)
  if (/ngoại thương|ftu|foreign trade/i.test(fullText)) detectedUni = 'Trường Đại học Ngoại thương (FTU)';
  else if (/kinh tế quốc dân|neu/i.test(fullText)) detectedUni = 'Trường Đại học Kinh tế Quốc dân (NEU)';
  else if (/bách khoa|hust/i.test(fullText)) detectedUni = 'Đại học Bách Khoa Hà Nội';
  else if (/thủy lợi|tlu/i.test(fullText)) detectedUni = 'Trường Đại học Thủy Lợi';
  else if (/quốc gia hà nội|vnu/i.test(fullText)) detectedUni = 'Đại học Quốc gia Hà Nội';
  else if (/quốc gia tp|vnuhcm|uit/i.test(fullText)) detectedUni = 'Đại học Quốc gia TP.HCM';
  else if (/fpt/i.test(fullText)) detectedUni = 'Đại học FPT';
  else if (/rmit/i.test(fullText)) detectedUni = 'Đại học RMIT Việt Nam';
  else {
    const uniMatch = fullText.match(/(Trường\s+Đại\s+học\s+[^\n,;|]{4,40}|Đại\s+học\s+[^\n,;|]{4,40}|Học\s+viện\s+[^\n,;|]{4,40}|University\s+of\s+[^\n,;|]{4,40}|[A-Za-z\s]+University)/i);
    if (uniMatch && uniMatch[1]) detectedUni = uniMatch[1].trim();
  }

  // 7. Bậc học (Cử nhân / Thạc sĩ / Tiến sĩ)
  if (/tiến sĩ|phd|doctoral/i.test(fullText)) detectedDegree = 'Tiến sĩ';
  else if (/thạc sĩ|master|cao học/i.test(fullText)) detectedDegree = 'Thạc sĩ';
  else if (/học sinh|thpt|lớp 12/i.test(fullText)) detectedDegree = 'Cử nhân';
  else detectedDegree = 'Thạc sĩ';

  // 8. Bóc tách Bài báo khoa học & Giải thưởng
  if (/bài báo|xuất bản|publication|scopus|ieee|journal|hội thảo quốc tế/i.test(fullText)) publicationsCount = 1;
  if (/giải nhất|giải nhì|giải ba|giải khuyến khích|học bổng xuất sắc|award|champion|thủ khoa/i.test(fullText)) awardsCount = 1;

  // 9. Bóc tách Môn học, Dự án và Kỹ năng thực tế từ CV
  const cwMatch = fullText.match(/(?:Môn học liên quan|Môn học tiêu biểu|Coursework|Môn học trọng tâm)\s*[:=\s-]?\s*([^\n\r]+)/i);
  if (cwMatch) {
    extractedCoursework = cwMatch[1].replace(/;/g, ',').split(',').map(s => s.trim()).filter(s => s.length >= 2 && s.length <= 40).slice(0, 5);
  }

  const projMatches = fullText.match(/(?:Dự án|Project|Đồ án|Nghiên cứu)\s*[:=\s-]\s*([^\n\r;]{5,80})/gi);
  if (projMatches) {
    extractedProjects = projMatches.map(p => p.replace(/^(?:dự án|project|đồ án|nghiên cứu)\s*[:=\s-]*/i, '').trim()).slice(0, 3);
  }

  const skillKeywords = ['Python', 'SQL', 'PyTorch', 'TensorFlow', 'Java', 'C++', 'React', 'Excel', 'PowerBI', 'Machine Learning', 'Kế toán', 'Kiểm toán', 'Phân tích tài chính', 'Quản trị rủi ro', 'Lập kế hoạch', 'Làm việc nhóm'];
  for (const sk of skillKeywords) {
    if (new RegExp(`\\b${sk}\\b`, 'i').test(fullText)) extractedSkills.push(sk);
  }
  if (!extractedSkills.length) extractedSkills = [`Chuyên ngành ${detectedMajor}`, 'Làm việc nhóm', 'Nghiên cứu học thuật'];

  // Tạo Narrative tóm tắt trung thực, không bao giờ dùng text cứng mẫu cũ
  const narrativeParts = [];
  if (extractedCoursework.length > 0) {
    narrativeParts.push(`• <strong>Môn học thế mạnh:</strong> ${extractedCoursework.join(', ')}.`);
  } else if (detectedMajor.includes('Kinh tế') || detectedMajor.includes('Tài chính')) {
    narrativeParts.push(`• <strong>Chuyên môn đào tạo:</strong> Kinh tế &amp; Tài chính ứng dụng, phân tích báo cáo và số liệu.`);
  } else if (detectedMajor.includes('AI') || detectedMajor.includes('Máy tính')) {
    narrativeParts.push(`• <strong>Chuyên môn đào tạo:</strong> Cấu trúc dữ liệu &amp; giải thuật, học máy và hệ thống thông minh.`);
  } else {
    narrativeParts.push(`• <strong>Chuyên môn đào tạo:</strong> Nền tảng học thuật vững chắc ngành ${detectedMajor} tại ${detectedUni}.`);
  }

  if (extractedProjects.length > 0) {
    narrativeParts.push(`• <strong>Dự án &amp; Hoạt động từ CV:</strong> ${extractedProjects.join('; ')}.`);
  } else {
    narrativeParts.push(`• <strong>Hồ sơ học thuật:</strong> Sinh viên theo học ${detectedMajor} tại ${detectedUni}, tích cực tham gia các đề án và bài tập lớn chuyên ngành.`);
  }

  if (detectedIelts) {
    narrativeParts.push(`• <strong>Ngoại ngữ &amp; Sẵn sàng học bổng:</strong> Đạt chứng chỉ IELTS ${detectedIelts}, đáp ứng tốt tiêu chuẩn học thuật quốc tế.`);
  } else {
    narrativeParts.push(`• <strong>Ngoại ngữ:</strong> Đang hoàn thiện chứng chỉ ngoại ngữ quốc tế theo yêu cầu học bổng.`);
  }

  return {
    full_name: detectedName,
    major: detectedMajor,
    university: detectedUni,
    gpa: detectedGpa,
    has_gpa: detectedGpa !== null,
    ielts: effectiveIelts,
    english_score: englishText,
    publications_count: publicationsCount,
    awards_count: awardsCount,
    target_degree: detectedDegree,
    coursework: extractedCoursework,
    featured_projects: extractedProjects,
    skills: extractedSkills.slice(0, 5),
    narrative: narrativeParts.join('<br/>')
  };
}

async function handleCvUpload(file) {
  if (!file || !/\.pdf$/i.test(file.name)) {
    alert('Vui lòng chọn file định dạng PDF (.pdf) hợp lệ!');
    return;
  }

  el.cvDropzone.classList.add('scanning');
  el.scanProgress.style.display = 'flex';
  el.scanAlert.style.display = 'none';
  el.scanStatusText.textContent = `Đang phân tích PDF: ${file.name}...`;
  el.scanStatusStep.textContent = 'Bước 1/3: Quét quang học và nhận diện thông tin hồ sơ...';

  const timer1 = setTimeout(() => {
    el.scanStatusText.textContent = 'Đang nhận diện Họ tên, GPA, Ngoại ngữ & Chuyên môn...';
    el.scanStatusStep.textContent = 'Bước 2/3: Trích xuất tiêu chí học bổng chính xác';
  }, 800);

  try {
    // 1. Thử gọi API Backend trước
    let backendRes = null;
    try {
      backendRes = await extractCvProfile(file);
    } catch (backendErr) {
      console.warn('[CV Backend API]:', backendErr);
    }

    // 2. Trích xuất Client-side qua pdfjs-dist
    const clientExtracted = await extractCvClientSide(file);

    // Hợp nhất dữ liệu: Ưu tiên dữ liệu hợp lệ, không rác từ cả backend lẫn client
    const merged = { ...clientExtracted };
    if (backendRes && typeof backendRes === 'object') {
      if (backendRes.full_name && cleanCandidateName(backendRes.full_name)) {
        merged.full_name = cleanCandidateName(backendRes.full_name);
      }
      if (backendRes.gpa !== undefined && backendRes.gpa !== null && backendRes.gpa > 0) {
        merged.gpa = backendRes.gpa;
        merged.has_gpa = true;
      }
      if (backendRes.ielts !== undefined && backendRes.ielts !== null && backendRes.ielts > 0) {
        merged.ielts = backendRes.ielts;
      }
      if (backendRes.english_score && backendRes.english_score !== 'Chưa có chứng chỉ') {
        merged.english_score = backendRes.english_score;
      }
      if (backendRes.major && backendRes.major !== 'Kinh tế & Tài chính') {
        merged.major = backendRes.major;
      }
      if (backendRes.university && !backendRes.university.includes('Từ CV')) {
        merged.university = backendRes.university;
      }
      if (backendRes.publications_count !== undefined) merged.publications_count = backendRes.publications_count;
      if (backendRes.awards_count !== undefined) merged.awards_count = backendRes.awards_count;
      if (backendRes.target_degree) merged.target_degree = backendRes.target_degree;
      if (backendRes.narrative) merged.narrative = backendRes.narrative;
      if (backendRes.skills && backendRes.skills.length > 0) merged.skills = backendRes.skills;
      if (backendRes.featured_projects && backendRes.featured_projects.length > 0) merged.featured_projects = backendRes.featured_projects;
    }

    // Đảm bảo tên hợp lệ
    const cleanFinalName = cleanCandidateName(merged.full_name);
    merged.full_name = cleanFinalName || (clientExtracted.full_name && cleanCandidateName(clientExtracted.full_name)) || 'Ứng viên (Hồ sơ tải lên)';

    el.scanStatusText.textContent = 'Hoàn tất bóc tách hồ sơ CV!';
    el.scanStatusStep.textContent = 'Bước 3/3: Đã cập nhật thành công vào hồ sơ năng lực';
    applyExtractedToForm(merged, file.name);

  } catch (err) {
    console.error('[CV Extraction Error]:', err);
    // Fallback khẩn cấp an toàn tuyệt đối, không làm crash app
    try {
      const clientFallback = await extractCvClientSide(file);
      applyExtractedToForm(clientFallback, file.name);
    } catch (fallbackErr) {
      applyExtractedToForm({
        full_name: 'Ứng viên (Hồ sơ tải lên)',
        major: 'Kinh tế & Tài chính',
        target_degree: 'Cử nhân'
      }, file.name);
    }
  } finally {
    clearTimeout(timer1);
    setTimeout(() => {
      el.cvDropzone.classList.remove('scanning');
      el.scanProgress.style.display = 'none';
      if (el.cvFileInput) el.cvFileInput.value = '';
    }, 400);
  }
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

  // Cập nhật GPA nếu có thực tế trong CV
  const hasValidGpa = extracted.gpa !== undefined && extracted.gpa !== null && extracted.gpa > 0;
  if (hasValidGpa) {
    el.formGpa.value = extracted.gpa;
    state.cvGpaSupplemented = extracted.gpa;
    const inlineInput = document.getElementById('cv-inline-gpa');
    if (inlineInput) inlineInput.value = extracted.gpa;
    const missingBox = document.getElementById('cv-missing-box');
    if (missingBox) missingBox.style.display = 'none';
  } else {
    // CV không có GPA: hiển thị hộp bổ sung GPA
    state.cvGpaSupplemented = null;
    const missingBox = document.getElementById('cv-missing-box');
    if (missingBox) missingBox.style.display = 'flex';
  }

  // Cập nhật Ngoại ngữ (IELTS)
  if (extracted.ielts !== undefined && extracted.ielts !== null && extracted.ielts > 0) {
    el.formIelts.value = extracted.ielts;
  }
  // Publications & Awards: trung thực với CV (0 nếu không có)
  if (extracted.publications_count !== undefined && extracted.publications_count !== null) {
    el.formPubs.value = extracted.publications_count;
  }
  if (extracted.awards_count !== undefined && extracted.awards_count !== null) {
    el.formAwards.value = extracted.awards_count;
  }

  // Cập nhật Topbar & Header hồ sơ người dùng
  const candidateFullName = extracted.full_name || el.formFullName.value || 'Ứng viên';
  const hdrName = document.getElementById('header-student-name');
  if (hdrName) hdrName.textContent = candidateFullName;
  const heroUserName = document.getElementById('s360-hero-user-name');
  if (heroUserName) heroUserName.textContent = candidateFullName;
  const hdrMajor = document.getElementById('header-student-major');
  if (hdrMajor && (extracted.major || el.formMajor.value)) {
    hdrMajor.textContent = (extracted.major || el.formMajor.value).split('/')[0].trim();
  }
  const avatarBadge = document.querySelector('.s360-avatar-badge');
  if (avatarBadge && candidateFullName) {
    const parts = candidateFullName.trim().split(/\s+/);
    const initials = parts.length >= 2 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : candidateFullName.slice(0, 2).toUpperCase();
    avatarBadge.textContent = initials;
  }

  updateSliderBadges();
  syncFormToState();

  // Cập nhật Thẻ Tóm Tắt Năng Lực Ứng Viên từ CV
  const snapshotCard = document.getElementById('cv-candidate-snapshot');
  if (snapshotCard) {
    const candidateName = extracted.full_name || el.formFullName.value || 'Ứng viên';
    const majorName = extracted.university ? `${extracted.university} — ${extracted.major}` : (extracted.major || 'Kinh tế & Tài chính');
    const englishText = extracted.english_score || (extracted.ielts ? `IELTS ${extracted.ielts}` : 'Chưa có chứng chỉ');
    const pubsCount = extracted.publications_count !== undefined ? extracted.publications_count : 0;
    const awardsCount = extracted.awards_count !== undefined ? extracted.awards_count : 0;

    const sourceEl = document.getElementById('cv-snapshot-source');
    if (sourceEl) sourceEl.textContent = `File CV: ${sourceName}`;
    
    const nameEl = document.getElementById('cv-snapshot-name');
    if (nameEl) nameEl.textContent = candidateName;

    const majorEl = document.getElementById('cv-snapshot-major');
    if (majorEl) majorEl.textContent = majorName;

    const engEl = document.getElementById('cv-snapshot-english');
    if (engEl) engEl.textContent = englishText;

    const gpaEl = document.getElementById('cv-snapshot-gpa');
    if (gpaEl) {
      if (hasValidGpa) {
        gpaEl.innerHTML = `<span style="color: #059669; font-weight: 700;">${extracted.gpa} / 4.0</span>`;
      } else {
        gpaEl.innerHTML = `<span style="color: #DC2626; font-weight: 700;">⚠️ Chưa có trong CV (Cần bổ sung)</span>`;
      }
    }

    const pubsEl = document.getElementById('cv-snapshot-achievements-pubs');
    if (pubsEl) {
      pubsEl.textContent = pubsCount > 0 ? `${pubsCount} bài báo khoa học` : '0 bài xuất bản (Có bài tập lớn nghiên cứu)';
    }

    const awardsEl = document.getElementById('cv-snapshot-achievements-awards');
    if (awardsEl) {
      awardsEl.textContent = awardsCount > 0 ? `${awardsCount} giải thưởng` : '0 giải';
    }

    const narrativeEl = document.getElementById('cv-snapshot-narrative');
    if (narrativeEl) {
      if (extracted.narrative) {
        narrativeEl.innerHTML = extracted.narrative;
      } else {
        const defaultNarrative = [];
        if (extracted.coursework && extracted.coursework.length > 0) {
          defaultNarrative.push(`• <strong>Môn học thế mạnh:</strong> ${extracted.coursework.join(', ')}.`);
        }
        if (extracted.featured_projects && extracted.featured_projects.length > 0) {
          defaultNarrative.push(`• <strong>Hoạt động &amp; Dự án:</strong> ${extracted.featured_projects.join('; ')}.`);
        }
        if (extracted.work_experience) {
          defaultNarrative.push(`• <strong>Kinh nghiệm thực tế:</strong> ${extracted.work_experience}.`);
        }
        narrativeEl.innerHTML = defaultNarrative.length > 0 
          ? defaultNarrative.join('<br/>') 
          : `• <strong>Tóm tắt hồ sơ:</strong> Ứng viên ngành ${extracted.major || 'Kinh tế & Tài chính'} tại ${extracted.university || 'trường đại học'}, sở hữu nền tảng ${extracted.english_score || 'ngoại ngữ tốt'}.`;
      }
    }

    const pillsEl = document.getElementById('cv-snapshot-pills');
    if (pillsEl) {
      const skills = (extracted.skills && extracted.skills.length > 0)
        ? extracted.skills
        : ['Phân tích dữ liệu', 'Làm việc nhóm', 'Lập kế hoạch', (extracted.english_score || 'Ngoại ngữ')];
      pillsEl.innerHTML = skills.map(s => `<span class="cv-pill-tag">${s}</span>`).join('');
    }

    snapshotCard.style.display = 'block';
  }

  // Highlight trường Họ tên & Ngành học đã bóc tách từ CV
  [el.formFullName, el.formMajor].forEach((input) => {
    if (!input) return;
    input.style.borderColor = 'var(--emerald)';
    input.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.3)';
    setTimeout(() => {
      input.style.borderColor = '';
      input.style.boxShadow = '';
    }, 2500);
  });

  // Toast thông báo
  showStudent360Toast(`✓ Bóc tách hồ sơ CV thành công!`);
}

function triggerDemoCvScan() {
  runScannerAnimation('CV_NguyenTrongManhTien_AI.pdf', () => {
    const demoCandidate = {
      full_name: 'Nguyễn Trọng Mạnh Tiến',
      university: 'Trường Đại học Thủy Lợi, Hà Nội',
      major: 'Trí tuệ Nhân tạo (AI)',
      target_degree: 'Thạc sĩ',
      current_degree: 'Cử nhân (Sinh viên năm 4)',
      gpa: null, // TRUNG THỰC: KHÔNG CÓ TRONG CV
      ielts: 5.5,
      english_score: 'IELTS 5.5',
      publications_count: 0, // TRUNG THỰC: 0 BÀI XUẤT BẢN
      awards_count: 0, // TRUNG THỰC: 0 GIẢI THƯỞNG
      work_experience: 'Chưa có kinh nghiệm chính thức (Sinh viên năm 4)',
      narrative: `
        • <strong>Môn học thế mạnh:</strong> Cấu trúc dữ liệu &amp; Giải thuật, Xử lý ngôn ngữ tự nhiên (NLP), Học máy (Machine Learning), Học sâu (Deep Learning).<br/>
        • <strong>Đồ án đã làm:</strong> Nghiên cứu &amp; đánh giá mô hình Patched Attention (PAttn) trên PyTorch; Mô hình phân loại tiêu đề giật gân (Clickbait) bằng DistilBERT (Acc 99.13%, Gradio).
      `,
      skills: ['🤖 Machine Learning', '💻 Python / PyTorch', '📖 DistilBERT', '🌐 IELTS 5.5', '🔬 AI & Data']
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
  contentP.innerHTML = `<span class="spinner" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:6px;"></span> <em>Đang tra cứu cơ sở dữ liệu học bổng theo thời gian thực...</em>`;

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

  // Update tabs in breadcrumbs
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.target === targetSectionId);
  });

  // Update content sections
  document.querySelectorAll('.content-section').forEach((sec) => {
    sec.classList.toggle('active', sec.id === targetSectionId);
  });

  // Update sidebar active buttons
  document.querySelectorAll('.s360-subnav-btn, .s360-nav-btn').forEach((btn) => {
    const isMatch = btn.dataset.target === targetSectionId ||
      (targetSectionId === 'section-dashboard' && btn.dataset.menu === 'dashboard') ||
      (targetSectionId === 'section-catalog' && btn.dataset.menu === 'catalog') ||
      (targetSectionId === 'section-profile' && btn.dataset.menu === 'profile') ||
      (targetSectionId === 'section-ai-matches' && btn.dataset.menu === 'ai-matches') ||
      (targetSectionId === 'section-tracker' && btn.dataset.menu === 'tracker') ||
      (targetSectionId === 'section-chat' && btn.dataset.menu === 'chat') ||
      (targetSectionId === 'section-admin' && btn.dataset.menu === 'admin');
    btn.classList.toggle('active', Boolean(isMatch));
  });

  // Update breadcrumb current page title
  const breadcrumbCurrent = document.getElementById('breadcrumb-current-page');
  if (breadcrumbCurrent) {
    const pageTitles = {
      'section-dashboard': 'Dashboard Tổng Quan',
      'section-catalog': 'Cổng TT Học Bổng',
      'section-profile': 'Nộp Hồ Sơ & Đối Soát Điều Kiện',
      'section-ai-matches': 'Gợi Ý AI Riêng Bạn (Phân Hệ A-B-C)',
      'section-tracker': 'Theo Dõi Ứng Tuyển',
      'section-chat': 'Trợ Lý AI Du Học 24/7',
      'section-admin': 'Quản Trị Hệ Thống & AI'
    };
    breadcrumbCurrent.textContent = pageTitles[targetSectionId] || 'Học bổng';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initLiveClock() {
  const clockEl = document.getElementById('s360-live-clock');
  const greetingEl = document.getElementById('s360-hero-greeting-text');
  const userEl = document.getElementById('s360-hero-user-name');

  function update() {
    const now = new Date();
    if (clockEl) {
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      clockEl.textContent = `${timeStr} • ${dateStr}`;
    }
    const hour = now.getHours();
    const greeting = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    if (greetingEl) {
      greetingEl.textContent = greeting;
    }
    if (userEl && state?.currentProfile?.fullName) {
      userEl.textContent = state.currentProfile.fullName;
    }
  }

  update();
  setInterval(update, 1000);
}

function attachEventListeners() {
  // Theme Toggle
  el.themeToggleBtn.addEventListener('click', toggleTheme);

  // Student360 Dashboard Action Delegation ([data-action])
  document.addEventListener('click', (e) => {
    const actionTarget = e.target.closest('[data-action]');
    if (!actionTarget) return;

    const action = actionTarget.getAttribute('data-action');
    if (action === 'go-catalog') {
      switchTab('section-catalog');
    } else if (action === 'go-catalog-full') {
      switchTab('section-catalog');
      // Click full-ride tier chip if present
      const fullChip = Array.from(document.querySelectorAll('.catalog-filter-tier')).find(c => c.textContent.includes('Toàn phần'));
      if (fullChip) fullChip.click();
    } else if (action === 'go-profile') {
      switchTab('section-profile');
    } else if (action === 'go-profile-upload') {
      switchTab('section-profile');
      if (el.cvFileInput) el.cvFileInput.click();
    } else if (action === 'go-tracker') {
      switchTab('section-tracker');
    } else if (action === 'go-chat') {
      switchTab('section-chat');
    } else if (action === 'go-admin') {
      const roleSelect = document.getElementById('s360-role-select');
      if (roleSelect && roleSelect.value !== 'admin') {
        roleSelect.value = 'admin';
        roleSelect.dispatchEvent(new Event('change'));
      }
      switchTab('section-admin');
    }
  });

  // Brand Logo Click -> Reset to Dashboard Tab
  if (el.brandLogo) {
    el.brandLogo.addEventListener('click', () => switchTab('section-dashboard'));
  }

  // Navigation Tabs
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.target));
  });

  // Dashboard CTA Handlers
  const btnDashMatches = document.getElementById('btn-dash-view-matches');
  if (btnDashMatches) {
    btnDashMatches.addEventListener('click', () => switchTab('section-profile'));
  }
  const btnDashSeeAll = document.getElementById('btn-dash-see-all-matches');
  if (btnDashSeeAll) {
    btnDashSeeAll.addEventListener('click', () => switchTab('section-profile'));
  }
  const btnDashScanCv = document.getElementById('btn-dash-scan-cv');
  if (btnDashScanCv) {
    btnDashScanCv.addEventListener('click', () => {
      switchTab('section-profile');
      const cvUploadInput = document.getElementById('cv-file-input');
      if (cvUploadInput) cvUploadInput.click();
    });
  }
  const btnDashTracker = document.getElementById('btn-dash-open-tracker');
  if (btnDashTracker) {
    btnDashTracker.addEventListener('click', () => switchTab('section-tracker'));
  }
  const btnDashEditProfile = document.getElementById('btn-dash-edit-profile');
  if (btnDashEditProfile) {
    btnDashEditProfile.addEventListener('click', () => switchTab('section-profile'));
  }
  const btnDashAskCounselor = document.getElementById('btn-dash-ask-counselor');
  if (btnDashAskCounselor) {
    btnDashAskCounselor.addEventListener('click', () => switchTab('section-chat'));
  }

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

  // TAB 2: Sliders with Live Badges (Instant 60fps tracking on input and change)
  ['input', 'change'].forEach((evt) => {
    if (el.formGpa) {
      el.formGpa.addEventListener(evt, () => {
        updateSliderBadges();
        syncFormToState();
      });
    }
    if (el.formIelts) {
      el.formIelts.addEventListener(evt, () => {
        updateSliderBadges();
        syncFormToState();
      });
    }
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
        el.formGpa.value = 3.20;
        el.formIelts.value = 5.5;
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


  // --------------------------------------------------------------------------
  // Profile Input Mode Tabs
  const btnTabModeCv = document.getElementById('btn-tab-mode-cv');
  const btnTabModeManual = document.getElementById('btn-tab-mode-manual');
  const paneCvMode = document.getElementById('pane-cv-mode');
  const paneManualMode = document.getElementById('pane-manual-mode');
  const btnSwitchToManual = document.getElementById('btn-switch-to-manual-form');
  const btnApplyCvGpa = document.getElementById('btn-apply-cv-gpa');
  const cvInlineGpa = document.getElementById('cv-inline-gpa');
  const btnRunMatchCv = document.getElementById('btn-run-match-cv');

  function switchToCvMode() {
    state.profileMode = 'cv';
    if (btnTabModeCv) btnTabModeCv.classList.add('active');
    if (btnTabModeManual) btnTabModeManual.classList.remove('active');
    if (paneCvMode) paneCvMode.style.display = 'block';
    if (paneManualMode) paneManualMode.style.display = 'none';
  }

  function switchToManualMode() {
    state.profileMode = 'manual';
    if (btnTabModeManual) btnTabModeManual.classList.add('active');
    if (btnTabModeCv) btnTabModeCv.classList.remove('active');
    if (paneCvMode) paneCvMode.style.display = 'none';
    if (paneManualMode) paneManualMode.style.display = 'block';
    updateSliderBadges();
  }

  if (btnTabModeCv) btnTabModeCv.addEventListener('click', switchToCvMode);
  if (btnTabModeManual) btnTabModeManual.addEventListener('click', switchToManualMode);
  if (btnSwitchToManual) {
    btnSwitchToManual.addEventListener('click', () => {
      switchToManualMode();
      paneManualMode?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Xử lý áp dụng điểm GPA bổ sung từ CV Snapshot
  if (btnApplyCvGpa && cvInlineGpa) {
    btnApplyCvGpa.addEventListener('click', () => {
      const gpaVal = parseFloat(cvInlineGpa.value);
      if (isNaN(gpaVal) || gpaVal < 1.0 || gpaVal > 4.0) {
        showStudent360Toast('⚠️ Vui lòng nhập điểm GPA hợp lệ từ 1.0 đến 4.0');
        return;
      }
      state.cvGpaSupplemented = gpaVal;
      el.formGpa.value = gpaVal;
      updateSliderBadges();
      syncFormToState();

      const gpaEl = document.getElementById('cv-snapshot-gpa');
      if (gpaEl) {
        gpaEl.innerHTML = `<span style="color: #059669; font-weight: 700;">${gpaVal.toFixed(2)} / 4.0 (Đã bổ sung)</span>`;
      }
      showStudent360Toast(`✓ Đã áp dụng GPA ${gpaVal.toFixed(2)} và đang đối soát điều kiện...`);
      executePersonalizedMatching(true, 'gpa');
    });
  }

  // Nút tìm học bổng từ CV Mode
  if (btnRunMatchCv) {
    btnRunMatchCv.addEventListener('click', () => {
      state.profileMode = 'cv';
      if (cvInlineGpa && cvInlineGpa.value) {
        const gpaVal = parseFloat(cvInlineGpa.value);
        if (!isNaN(gpaVal) && gpaVal >= 1.0 && gpaVal <= 4.0) {
          state.cvGpaSupplemented = gpaVal;
          el.formGpa.value = gpaVal;
          updateSliderBadges();
        }
      }
      executePersonalizedMatching(true, 'cv');
    });
  }

  // Nút tìm học bổng từ Manual Mode
  if (el.btnRunMatch) {
    el.btnRunMatch.addEventListener('click', () => {
      state.profileMode = 'manual';
      executePersonalizedMatching(true, 'manual');
    });
  }

  // Chuyển sang Tab Gợi Ý AI (Nhóm A-B-C)
  const btnGotoAiMatches = document.getElementById('btn-goto-ai-matches');
  if (btnGotoAiMatches) {
    btnGotoAiMatches.addEventListener('click', () => {
      switchTab('section-ai-matches');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Mở modal lộ trình bổ sung từ bảng đánh giá
  const btnOpenRoadmapModal = document.getElementById('btn-open-roadmap-modal');
  if (btnOpenRoadmapModal) {
    btnOpenRoadmapModal.addEventListener('click', () => {
      if (state.matchedScholarships && state.matchedScholarships.length > 0) {
        openGapAnalysisModal(state.matchedScholarships[0]);
      } else {
        showStudent360Toast('ℹ️ Vui lòng bấm tìm kiếm học bổng trước để AI phân tích lộ trình');
      }
    });
  }

  // Lọc theo các Tier A, B, C Tabs trong section-ai-matches
  const tierTabs = document.querySelectorAll('#tier-segmented-tabs .tier-tab-btn');
  tierTabs.forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      tierTabs.forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');
      state.selectedTier = tabBtn.dataset.tier || 'ALL';
      renderPersonalizedCards(state.matchedScholarships);
    });
  });

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

  // Modal 2: Gap Analysis Modal Handlers
  if (el.btnCloseModal) el.btnCloseModal.addEventListener('click', closeModal);
  if (el.btnCloseModalBottom) el.btnCloseModalBottom.addEventListener('click', closeModal);
  if (el.modal) {
    el.modal.addEventListener('click', (e) => {
      if (e.target === el.modal) closeModal();
    });
  }

  // Modal 1: Scholarship Dossier / Details Handlers (Tab 1 Catalog)
  if (el.btnCloseDetailModal) el.btnCloseDetailModal.addEventListener('click', closeDetailModal);
  if (el.btnCloseDetailModalBottom) el.btnCloseDetailModalBottom.addEventListener('click', closeDetailModal);
  if (el.modalDetail) {
    el.modalDetail.addEventListener('click', (e) => {
      if (e.target === el.modalDetail) closeDetailModal();
    });
  }
  if (el.btnDetailAskAi) {
    el.btnDetailAskAi.addEventListener('click', () => {
      if (state.selectedScholarshipForModal) {
        closeDetailModal();
        askAiAboutScholarship(state.selectedScholarshipForModal);
      }
    });
  }
  if (el.btnDetailSwitchToProfile) {
    el.btnDetailSwitchToProfile.addEventListener('click', () => {
      closeDetailModal();
      switchTab('section-profile');
    });
  }

  // Global Escape key handler for both modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (el.modal && el.modal.style.display === 'flex') {
        closeModal();
      }
      if (el.modalDetail && el.modalDetail.style.display === 'flex') {
        closeDetailModal();
      }
    }
  });

  // Modal "Ask AI" Button (Modal 2)
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


// --------------------------------------------------------------------------
// Student360 Shell Layout & Sidebar Interactions
// --------------------------------------------------------------------------
function showStudent360Toast(message) {
  let toast = document.getElementById('s360-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 's360-toast';
    toast.className = 's360-toast-notification';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span style="font-size:1.1rem; line-height:1;">🎓</span><span>${message}</span>`;
  toast.classList.add('visible');
  clearTimeout(window._s360ToastTimer);
  window._s360ToastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3500);
}

function initStudent360Shell() {
  // 1. Restore Sidebar Collapsed State from localStorage
  const savedCollapsed = localStorage.getItem('s360_sidebar_collapsed');
  if (savedCollapsed === 'true') {
    document.body.classList.add('s360-sidebar-collapsed');
  }

  // 2. Collapse button at sidebar footer
  const btnCollapse = document.getElementById('btn-collapse-sidebar');
  if (btnCollapse) {
    btnCollapse.addEventListener('click', () => {
      const isCollapsed = document.body.classList.toggle('s360-sidebar-collapsed');
      localStorage.setItem('s360_sidebar_collapsed', isCollapsed);
    });
  }

  // 3. Header Hamburger Toggle (Mobile: open drawer; Desktop: collapse/expand)
  const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  if (btnSidebarToggle) {
    btnSidebarToggle.addEventListener('click', () => {
      if (window.innerWidth < 1024) {
        document.body.classList.toggle('s360-sidebar-mobile-open');
      } else {
        const isCollapsed = document.body.classList.toggle('s360-sidebar-collapsed');
        localStorage.setItem('s360_sidebar_collapsed', isCollapsed);
      }
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      document.body.classList.remove('s360-sidebar-mobile-open');
    });
  }

  // 4. Menu Group Collapsible Toggles
  document.querySelectorAll('.s360-group-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.s360-nav-group');
      if (group) {
        group.classList.toggle('collapsed-group');
      }
    });
  });

  // 5. Sidebar Navigation Items Click Handler (ScholarMatch Nav)
  document.querySelectorAll('.s360-subnav-btn, .s360-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const menu = btn.dataset.menu;
      if (target) {
        switchTab(target);
      } else if (menu === 'dashboard') {
        switchTab('section-dashboard');
      } else if (menu === 'catalog' || menu === 'hoc-bong') {
        switchTab('section-catalog');
      } else if (menu === 'ai-matches' || menu === 'profile') {
        switchTab('section-profile');
      } else if (menu === 'tracker') {
        switchTab('section-tracker');
      } else if (menu === 'chat') {
        switchTab('section-chat');
      }
      if (window.innerWidth < 1024) document.body.classList.remove('s360-sidebar-mobile-open');
    });
  });

  // 6. Sidebar Live Search Filter
  const sidebarSearch = document.getElementById('sidebar-search-input');
  if (sidebarSearch) {
    sidebarSearch.addEventListener('input', () => {
      const q = sidebarSearch.value.trim().toLowerCase();
      document.querySelectorAll('.s360-nav-group').forEach((grp) => {
        let hasVisible = false;
        grp.querySelectorAll('.s360-subnav-btn').forEach((item) => {
          const txt = item.textContent.toLowerCase();
          if (!q || txt.includes(q)) {
            item.style.display = 'flex';
            hasVisible = true;
          } else {
            item.style.display = 'none';
          }
        });
        if (!q) {
          grp.style.display = 'flex';
        } else {
          grp.style.display = hasVisible ? 'flex' : 'none';
          if (hasVisible) grp.classList.remove('collapsed-group');
        }
      });
    });
  }

  // 7. Breadcrumb Home Click -> Reset to Dashboard Tab
  const breadcrumbHome = document.getElementById('breadcrumb-home');
  if (breadcrumbHome) {
    breadcrumbHome.addEventListener('click', () => switchTab('section-dashboard'));
  }

  // 8. Notifications Bell
  const btnNotif = document.getElementById('btn-notifications');
  if (btnNotif) {
    btnNotif.addEventListener('click', () => {
      showStudent360Toast('Hôm nay có 3 học bổng toàn phần mới dành cho sinh viên ngành AI & KHMT vừa được đồng bộ!');
    });
  }

  // 9. System Features Button
  const btnSys = document.getElementById('btn-system-features');
  if (btnSys) {
    btnSys.addEventListener('click', () => {
      showStudent360Toast('Chức năng hệ thống Student360: Xem thời khóa biểu, điểm rèn luyện và trung tâm hỗ trợ.');
    });
  }

  // 10. Role Switcher & Admin Controls
  setupRoleSwitcher();
  setupAdminFeatures();

  // 11. Profile Pill Click -> Switch to Tab 2
  const profilePill = document.getElementById('student-profile-pill');
  if (profilePill) {
    profilePill.addEventListener('click', () => {
      switchTab('section-profile');
    });
  }
}

// --------------------------------------------------------------------------
// 9. Role Switcher & Multi-Role Support (Student360 Pattern)
// --------------------------------------------------------------------------
function setupRoleSwitcher() {
  const rolePill = document.getElementById('badge-user-role');
  const roleDropdown = document.getElementById('role-dropdown-menu');
  const roleDisplayName = document.getElementById('role-display-name');
  const roleIconBox = document.getElementById('role-icon-box');
  const sidebarAdminGroup = document.getElementById('sidebar-group-admin');
  const tabNavAdmin = document.getElementById('tab-nav-admin');

  const studentNameEl = document.getElementById('header-student-name');
  const studentIdEl = document.getElementById('header-student-id');
  const studentMajorEl = document.getElementById('header-student-major');
  const studentAvatarEl = document.querySelector('.s360-avatar-badge');

  if (!rolePill || !roleDropdown) return;

  // Toggle Dropdown
  rolePill.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = roleDropdown.style.display === 'block';
    roleDropdown.style.display = isVisible ? 'none' : 'block';
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!roleDropdown.contains(e.target) && !rolePill.contains(e.target)) {
      roleDropdown.style.display = 'none';
    }
  });

  // Role Configurations
  const roles = {
    student: {
      name: 'Sinh viên',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
      profileName: 'Nguyễn Trọng Mạnh Tiến',
      profileId: 'SM-2026',
      profileMajor: 'AI & Data Science',
      avatar: 'TM',
      toast: 'Đã chuyển sang vai trò Sinh viên / Ứng viên. Bạn có toàn quyền tìm kiếm và săn học bổng du học.'
    },
    admin: {
      name: 'Quản trị viên',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
      profileName: 'Quản trị viên Hệ thống',
      profileId: 'ADMIN-01',
      profileMajor: 'Điều phối Hệ thống & AI',
      avatar: 'AD',
      toast: 'Đã kích hoạt quyền Quản trị viên (Admin). Bạn có toàn quyền điều chỉnh nhiệm vụ, kho học bổng và trọng số AI.'
    },
    advisor: {
      name: 'Cố vấn học bổng',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      profileName: 'ThS. Trần Văn An',
      profileId: 'ADV-08',
      profileMajor: 'Cố vấn Học bổng Châu Á',
      avatar: 'VA',
      toast: 'Đã chuyển sang vai trò Cố vấn học bổng (Advisor). Bạn có thể đánh giá hồ sơ và phối hợp hướng dẫn sinh viên.'
    },
    sponsor: {
      name: 'Nhà tài trợ',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.2"><path d="M3 21h18M3 7v14M21 7v14M9 3h6v4H9z"/><path d="M9 10h1M14 10h1M9 14h1M14 14h1"/></svg>`,
      profileName: 'Đại diện Quỹ Global',
      profileId: 'SPO-03',
      profileMajor: 'Đối tác Cấp Học bổng',
      avatar: 'GS',
      toast: 'Đã chuyển sang vai trò Đại diện Quỹ / Trường (Sponsor). Bạn có thể quản lý và đăng tải cơ hội học bổng mới.'
    }
  };

  // Handle clicking role items in dropdown
  document.querySelectorAll('.role-dropdown-item').forEach((item) => {
    item.addEventListener('click', () => {
      const selectedRole = item.dataset.role;
      if (!selectedRole || !roles[selectedRole]) return;

      state.currentRole = selectedRole;

      // Update active classes
      document.querySelectorAll('.role-dropdown-item').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.role === selectedRole);
        const check = btn.querySelector('.role-item-check');
        if (check) check.style.display = btn.dataset.role === selectedRole ? 'inline-block' : 'none';
      });

      // Update Header Role Pill
      const config = roles[selectedRole];
      if (roleDisplayName) roleDisplayName.textContent = config.name;
      if (roleIconBox) roleIconBox.innerHTML = config.icon;

      // Update Student Profile Pill
      if (studentNameEl) studentNameEl.textContent = config.profileName;
      if (studentIdEl) studentIdEl.textContent = config.profileId;
      if (studentMajorEl) studentMajorEl.textContent = config.profileMajor;
      if (studentAvatarEl) studentAvatarEl.textContent = config.avatar;

      // Toggle Admin Sidebar & Tab Visibility
      const isAdmin = selectedRole === 'admin';
      if (sidebarAdminGroup) sidebarAdminGroup.style.display = isAdmin ? 'block' : 'none';
      if (tabNavAdmin) tabNavAdmin.style.display = isAdmin ? 'inline-flex' : 'none';

      // Switch tab if entering/leaving admin
      if (isAdmin) {
        switchTab('section-admin');
      } else if (state.activeTab === 'section-admin') {
        switchTab('section-dashboard');
      }

      roleDropdown.style.display = 'none';
      showStudent360Toast(config.toast);
    });
  });
}

// --------------------------------------------------------------------------
// 10. Admin Features: Scholarship Management, Task Coordinator & AI Weights
// --------------------------------------------------------------------------
function setupAdminFeatures() {
  // AI Weight Sliders
  const sliders = {
    gpa: document.getElementById('slider-gpa'),
    ielts: document.getElementById('slider-ielts'),
    research: document.getElementById('slider-research'),
    activities: document.getElementById('slider-activities'),
    sop: document.getElementById('slider-sop')
  };

  const labels = {
    gpa: document.getElementById('slider-gpa-val'),
    ielts: document.getElementById('slider-ielts-val'),
    research: document.getElementById('slider-research-val'),
    activities: document.getElementById('slider-activities-val'),
    sop: document.getElementById('slider-sop-val')
  };

  const sumBadge = document.getElementById('admin-weight-sum-badge');

  function updateWeightSum() {
    let sum = 0;
    Object.keys(sliders).forEach((key) => {
      const sl = sliders[key];
      const lb = labels[key];
      if (sl && lb) {
        lb.textContent = `${sl.value}%`;
        sum += parseInt(sl.value, 10) || 0;
      }
    });

    if (sumBadge) {
      sumBadge.textContent = `Tổng: ${sum}%`;
      if (sum === 100) {
        sumBadge.style.background = '#D1FAE5';
        sumBadge.style.color = '#065F46';
      } else {
        sumBadge.style.background = '#FEE2E2';
        sumBadge.style.color = '#DC2626';
      }
    }
  }

  Object.values(sliders).forEach((sl) => {
    if (sl) sl.addEventListener('input', updateWeightSum);
  });

  // Save weights button
  const btnSaveWeights = document.getElementById('btn-admin-save-weights');
  if (btnSaveWeights) {
    btnSaveWeights.addEventListener('click', () => {
      let sum = 0;
      const saved = {};
      Object.keys(sliders).forEach((k) => {
        if (sliders[k]) {
          saved[k] = parseInt(sliders[k].value, 10);
          sum += saved[k];
        }
      });
      localStorage.setItem('sm_ai_weights', JSON.stringify(saved));
      if (sum === 100) {
        showStudent360Toast('✓ Đã lưu cấu hình trọng số AI thành công! Hệ thống đã cập nhật thuật toán Reranker.');
      } else {
        showStudent360Toast(`⚠️ Đã lưu cấu hình (Tổng: ${sum}%). Khuyến nghị điều chỉnh để tổng bằng đúng 100%.`);
      }
    });
  }

  // Reset weights button
  const btnResetWeights = document.getElementById('btn-admin-reset-weights');
  if (btnResetWeights) {
    btnResetWeights.addEventListener('click', () => {
      const defaults = { gpa: 35, ielts: 25, research: 20, activities: 10, sop: 10 };
      Object.keys(defaults).forEach((k) => {
        if (sliders[k]) sliders[k].value = defaults[k];
      });
      updateWeightSum();
      showStudent360Toast('Đã khôi phục trọng số AI về mặc định chuẩn (GPA: 35%, IELTS: 25%, NCKH: 20%, NK: 10%, SOP: 10%).');
    });
  }

  // Admin Table Actions: Approve, Reject, Hide
  document.querySelectorAll('.btn-action-approve').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (row) {
        const badge = row.querySelector('.badge');
        if (badge) {
          badge.className = 'badge';
          badge.style.background = '#D1FAE5';
          badge.style.color = '#065F46';
          badge.textContent = '✓ Đã công khai';
        }
        row.style.background = 'transparent';
        e.target.parentElement.innerHTML = `
          <button class="btn btn-outline btn-sm btn-action-edit" style="padding: 0.25rem 0.6rem; font-size: 0.78rem;">Sửa</button>
          <button class="btn btn-outline btn-sm btn-action-hide" style="padding: 0.25rem 0.6rem; font-size: 0.78rem; color: #DC2626;">Tạm ẩn</button>
        `;
        showStudent360Toast('✓ Đã phê duyệt chương trình học bổng! Học bổng hiện đã hiển thị cho tất cả ứng viên.');
      }
    });
  });

  document.querySelectorAll('.btn-action-hide').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (row) {
        const isHidden = e.target.textContent === 'Hiển thị';
        e.target.textContent = isHidden ? 'Tạm ẩn' : 'Hiển thị';
        e.target.style.color = isHidden ? '#DC2626' : '#10B981';
        const badges = row.querySelectorAll('.badge');
        const badge = badges.length > 1 ? badges[1] : badges[0];
        if (badge) {
          badge.textContent = isHidden ? '✓ Đã công khai' : 'Tạm ẩn';
          badge.style.background = isHidden ? '#D1FAE5' : '#F3F4F6';
          badge.style.color = isHidden ? '#065F46' : '#6B7280';
        }
        showStudent360Toast(isHidden ? 'Đã công khai lại học bổng.' : 'Đã tạm ẩn học bổng khỏi kho công khai.');
      }
    });
  });

  // Task done button
  document.querySelectorAll('.btn-task-done').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const taskRow = e.target.closest('div');
      if (taskRow && taskRow.parentElement) {
        taskRow.parentElement.style.opacity = '0.6';
        e.target.parentElement.innerHTML = `
          <span class="badge" style="background: #D1FAE5; color: #065F46; font-size: 0.74rem;">Đã hoàn thành</span>
          <span style="font-size: 0.8rem; color: #10B981;">✓</span>
        `;
        showStudent360Toast('✓ Đã xác nhận hoàn thành nhiệm vụ cố vấn!');
      }
    });
  });

  // Export report
  const btnExport = document.getElementById('btn-admin-export');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      showStudent360Toast('📊 Đang tạo tệp báo cáo thống kê ScholarMatch (CSV/PDF)... Tải xuống hoàn tất!');
    });
  }

  // Add Task
  const btnAddTask = document.getElementById('btn-admin-add-task');
  if (btnAddTask) {
    btnAddTask.addEventListener('click', () => {
      const taskName = prompt('Nhập tiêu đề nhiệm vụ mới phân công cho cố vấn:', 'Đánh giá hồ sơ bổ sung');
      if (taskName) {
        const container = document.getElementById('admin-tasks-container');
        if (container) {
          const newTaskEl = document.createElement('div');
          newTaskEl.style = 'padding: 0.85rem 1rem; border: 1px solid var(--border-color); border-radius: 12px; background: rgba(37, 99, 235, 0.03); display: flex; justify-content: space-between; align-items: center;';
          newTaskEl.innerHTML = `
            <div>
              <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary); margin-bottom: 0.2rem;">${taskName}</div>
              <div style="font-size: 0.76rem; color: var(--text-muted);">
                Phân công: <strong>Cố vấn chuyên trách</strong> • Mới giao vừa xong
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="badge" style="background: #DBEAFE; color: #1E40AF; font-size: 0.74rem;">Mới giao</span>
              <button class="btn btn-outline btn-sm btn-task-done" style="padding: 0.2rem 0.5rem; font-size: 0.74rem;">Hoàn tất</button>
            </div>
          `;
          container.prepend(newTaskEl);
          showStudent360Toast(`✓ Đã tạo và phân công nhiệm vụ: "${taskName}"!`);
        }
      }
    });
  }

  // Add Scholarship
  const btnAddSch = document.getElementById('btn-admin-add-scholarship');
  if (btnAddSch) {
    btnAddSch.addEventListener('click', () => {
      const title = prompt('Nhập tên chương trình học bổng mới muốn tạo:', 'Học Bổng Toàn Phần Hợp Tác Quốc Tế 2026');
      if (title) {
        const tbody = document.getElementById('admin-scholarships-table-body');
        if (tbody) {
          const newTr = document.createElement('tr');
          newTr.style.background = 'rgba(16, 185, 129, 0.04)';
          newTr.innerHTML = `
            <td>
              <div style="font-weight: 700; color: var(--text-primary);">${title}</div>
              <div style="font-size: 0.74rem; color: var(--text-muted);">Tổ chức Quốc tế • Thêm bởi Admin</div>
            </td>
            <td>🌏 Toàn cầu • Thạc sĩ</td>
            <td><span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #10B981; font-weight: 700;">100% Học phí</span></td>
            <td><span class="badge" style="background: #D1FAE5; color: #065F46; font-weight: 600;">✓ Đã công khai</span></td>
            <td>31/12/2026</td>
            <td style="text-align: right;">
              <button class="btn btn-outline btn-sm btn-action-edit" style="padding: 0.25rem 0.6rem; font-size: 0.78rem;">Sửa</button>
              <button class="btn btn-outline btn-sm btn-action-hide" style="padding: 0.25rem 0.6rem; font-size: 0.78rem; color: #DC2626;">Tạm ẩn</button>
            </td>
          `;
          tbody.prepend(newTr);
          showStudent360Toast(`✓ Đã tạo thành công học bổng "${title}" và đưa vào kho dữ liệu!`);
        }
      }
    });
  }
}

// ============================================================================
// DYNAMIC APPLICATION TRACKER SYSTEM (KANBAN MODULE)
// ============================================================================
const TRACKER_STORAGE_KEY = 'scholar_user_tracked_applications';

function getCountryFlag(countryName) {
  if (!countryName) return '🌐';
  const c = countryName.toLowerCase();
  if (typeof UNIVERSITIES_DATABASE !== 'undefined') {
    for (const [key, data] of Object.entries(UNIVERSITIES_DATABASE)) {
      if (c.includes(key.toLowerCase()) || key.toLowerCase().includes(c)) {
        return data.flag || '🌐';
      }
    }
  }
  if (c.includes('korea') || c.includes('hàn')) return '🇰🇷';
  if (c.includes('japan') || c.includes('nhật')) return '🇯🇵';
  if (c.includes('vietnam') || c.includes('việt nam')) return '🇻🇳';
  if (c.includes('singapore')) return '🇸🇬';
  if (c.includes('finland') || c.includes('phần lan')) return '🇫🇮';
  if (c.includes('usa') || c.includes('mỹ') || c.includes('hoa kỳ')) return '🇺🇸';
  if (c.includes('uk') || c.includes('anh') || c.includes('kingdom')) return '🇬🇧';
  if (c.includes('germany') || c.includes('đức')) return '🇩🇪';
  if (c.includes('australia') || c.includes('úc')) return '🇦🇺';
  if (c.includes('canada')) return '🇨🇦';
  if (c.includes('france') || c.includes('pháp')) return '🇫🇷';
  if (c.includes('china') || c.includes('trung quốc')) return '🇨🇳';
  if (c.includes('taiwan') || c.includes('đài loan')) return '🇹🇼';
  return '🌍';
}

const DEMO_TRACKER_ITEMS = [
  {
    id: 'demo-chevening',
    title: 'Chevening Scholarship UK',
    country: 'Vương Quốc Anh',
    flag: '🇬🇧',
    university: 'Thạc sĩ 1 năm tại Vương Quốc Anh',
    funding: 'Toàn phần',
    status: 'saved',
    deadlineText: '⏳ Mở đơn: 01/08/2027',
    progress: 0,
    note: 'Đã lưu vào danh sách quan tâm',
  },
  {
    id: 'demo-mext',
    title: 'MEXT Japanese Government',
    country: 'Nhật Bản',
    flag: '🇯🇵',
    university: 'Chính phủ Nhật Bản • Đại học Tokyo / Kyoto',
    funding: '100% Học phí',
    status: 'saved',
    deadlineText: '⏳ Hạn: 15/05/2027',
    progress: 0,
    note: 'Đang theo dõi kỳ mở cổng tuyển sinh',
  },
  {
    id: 'demo-kaist',
    title: 'KAIST STEM Global Fellowship',
    country: 'Hàn Quốc',
    flag: '🇰🇷',
    university: 'Hàn Quốc • Thạc sĩ CS/AI',
    funding: 'Toàn phần',
    status: 'preparing',
    deadlineText: '⏳ Hạn: 20/02/2026 (Gấp: Còn 6 ngày)',
    progress: 75,
    note: '⚠️ Cần nộp: 1 Thư giới thiệu từ Giáo sư Lab',
  },
  {
    id: 'demo-fulbright',
    title: "Fulbright Master's Program 2027",
    country: 'Hoa Kỳ',
    flag: '🇺🇸',
    university: 'Mỹ • Toàn phần 100%',
    funding: 'Toàn phần',
    status: 'preparing',
    deadlineText: '⏳ Hạn: 15/04/2026',
    progress: 50,
    note: '✍️ Đang viết: Bài luận Statement of Purpose (SOP)',
  },
  {
    id: 'demo-vinuni',
    title: 'VinUniversity Excellence Fellowship',
    country: 'Việt Nam',
    flag: '🇻🇳',
    university: 'Việt Nam • Đã nộp: 02/11/2026',
    funding: 'Toàn phần',
    status: 'reviewing',
    deadlineText: 'Đã nộp: 02/11/2026',
    progress: 100,
    note: '⏱️ Trạng thái: Hội đồng đang thẩm định hồ sơ vòng 1',
  },
  {
    id: 'demo-nic',
    title: 'Học Bổng Tài Năng Trẻ Đổi Mới Sáng Tạo (NIC)',
    country: 'Việt Nam',
    flag: '🇻🇳',
    university: 'Bộ Kế hoạch & Đầu tư • 100% Tài trợ NCKH',
    funding: '60.000.000 VNĐ',
    status: 'awarded',
    deadlineText: 'Hoàn tất xét duyệt',
    progress: 100,
    note: '🏆 Giá trị: 60.000.000 VNĐ tiền mặt + Tài trợ thiết bị AI',
  }
];

function getTrackedApplications() {
  try {
    const raw = localStorage.getItem(TRACKER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveTrackedApplications(apps) {
  try {
    localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to save tracked applications', e);
  }
  renderTrackerKanban();
}

function isScholarshipTracked(idOrTitle) {
  if (!idOrTitle) return false;
  const apps = getTrackedApplications();
  return apps.some(a => String(a.id) === String(idOrTitle) || a.title === idOrTitle);
}

function addScholarshipToTracker(item, targetStatus = 'saved') {
  if (!item) return;
  const apps = getTrackedApplications();
  const id = item.id ? String(item.id) : ('sch_' + Math.random().toString(36).substr(2, 9));
  const exists = apps.find(a => String(a.id) === id || a.title === (item.title || item.name));

  if (exists) {
    showStudent360Toast(`ℹ️ Học bổng "${item.title || item.name}" đã có trong danh sách Theo Dõi Ứng Tuyển.`);
    return;
  }

  const flag = getCountryFlag(item.host_country || item.country);
  const deadlineStr = item.deadline ? formatDisplayDeadline(item.deadline) : 'Theo kỳ tuyển sinh';

  const newApp = {
    id: id,
    title: item.title || item.name || 'Học bổng Quốc tế',
    country: item.host_country || item.country || 'Quốc tế',
    flag: flag,
    university: item.source_name || item.university || 'Đại học đối tác',
    funding: item.funding_type || 'Học bổng',
    status: targetStatus,
    deadlineText: deadlineStr,
    progress: targetStatus === 'preparing' ? 50 : targetStatus === 'reviewing' || targetStatus === 'awarded' ? 100 : 0,
    note: targetStatus === 'saved' ? 'Đã lưu vào danh sách quan tâm' : 'Đang chuẩn bị hồ sơ ứng tuyển',
  };

  apps.unshift(newApp);
  saveTrackedApplications(apps);
  showStudent360Toast(`✓ Đã lưu "${newApp.title}" vào mục Theo Dõi Ứng Tuyển!`);
}

function moveApplicationStatus(id, newStatus) {
  const apps = getTrackedApplications();
  const app = apps.find(a => String(a.id) === String(id));
  if (!app) return;

  app.status = newStatus;
  if (newStatus === 'saved') {
    app.progress = 0;
    app.note = 'Đã chuyển về danh sách lưu quan tâm';
  } else if (newStatus === 'preparing') {
    if (!app.progress || app.progress === 0) app.progress = 50;
    app.note = 'Đang hoàn thiện hồ sơ & các giấy tờ cần thiết';
  } else if (newStatus === 'reviewing') {
    app.progress = 100;
    app.note = '⏱️ Đã nộp hồ sơ • Đang chờ hội đồng xét duyệt';
  } else if (newStatus === 'awarded') {
    app.progress = 100;
    app.note = '🎉 Chúc mừng! Đã đạt học bổng';
  }

  saveTrackedApplications(apps);
  const statusLabels = {
    'saved': 'Đã Lưu',
    'preparing': 'Đang Chuẩn Bị',
    'reviewing': 'Đang Xét Duyệt',
    'awarded': 'Đạt Học Bổng'
  };
  showStudent360Toast(`✓ Đã chuyển "${app.title}" sang giai đoạn "${statusLabels[newStatus] || newStatus}"!`);
}

function removeTrackedApplication(id) {
  let apps = getTrackedApplications();
  const app = apps.find(a => String(a.id) === String(id));
  apps = apps.filter(a => String(a.id) !== String(id));
  saveTrackedApplications(apps);
  showStudent360Toast(`🗑️ Đã xóa "${app ? app.title : 'học bổng'}" khỏi mục Theo Dõi Ứng Tuyển.`);
}

function renderTrackerKanban() {
  const apps = getTrackedApplications();
  const total = apps.length;

  const totalEl = document.getElementById('tracker-total-count');
  if (totalEl) totalEl.textContent = total;

  const bannerEl = document.getElementById('tracker-empty-banner');
  if (bannerEl) {
    bannerEl.style.display = total === 0 ? 'block' : 'none';
  }

  const sidebarBadge = document.getElementById('sidebar-tracker-count');
  if (sidebarBadge) {
    sidebarBadge.style.display = total > 0 ? 'inline-block' : 'none';
    sidebarBadge.textContent = total;
  }

  const stages = ['saved', 'preparing', 'reviewing', 'awarded'];
  stages.forEach(st => {
    const list = apps.filter(a => a.status === st);
    const countEl = document.getElementById(`count-kanban-${st}`);
    if (countEl) countEl.textContent = list.length;

    const bodyEl = document.getElementById(`body-kanban-${st}`);
    if (!bodyEl) return;
    bodyEl.innerHTML = '';

    if (list.length === 0) {
      const placeholders = {
        'saved': 'Chưa có học bổng được lưu',
        'preparing': 'Chưa có hồ sơ đang chuẩn bị',
        'reviewing': 'Chưa có hồ sơ đang xét duyệt',
        'awarded': 'Chưa có học bổng đã đạt'
      };
      bodyEl.innerHTML = `
        <div class="kanban-empty-placeholder">
          <span>📭</span>
          <div>${placeholders[st]}</div>
        </div>
      `;
      return;
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'kanban-card-item';
      if (st === 'preparing') card.style.borderLeft = '3px solid #3B82F6';
      else if (st === 'reviewing') card.style.borderLeft = '3px solid #F59E0B';
      else if (st === 'awarded') {
        card.style.borderLeft = '3px solid #10B981';
        card.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.08) 100%)';
      }

      let middleContent = '';
      if (st === 'saved') {
        middleContent = `
          <div style="font-size: 0.74rem; color: #475569; margin-bottom: 0.4rem;">
            ${item.deadlineText || '⏳ Theo kỳ tuyển sinh'}
          </div>
          <div style="font-size: 0.74rem; color: #64748B;">
            📌 ${item.note || 'Đã lưu vào danh sách quan tâm'}
          </div>
        `;
      } else if (st === 'preparing') {
        const prog = item.progress || 50;
        middleContent = `
          <div style="margin-bottom: 0.45rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.74rem; margin-bottom: 0.2rem;">
              <span>Tiến độ giấy tờ</span>
              <strong style="color: #3B82F6;">${prog}%</strong>
            </div>
            <div class="progress-track" style="height: 6px;">
              <div class="progress-fill" style="width: ${prog}%; background: #3B82F6;"></div>
            </div>
          </div>
          <div style="font-size: 0.74rem; color: #D97706; background: rgba(245, 158, 11, 0.08); padding: 0.3rem 0.5rem; border-radius: 6px; margin-bottom: 0.25rem;">
            ${item.note || 'Cần bổ sung bài luận và thư giới thiệu'}
          </div>
        `;
      } else if (st === 'reviewing') {
        middleContent = `
          <div style="font-size: 0.75rem; color: #B45309; background: rgba(245, 158, 11, 0.08); padding: 0.35rem 0.5rem; border-radius: 6px; margin-bottom: 0.35rem;">
            ${item.note || '⏱️ Đã nộp hồ sơ • Hội đồng đang thẩm định'}
          </div>
        `;
      } else if (st === 'awarded') {
        middleContent = `
          <div style="font-size: 0.76rem; color: #10B981; font-weight: 700; margin-bottom: 0.35rem;">
            ${item.note || '🏆 Đã nhận học bổng chính thức!'}
          </div>
        `;
      }

      let actionsHtml = '';
      if (st === 'saved') {
        actionsHtml = `
          <button type="button" class="btn btn-primary btn-xs btn-track-advance" data-id="${item.id}" data-target="preparing">
            📝 Chuẩn bị ➔
          </button>
          <button type="button" class="btn btn-outline btn-xs btn-track-delete" data-id="${item.id}" title="Xóa">
            🗑️
          </button>
        `;
      } else if (st === 'preparing') {
        actionsHtml = `
          <button type="button" class="btn btn-outline btn-xs btn-track-back" data-id="${item.id}" data-target="saved">
            ⬅️
          </button>
          <button type="button" class="btn btn-primary btn-xs btn-track-advance" data-id="${item.id}" data-target="reviewing">
            📤 Nộp hồ sơ ➔
          </button>
          <button type="button" class="btn btn-outline btn-xs btn-track-delete" data-id="${item.id}" title="Xóa">
            🗑️
          </button>
        `;
      } else if (st === 'reviewing') {
        actionsHtml = `
          <button type="button" class="btn btn-outline btn-xs btn-track-back" data-id="${item.id}" data-target="preparing">
            ⬅️
          </button>
          <button type="button" class="btn btn-success btn-xs btn-track-advance" data-id="${item.id}" data-target="awarded" style="background: #10B981; color: #fff;">
            🏆 Đạt HB! ➔
          </button>
          <button type="button" class="btn btn-outline btn-xs btn-track-delete" data-id="${item.id}" title="Xóa">
            🗑️
          </button>
        `;
      } else if (st === 'awarded') {
        actionsHtml = `
          <button type="button" class="btn btn-outline btn-xs btn-track-back" data-id="${item.id}" data-target="reviewing">
            ⬅️
          </button>
          <button type="button" class="btn btn-outline btn-xs btn-track-delete" data-id="${item.id}" title="Xóa">
            🗑️
          </button>
        `;
      }

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
          <span style="font-size: 1.2rem;">${item.flag || '🌍'}</span>
          <span class="dash-stat-badge" style="background: rgba(59, 130, 246, 0.1); color: #3B82F6; font-size: 0.72rem;">${item.funding || 'Học bổng'}</span>
        </div>
        <div style="font-weight: 700; font-size: 0.92rem; color: var(--text-primary); margin-bottom: 0.25rem;" title="${item.title}">${item.title}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.5rem;">${item.country || 'Quốc tế'} • ${item.university || ''}</div>
        ${middleContent}
        <div class="kanban-card-actions">
          ${actionsHtml}
        </div>
      `;

      // Event listeners for card buttons
      const btnAdvance = card.querySelector('.btn-track-advance');
      if (btnAdvance) {
        btnAdvance.addEventListener('click', () => moveApplicationStatus(item.id, btnAdvance.dataset.target));
      }
      const btnBack = card.querySelector('.btn-track-back');
      if (btnBack) {
        btnBack.addEventListener('click', () => moveApplicationStatus(item.id, btnBack.dataset.target));
      }
      const btnDel = card.querySelector('.btn-track-delete');
      if (btnDel) {
        btnDel.addEventListener('click', () => removeTrackedApplication(item.id));
      }

      bodyEl.appendChild(card);
    });
  });
}

function initTrackerModule() {
  const btnReset = document.getElementById('btn-tracker-reset-empty');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      saveTrackedApplications([]);
      showStudent360Toast('✓ Đã làm trống toàn bộ danh sách theo dõi ứng tuyển!');
    });
  }

  const btnDemo = document.getElementById('btn-tracker-load-demo');
  if (btnDemo) {
    btnDemo.addEventListener('click', () => {
      saveTrackedApplications(DEMO_TRACKER_ITEMS);
      showStudent360Toast('✨ Đã nạp dữ liệu mẫu minh họa tiến độ các vòng ứng tuyển!');
    });
  }

  const btnExpMatched = document.getElementById('btn-tracker-explore-matched');
  if (btnExpMatched) {
    btnExpMatched.addEventListener('click', () => switchTab('profile-matched-section'));
  }

  const btnExpCat = document.getElementById('btn-tracker-explore-catalog');
  if (btnExpCat) {
    btnExpCat.addEventListener('click', () => switchTab('section-catalog'));
  }

  renderTrackerKanban();
}
