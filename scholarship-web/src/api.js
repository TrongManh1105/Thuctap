/**
 * API Client for ScholarMatch AI Frontend.
 * Interacts with FastAPI backend at http://localhost:7782 (or Vite proxy).
 */

import { uploadAndExtractCV } from './services/cvApi.js';
export { uploadAndExtractCV };

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) 
  ? import.meta.env.VITE_API_BASE 
  : 'http://localhost:7782';
const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) 
  ? import.meta.env.VITE_API_KEY 
  : 'scholarship_internal_secret_key';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health/ready`, {
      headers: { 'X-API-Key': API_KEY },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      return { connected: true, data };
    }
    return { connected: false, error: 'Degraded' };
  } catch (err) {
    // Try fallback to Vite proxy /health/ready
    try {
      const proxyRes = await fetch('/health/ready', {
        headers: { 'X-API-Key': API_KEY },
        signal: AbortSignal.timeout(4000),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        return { connected: true, data };
      }
    } catch {
      // Ignore
    }
    return { connected: false, error: err.message };
  }
}

/**
 * Fetch catalog scholarships from Supabase database with pagination and filters.
 */
export async function fetchScholarshipCatalog(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.search) query.set('search', params.search);
    if (params.country) query.set('country', params.country);
    if (params.funding) query.set('funding', params.funding);
    if (params.tier) query.set('tier', params.tier);
    if (params.sort_by) query.set('sort_by', params.sort_by);

    const res = await fetch(`${API_BASE}/api/v1/scholarships/catalog?${query.toString()}`, {
      headers: { 'X-API-Key': API_KEY },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[API Client] fetchScholarshipCatalog error:', err);
    throw err;
  }
}

export async function matchScholarships(candidateProfile, filters = {}) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/scholarships/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({
        candidate_profile: candidateProfile,
        filters,
        top_k: 50,
        final_limit: 16,
        explain: false,
        explain_top_n: 1,
      }),
      signal: AbortSignal.timeout(35000),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[API Client] matchScholarships failed, switching to local intelligence engine:', err);
    throw err;
  }
}

export async function extractCvProfile(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('cv', file); // Gửi cả 2 key để tương thích với mọi router

  const customGeminiKey = (typeof window !== 'undefined' && window.localStorage)
    ? (window.localStorage.getItem('gemini_api_key') || '')
    : '';

  const headers = {
    'X-API-Key': API_KEY,
  };
  if (customGeminiKey) {
    headers['X-Gemini-Key'] = customGeminiKey;
  }

  // Xác định thứ tự endpoints thông minh theo môi trường (Cloud HTTPS vs Localhost)
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const endpoints = isHttps
    ? ['/api/cv/extract', '/api/v1/scholarships/extract-cv', `${API_BASE}/api/cv/extract`, `${API_BASE}/api/v1/scholarships/extract-cv`]
    : ['/api/cv/extract', 'http://localhost:7782/api/cv/extract', '/api/v1/scholarships/extract-cv', `${API_BASE}/api/cv/extract`, `${API_BASE}/api/v1/scholarships/extract-cv`];

  let lastError = null;
  for (const url of [...new Set(endpoints.filter(Boolean))]) {
    try {
      console.log(`[CV Extraction API] Đang gửi file ${file.name} lên:`, url);
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: AbortSignal.timeout(35000),
      });

      if (res.ok) {
        const rawData = await res.json();
        console.log(`[CV Extraction API] Thành công từ endpoint ${url}:`, rawData);
        if (rawData && rawData.success === false) {
          throw new Error(rawData.error || 'Trích xuất CV thất bại.');
        }
        const data = (rawData && rawData.data) ? rawData.data : rawData;
        // Chuẩn hóa đồng bộ 2 chiều
        data.gpa = data.gpa ?? data.gpa_scale_4;
        data.gpa_scale_4 = data.gpa_scale_4 ?? data.gpa;
        data.has_gpa = Boolean(data.gpa !== undefined && data.gpa !== null && data.gpa > 0);
        data.ielts = data.ielts ?? data.ielts_score;
        data.ielts_score = data.ielts_score ?? data.ielts;
        if (data.ielts && !data.english_score) {
          data.english_score = `IELTS ${data.ielts}`;
        }
        data.has_english = Boolean(data.ielts || data.has_english);
        data.publications_count = data.publications_count ?? data.research_papers_count ?? 0;
        data.research_papers_count = data.research_papers_count ?? data.publications_count;
        data.narrative = data.narrative ?? data.raw_summary;
        data.raw_summary = data.raw_summary ?? data.narrative;
        return data;
      }
      const errData = await res.json().catch(() => ({}));
      lastError = new Error(errData.error || errData.detail || `Upload failed with HTTP ${res.status}`);
      console.warn(`[CV Extraction] Endpoint ${url} trả về lỗi HTTP ${res.status}:`, lastError.message);
    } catch (err) {
      lastError = err;
      console.warn(`[CV Extraction] Thử endpoint ${url} không thành công:`, err.message);
    }
  }

  throw lastError || new Error('Không thể kết nối đến backend AI để bóc tách CV');
}

export async function streamChat(message, history, candidateProfile, callbacks = {}) {
  const { onThinking, onToken, onDone, onError } = callbacks;

  try {
    const response = await fetch(`${API_BASE}/api/v1/scholarships/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({
        message,
        history,
        candidate_profile: candidateProfile,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // save incomplete line

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const rawJson = line.slice(6).trim();
            if (!rawJson) continue;
            const event = JSON.parse(rawJson);

            if (event.type === 'thinking' && onThinking) {
              onThinking(event.content);
            } else if (event.type === 'token' && onToken) {
              onToken(event.content);
            } else if (event.type === 'done' && onDone) {
              onDone();
            } else if (event.type === 'error' && onError) {
              onError(event.content);
            }
          } catch (e) {
            console.warn('[SSE Parse Error]', e, line);
          }
        }
      }
    }
    if (onDone) onDone();
  } catch (err) {
    if (onError) onError(err.message);
  }
}
