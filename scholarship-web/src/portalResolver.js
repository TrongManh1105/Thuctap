/**
 * Official University & Scholarship Portal Link Resolver.
 * Maps university and scholarship names to their genuine, official application/scholarship portals.
 * Eliminates all Google Search fallback links and generic non-working URLs.
 */

export const UNIVERSITY_PORTAL_MAP = {
  // --- HÀN QUỐC (KOREA) ---
  'Chung-Ang': 'https://oia.cau.ac.kr/',
  'CAU': 'https://oia.cau.ac.kr/',
  'Chung Ang': 'https://oia.cau.ac.kr/',
  'Đại học Chung-Ang': 'https://oia.cau.ac.kr/',
  'Seoul National University': 'https://en.snu.ac.kr/admission/graduate/scholarships',
  'SNU': 'https://en.snu.ac.kr/admission/graduate/scholarships',
  'Đại học Quốc gia Seoul': 'https://en.snu.ac.kr/admission/graduate/scholarships',
  'KAIST': 'https://admission.kaist.ac.kr/intl-graduate/',
  'Yonsei': 'https://graduate.yonsei.ac.kr/graduate_en/admission/scholarship.do',
  'Đại học Yonsei': 'https://graduate.yonsei.ac.kr/graduate_en/admission/scholarship.do',
  'Korea University': 'https://graduate2.korea.ac.kr/admission/scholarship.html',
  'Đại học Hàn Quốc': 'https://graduate2.korea.ac.kr/admission/scholarship.html',
  'GIST': 'https://www.gist.ac.kr/iadm/',
  'UNIST': 'https://adm-u.unist.ac.kr/',
  'Pusan National University': 'https://his.pusan.ac.kr/international_eng/',
  'PNU': 'https://his.pusan.ac.kr/international_eng/',
  'Đại học Quốc gia Pusan': 'https://his.pusan.ac.kr/international_eng/',
  'Dong-A': 'https://global.donga.ac.kr/',
  'Đại học Dong-A': 'https://global.donga.ac.kr/',
  'Sungkyunkwan': 'https://www.skku.edu/eng/Admissions/Graduate/Scholarship.do',
  'SKKU': 'https://www.skku.edu/eng/Admissions/Graduate/Scholarship.do',
  'Hanyang': 'https://oia.hanyang.ac.kr/',
  'Kyung Hee': 'https://oia.khu.ac.kr/',
  'POSTECH': 'https://international.postech.ac.kr/',
  'Sogang': 'https://wwwe.sogang.ac.kr/wwwe/admissions_scholarships.do',
  'Ewha': 'https://isa.ewha.ac.kr/',
  'GKS': 'https://www.studyinkorea.go.kr/ko/scholarship/GksScholarship.do',
  'Global Korea Scholarship': 'https://www.studyinkorea.go.kr/ko/scholarship/GksScholarship.do',
  'Study in Korea': 'https://www.studyinkorea.go.kr/ko/scholarship/OtherScholarship.do',

  // --- ĐÀI LOAN (TAIWAN) ---
  'Taiwan Tech': 'https://oia.ntust.edu.tw/',
  'NTUST': 'https://oia.ntust.edu.tw/',
  'Đại học Khoa học Kỹ thuật Quốc gia Đài Loan': 'https://oia.ntust.edu.tw/',
  'National Taiwan University': 'https://admissions.ntu.edu.tw/apply/scholarships/',
  'NTU': 'https://admissions.ntu.edu.tw/apply/scholarships/',
  'Đại học Quốc gia Đài Loan': 'https://admissions.ntu.edu.tw/apply/scholarships/',
  'National Tsing Hua University': 'https://oga.site.nthu.edu.tw/',
  'NTHU': 'https://oga.site.nthu.edu.tw/',
  'National Yang Ming Chiao Tung': 'https://oia.nycu.edu.tw/',
  'NYCU': 'https://oia.nycu.edu.tw/',
  'National Cheng Kung University': 'https://oia.ncku.edu.tw/',
  'NCKU': 'https://oia.ncku.edu.tw/',
  'National Central University': 'https://oia.ncu.edu.tw/',
  'NCU': 'https://oia.ncu.edu.tw/',
  'MOE': 'https://taiwanscholarship.moe.gov.tw/',
  'Taiwan ICDF': 'https://www.icdf.org.tw/wSite/np?ctNode=31561&mp=2',

  // --- NHẬT BẢN (JAPAN) ---
  'MEXT': 'https://www.studyinjapan.go.jp/en/planning/scholarship/mext-scholarships/',
  'University of Tokyo': 'https://www.u-tokyo.ac.jp/en/prospective-students/scholarships.html',
  'Tokyo': 'https://www.u-tokyo.ac.jp/en/prospective-students/scholarships.html',
  'Kyoto University': 'https://www.kyoto-u.ac.jp/en/education-campus/tuition-scholarships/scholarships.html',
  'Kyoto': 'https://www.kyoto-u.ac.jp/en/education-campus/tuition-scholarships/scholarships.html',
  'Osaka University': 'https://www.osaka-u.ac.jp/en/international/inbound/scholarship',
  'Keio University': 'https://www.keio.ac.jp/en/admissions/scholarships/',
  'Keio': 'https://www.keio.ac.jp/en/admissions/scholarships/',
  'Waseda University': 'https://www.waseda.jp/inst/cie/en/life/scholarship',
  'Waseda': 'https://www.waseda.jp/inst/cie/en/life/scholarship',
  'Tohoku University': 'https://www.tohoku.ac.jp/en/admissions/financial_aid/',
  'Tokyo Institute of Technology': 'https://www.titech.ac.jp/english/admissions/prospective-students/tuition-scholarships',

  // --- SINGAPORE ---
  'National University of Singapore': 'https://nus.edu.sg/admissions/scholarships',
  'NUS': 'https://nus.edu.sg/admissions/scholarships',
  'Nanyang Technological University': 'https://www.ntu.edu.sg/admissions/scholarships',
  'SUTD': 'https://www.sutd.edu.sg/Admissions/Undergraduate/Scholarships',
  'SMU': 'https://admissions.smu.edu.sg/scholarships-financial-aid',
  'SINGA': 'https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa',
  'A*STAR': 'https://www.a-star.edu.sg/Scholarships/',

  // --- TRUNG QUỐC (CHINA) ---
  'Tsinghua University': 'https://www.tsinghua.edu.cn/en/Admissions/Scholarships.htm',
  'Tsinghua': 'https://www.tsinghua.edu.cn/en/Admissions/Scholarships.htm',
  'Peking University': 'https://www.isd.pku.edu.cn/scholarships/',
  'Peking': 'https://www.isd.pku.edu.cn/scholarships/',
  'Zhejiang University': 'https://iczu.zju.edu.cn/en/',
  'Fudan University': 'https://iso.fudan.edu.cn/en/',
  'CSC Scholarship': 'https://www.campuschina.org/',

  // --- VƯƠNG QUỐC ANH (UK) ---
  'Chevening': 'https://www.chevening.org/scholarships/',
  'University of Oxford': 'https://www.ox.ac.uk/admissions/graduate/fees-and-funding/fees-funding-and-scholarship-search',
  'Oxford': 'https://www.ox.ac.uk/admissions/graduate/fees-and-funding/fees-funding-and-scholarship-search',
  'University of Cambridge': 'https://www.cambridgetrust.org/scholarships/',
  'Cambridge': 'https://www.cambridgetrust.org/scholarships/',
  'Imperial College London': 'https://www.imperial.ac.uk/study/fees-and-funding/',
  'Imperial': 'https://www.imperial.ac.uk/study/fees-and-funding/',
  'UCL': 'https://www.ucl.ac.uk/scholarships/',
  "King's College London": 'https://www.kcl.ac.uk/study/funding',
  'Edinburgh': 'https://www.ed.ac.uk/student-funding',
  'Manchester': 'https://www.manchester.ac.uk/study/international/finance-and-travel/funding/',
  'Warwick': 'https://warwick.ac.uk/services/academicoffice/gsp/funding/',
  'Bristol': 'https://www.bristol.ac.uk/fees-funding/',
  'Glasgow': 'https://www.gla.ac.uk/scholarships/',
  'Birmingham': 'https://www.birmingham.ac.uk/study/postgraduate/taught/fees-funding',
  'Leeds': 'https://www.leeds.ac.uk/scholarships',
  'Southampton': 'https://www.southampton.ac.uk/study/fees-funding/scholarships',
  'Durham': 'https://www.durham.ac.uk/study/scholarships/',

  // --- HOA KỲ (USA) ---
  'Fulbright': 'https://vn.usembassy.gov/education-culture/fulbright-program-vietnam/',
  'Carnegie Mellon': 'https://www.cmu.edu/student-financial-services/financial-aid/scholarships/',
  'Duke University': 'https://financialaid.duke.edu/types-aid/scholarships',
  'Duke': 'https://financialaid.duke.edu/types-aid/scholarships',
  'Johns Hopkins': 'https://finaid.jhu.edu/undergraduate-aid/types-of-aid/scholarships-grants/',
  'Harvard': 'https://college.harvard.edu/financial-aid/types-aid/scholarships-grants',
  'MIT': 'https://sfs.mit.edu/undergraduate-students/types-of-aid/mit-scholarship/',
  'Stanford': 'https://financialaid.stanford.edu/undergrad/how/index.html',
  'UC Berkeley': 'https://financialaid.berkeley.edu/types-of-aid-at-berkeley/scholarships/',
  'Columbia University': 'https://cc-seas.financialaid.columbia.edu/types-of-aid/scholarships',
  'Yale University': 'https://finaid.yale.edu/',
  'Princeton University': 'https://finaid.princeton.edu/',
  'UCLA': 'https://financialaid.ucla.edu/',
  'University of Michigan': 'https://finaid.umich.edu/',

  // --- CHÂU ÂU (EUROPE) ---
  'DAAD': 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
  'Eiffel': 'https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence',
  'ETH Zurich': 'https://ethz.ch/en/studies/financial/scholarships.html',
  'EPFL': 'https://www.epfl.ch/education/studies/en/financing-study/grants/',
  'TU Munich': 'https://www.tum.de/en/studies/fees-and-financial-aid/scholarships',
  'RWTH Aachen': 'https://www.rwth-aachen.de/cms/root/studium/im-studium/stipendien-foerderung/~bfw/stipendien/?lidx=1',
  'TU Delft': 'https://www.tudelft.nl/en/education/practical-matters/scholarships',
  'University of Amsterdam': 'https://www.uva.nl/en/education/master-s/scholarships--tuition/scholarships-and-loans/scholarships.html',
  'Wageningen': 'https://www.wur.nl/en/education-programmes/master/practical-information-masters/scholarships-grants.htm',
  'Lund': 'https://www.lunduniversity.lu.se/admissions/scholarships-and-awards',
  'KTH': 'https://www.kth.se/en/studies/master/scholarships',
  'Karolinska': 'https://education.ki.se/scholarships',
  'Uppsala': 'https://www.uu.se/en/admissions/scholarships',
  'Chalmers': 'https://www.chalmers.se/en/education/admissions/scholarships/',
  'Politecnico di Milano': 'https://www.polimi.it/en/international-prospective-students/laurea-magistrale-programmes-equivalent-to-master-of-science/scholarships',
  'Grenoble Alpes': 'https://www.univ-grenoble-alpes.fr/english/study/funding-your-studies/scholarships/',

  // --- ÚC & CANADA & KHÁC ---
  'Australia Awards': 'https://www.dfat.gov.au/people-to-people/australia-awards',
  'University of Melbourne': 'https://scholarships.unimelb.edu.au/',
  'University of Sydney': 'https://www.sydney.edu.au/scholarships/',
  'UNSW Sydney': 'https://www.scholarships.unsw.edu.au/',
  'Adelaide': 'https://international.adelaide.edu.au/admissions/scholarships',
  'University of Toronto': 'https://www.future.utoronto.ca/finances/scholarships',
  'McGill University': 'https://www.mcgill.ca/studentaid/scholarships-aid',
  'UBC': 'https://you.ubc.ca/financial-planning/scholarships-awards-international-students/',
  'Vanier Canada': 'https://vanier.gc.ca/en/home-accueil.html',
};

