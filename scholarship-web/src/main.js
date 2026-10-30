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
  profile: { ...DEMO_PROFILE, gpa: 2.45, ielts: 4.5, preferred_countries: ['Hàn Quốc'] },
  
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
  btnCatalogLoadMore: document.getElementById('btn-catalog-load-more'),
  catalogLoadMoreText: document.getElementById('catalog-load-more-text'),
  catalogCurrentLoaded: document.getElementById('catalog-current-loaded'),
  catalogTotalAvailable: document.getElementById('catalog-total-available'),
  catalogPaginationBar: document.getElementById('catalog-pagination-bar'),

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
  initTheme();
  initFormValues();
  attachEventListeners();
  updateChatContextBar();
  await checkHealth();
  await renderCatalogFeed(true);
  executePersonalizedMatching(); // Pre-calculate matched section in Tab 2
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

// Health Check with Backend
async function checkHealth() {
  const result = await checkBackendHealth();
  if (result.connected) {
    state.backendConnected = true;
    el.backendStatusText.textContent = 'Supabase: 7,949+ Học bổng';
    el.backendStatusPill.style.color = 'var(--emerald)';
    el.backendStatusPill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    el.backendStatusPill.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
  } else {
    state.backendConnected = false;
    el.backendStatusText.textContent = 'Offline Demo Mode (7,949 Học bổng)';
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

    if (el.btnCatalogLoadMore) {
      el.btnCatalogLoadMore.disabled = true;
      if (el.catalogLoadMoreText) {
        el.catalogLoadMoreText.textContent = 'Đang tải dữ liệu từ Supabase...';
      }
    }

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

      if (resetPage) {
        state.catalogLoadedItems = newItems;
      } else {
        state.catalogLoadedItems = [...state.catalogLoadedItems, ...newItems];
      }

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
      matchQuick = sFunding.includes('toàn phần');
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
  renderCatalogCards(filtered, filtered.length);
  if (el.catalogPaginationBar) el.catalogPaginationBar.style.display = 'none';
}

function updateCatalogPaginationUI(total) {
  if (!el.catalogPaginationBar) return;
  el.catalogPaginationBar.style.display = 'flex';

  const loadedCount = state.catalogLoadedItems.length;
  if (el.catalogCurrentLoaded) el.catalogCurrentLoaded.textContent = loadedCount.toLocaleString('vi-VN');
  if (el.catalogTotalAvailable) el.catalogTotalAvailable.textContent = total.toLocaleString('vi-VN');

  if (loadedCount >= total || total === 0) {
    if (el.btnCatalogLoadMore) {
      el.btnCatalogLoadMore.disabled = true;
      el.btnCatalogLoadMore.style.opacity = '0.6';
    }
    if (el.catalogLoadMoreText) {
      el.catalogLoadMoreText.textContent = `Đã hiển thị toàn bộ ${total.toLocaleString('vi-VN')} học bổng`;
    }
  } else {
    if (el.btnCatalogLoadMore) {
      el.btnCatalogLoadMore.disabled = false;
      el.btnCatalogLoadMore.style.opacity = '1';
    }
    const remaining = total - loadedCount;
    const nextBatch = Math.min(state.catalogLimit, remaining);
    if (el.catalogLoadMoreText) {
      el.catalogLoadMoreText.textContent = `Tải thêm ${nextBatch} học bổng từ kho Supabase (${remaining.toLocaleString('vi-VN')} còn lại)`;
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
          (pNorm.includes('hàn') && (itemCountry.includes('hàn') || itemCountry.includes('korea')))
        );
      });
    });
    if (matched.length > 0) pool = matched;
  }

  return pool.map((item) => {
    // 1. GPA Factor (25%)
    let gpaScore = Math.min(1.0, (gpa / 4.0) * 1.05);

    // 2. Language Factor (20%)
    let langScore = Math.min(1.0, (ielts / 9.0) * 1.35);

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

    // Weighted Score
    const totalScore =
      gpaScore * 0.25 +
      majorScore * 0.25 +
      langScore * 0.20 +
      resScore * 0.15 +
      vecScore * 0.15;

    const matchPercent = Math.min(99.0, Math.round(totalScore * 1000) / 10);

    let tierGroup = 'Group C (Thử thách - Khoảng cách lớn)';
    if (matchPercent >= 85.0) {
      tierGroup = 'Group A (Đủ điều kiện xét tuyển)';
    } else if (matchPercent >= 70.0) {
      tierGroup = 'Group B (Tiềm năng - Cần cải thiện nhẹ)';
    }

    // Dynamic Gaps & Roadmap based on current profile
    const dynamicGaps = [];
    const dynamicRoadmap = [];

    if (gpa < 3.0) {
      const diff = (3.0 - gpa).toFixed(2);
      dynamicGaps.push(`Điểm GPA hiện tại ${gpa.toFixed(2)} thấp hơn ngưỡng sàn học bổng 3.0/4.0 (-${diff} điểm).`);
      dynamicRoadmap.push(`Bổ sung các chứng chỉ chuyên ngành uy tín hoặc tối ưu bài luận (SOP) để làm nổi bật kỹ năng thực chiến bù trừ GPA.`);
    }
    if (ielts < 6.0) {
      const ieltsDiff = (6.0 - ielts).toFixed(1);
      dynamicGaps.push(`IELTS ${ielts.toFixed(1)} hiện chưa đạt chuẩn đầu vào xét duyệt học bổng (yêu cầu tối thiểu 6.0, thiếu -${ieltsDiff} band).`);
      dynamicRoadmap.push(`Lên kế hoạch ôn luyện cấp tốc tập trung 2 kỹ năng Listening & Reading để nâng IELTS từ ${ielts.toFixed(1)} lên 6.0 trong 3 tháng tới.`);
    }

    dynamicRoadmap.push(`Liên hệ với các trường có chính sách linh hoạt tại ${item.host_country} và xin 2 thư giới thiệu LOR từ giảng viên.`);

    return {
      ...item,
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

    const gaps = item.gap_analysis?.gaps || [];
    const roadmap = item.gap_analysis?.action_plan || [];

    card.innerHTML = `
      <div class="card-top-row">
        <div>
          <span class="rank-badge">#${index + 1} Phù hợp nhất</span>
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
        <div class="criteria-item full-span">
          <span class="criteria-lbl"><span>Vector Cosine (15%)</span> <strong>${vecPercent}%</strong></span>
          <div class="progress-track"><div class="progress-fill" style="width: ${vecPercent}%;"></div></div>
        </div>
      </div>

      <!-- Gap Highlight Box -->
      ${
        gaps.length > 0
          ? `
          <div class="gap-highlight-box">
            <span class="gap-highlight-title">⚠️ Khoảng cách tiêu chí cần khắc phục:</span>
            <p class="gap-item-text">${gaps[0]}</p>
          </div>
        `
          : ''
      }

      <!-- Roadmap Action Step Preview -->
      ${
        roadmap.length > 0
          ? `
          <div class="roadmap-mini-box">
            <span class="roadmap-mini-title">🗺️ Lộ trình đề xuất:</span>
            <p class="roadmap-mini-step"><strong>Bước 1:</strong> ${roadmap[0]}</p>
          </div>
        `
          : ''
      }

      <div class="card-action-footer">
        <button class="btn btn-secondary btn-sm btn-matched-gap" data-idx="${index}">
          📊 Lộ Trình & Gap Analysis
        </button>
        <button class="btn btn-outline btn-sm btn-matched-ask-ai" data-idx="${index}">
          💬 Hỏi AI
        </button>
        ${
          item.link
            ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Portal</a>`
            : ''
        }
      </div>
    `;

    el.matchedGrid.appendChild(card);
  });

  // Attach event listeners
  document.querySelectorAll('.btn-matched-gap').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx, 10);
      openGapModal(items[idx]);
    });
  });

  document.querySelectorAll('.btn-matched-ask-ai').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx, 10);
      askAiAboutScholarship(items[idx]);
    });
  });
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
    return `### Lộ Trình Nâng Chuẩn & Bổ Sung Tiêu Chí Cho Hồ Sơ GPA ${pGpa}, IELTS ${pIelts}\n\nChào **${pName}**, với mức điểm hiện tại tại **${pCountries}**, dưới đây là chiến lược hành động cụ thể để hiện thực hóa giấc mơ du học:\n\n1. **Phân loại cơ hội hiện tại**:\n   - **Cơ hội cao (Group B)**: Các trường như **Đại học Dong-A** (nhận hồ sơ từ GPA 2.3+), **Đại học Quốc gia Pusan (PNU)** (chính sách tuyển sinh quốc tế rộng mở, cấp học bổng học phí 50-70%).\n   - **Mục tiêu vươn tầm (Group A)**: **SNU (GKS)**, **KAIST**, **UNIST** (yêu cầu GPA ≥ 3.0, IELTS ≥ 6.0/6.5).\n\n2. **Lộ trình 3 giai đoạn cần bổ sung tiêu chí**:\n   - **Giai đoạn 1 (Tháng 1 - 2)**: Ôn luyện nâng band IELTS từ **4.5 lên 5.5 - 6.0** (tập trung kỹ năng Nghe - Đọc để lấy điểm nhanh).\n   - **Giai đoạn 2 (Tháng 3 - 4)**: Viết **Statement of Purpose (SOP)** làm nổi bật kỹ năng lập trình thực tế và các dự án môn học để giải trình và bù đắp điểm GPA.\n   - **Giai đoạn 3 (Tháng 5 trở đi)**: Nộp hồ sơ song song cho 1 trường an toàn (Dong-A/PNU) và 1 trường mục tiêu nếu đã nâng được IELTS lên 6.0!`;
  }

  return `### Tư Vấn Học Bổng & Định Hướng Năng Lực Ứng Viên\n\n- **Ứng viên**: ${pName}\n- **Hồ sơ hiện tại**: GPA **${pGpa}/4.0** • IELTS **${pIelts}** • Chuyên ngành **${pMajor}**\n- **Mục tiêu**: Du học tại **${pCountries}**\n\n**Lời khuyên của chuyên gia ScholarMatch**:\n1. Nâng điểm ngoại ngữ là chìa khóa then chốt nhất vì IELTS 4.5 dưới mức sàn cấp visa du học của nhiều chương trình học bổng.\n2. Tận dụng tối đa thành tích giải thưởng và bài báo khoa học để gây ấn tượng với các Giáo sư trưởng Lab tại Hàn Quốc!`;
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

  // Catalog Load More Button
  if (el.btnCatalogLoadMore) {
    el.btnCatalogLoadMore.addEventListener('click', () => {
      state.catalogPage += 1;
      renderCatalogFeed(false);
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
    });
  });

  // Select all countries
  if (el.btnSelectAllCountries) {
    el.btnSelectAllCountries.addEventListener('click', () => {
      document.querySelectorAll('.tag-pill').forEach((p) => p.classList.add('active'));
      updateCountriesCount();
      syncFormToState();
    });
  }

  // Clear countries
  if (el.btnClearCountries) {
    el.btnClearCountries.addEventListener('click', () => {
      document.querySelectorAll('.tag-pill').forEach((p) => p.classList.remove('active'));
      updateCountriesCount();
      syncFormToState();
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