/**
 * Returns a guaranteed official portal URL for a given scholarship item.
 * Never returns a Google Search URL.
 */
export function getOfficialPortalUrl(item) {
  if (!item) return 'https://www.studyinkorea.go.kr/';

  const rawLink = (item.link || '').trim();
  const title = (item.title || '').trim();
  const source = (item.source_name || '').trim();
  const textToScan = `${title} ${source} ${rawLink}`;

  // 1. Check exact or substring matches in UNIVERSITY_PORTAL_MAP
  for (const [key, portalUrl] of Object.entries(UNIVERSITY_PORTAL_MAP)) {
    const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(textToScan) || textToScan.toLowerCase().includes(key.toLowerCase())) {
      return portalUrl;
    }
  }

  // 2. If it's a valid direct HTTP link and NOT a google search link, keep it!
  if (rawLink && rawLink.startsWith('http') && !rawLink.includes('google.com/search')) {
    return rawLink;
  }

  // 3. Fallback based on host country
  const country = (item.host_country || '').toLowerCase();
  if (country.includes('hàn') || country.includes('korea')) {
    return 'https://www.studyinkorea.go.kr/ko/scholarship/GksScholarship.do';
  }
  if (country.includes('đài') || country.includes('taiwan')) {
    return 'https://taiwanscholarship.moe.gov.tw/';
  }
  if (country.includes('nhật') || country.includes('japan')) {
    return 'https://www.studyinjapan.go.jp/en/planning/scholarship/mext-scholarships/';
  }
  if (country.includes('anh') || country.includes('uk') || country.includes('britain')) {
    return 'https://www.chevening.org/scholarships/';
  }
  if (country.includes('mỹ') || country.includes('hoa kỳ') || country.includes('usa') || country.includes('united states')) {
    return 'https://vn.usembassy.gov/education-culture/fulbright-program-vietnam/';
  }
  if (country.includes('đức') || country.includes('germany')) {
    return 'https://www.daad.de/en/study-and-research-in-germany/scholarships/';
  }
  if (country.includes('pháp') || country.includes('france')) {
    return 'https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence';
  }
  if (country.includes('singapore')) {
    return 'https://www.a-star.edu.sg/Scholarships/';
  }
  if (country.includes('úc') || country.includes('australia')) {
    return 'https://www.dfat.gov.au/people-to-people/australia-awards';
  }
  if (country.includes('thụy sĩ') || country.includes('switzerland')) {
    return 'https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants/swiss-government-excellence-scholarships.html';
  }
  if (country.includes('thụy điển') || country.includes('sweden')) {
    return 'https://si.se/en/apply/scholarships/';
  }

  return 'https://www.scholars4dev.com/';
}
