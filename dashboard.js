/**
 * 행정업무 종합 대시보드 v2.0 — dashboard.js
 * ─────────────────────────────────────────────
 * HTML 파일에서 JavaScript 로직을 분리한 참조용 모듈입니다.
 * 실제 사용 시 HTML 파일의 <script> 블록을 이 파일로 교체하거나
 * <script src="dashboard.js"></script> 로 연결하세요.
 */

// ══════════════════════════════════════════════
// 1. SUPABASE 설정
// ══════════════════════════════════════════════

const SUPABASE_URL = "https://your-supabase-url.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";

/**
 * Supabase 클라이언트 초기화.
 * URL/KEY가 플레이스홀더이거나 SDK 미로딩 시 null 반환 → 데모 모드 동작.
 */
let supabaseClient = null;
try {
  if (
    SUPABASE_URL.indexOf("your-supabase") === -1 &&
    typeof window.supabase !== "undefined"
  ) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (error) {
  console.warn("Supabase 연결 중 오류 발생(무시됨):", error);
}


// ══════════════════════════════════════════════
// 2. 전역 상태 변수
// ══════════════════════════════════════════════

const TODAY = new Date(2026, 4, 26); // 2026-05-26 기준일

/** 현재 활성 페이지 번호 (1~5) */
let currentPage = 1;

/** 로그인된 사용자 역할: 'member' | 'leader' | 'admin' */
let currentRole = "member";

/** 현재 로그인 사용자 정보 */
let currentUser = {
  name: "정세연",
  email: "jeong.seyeon@company.kr",
  avatar: "정",
};

/** 달력 표시 연도/월 (0-indexed month) */
let calYear = 2026;
let calMonth = 4; // 5월

/** Todo 필터 상태: 'all' | 'active' | 'done' */
let todoFilter = "all";

/** 결산 분석 모드: 'daily' | 'weekly' | 'monthly' | 'quarter' | 'annual' */
let analysisMode = "daily";

/** SNS 활성 채팅방 인덱스 */
let snsActiveChat = 0;

/** 로그인 역할 선택 임시 변수 */
let selectedRole = "member";


// ══════════════════════════════════════════════
// 3. 초기 데이터
// ══════════════════════════════════════════════

/** @type {{id:number, text:string, pri:string, done:boolean, assign:string}[]} */
const todos = [
  { id: 1, text: "Q2 경영실적 보고서 최종 결재 상신", pri: "d1", done: false, assign: "정세연" },
  { id: 2, text: "5/28 임원회의실 예약 및 자료 배포",  pri: "d2", done: false, assign: "김철수" },
  { id: 3, text: "사무용품 계정 점검 및 발주",          pri: "d5", done: false, assign: "이영희" },
  { id: 4, text: "인사평가 일정 공지 발송",              pri: "d5", done: true,  assign: "정세연" },
  { id: 5, text: "6월 시설 점검 일정 조율",             pri: "d5", done: false, assign: "박민준" },
];

/** @type {{name:string, pct:number, color:string, due:string}[]} */
const milestones = [
  { name: "상반기 결산 보고",   pct: 75, color: "#3b82f6", due: "6/15" },
  { name: "사무실 리모델링 TF", pct: 40, color: "#a855f7", due: "7/31" },
  { name: "HR 시스템 전환",     pct: 20, color: "#f97316", due: "9/30" },
];

/**
 * 결재 문서 목록
 * st 상태값: 'bac'(기안중) | 'bpa'(검토중) | 'bdo'(완결) | 'bre'(반려)
 * @type {{id:number, name:string, st:string, date:string}[]}
 */
const trackers = [
  { id: 1, name: "법인카드 정산 신청서",   st: "bpa", date: "5/24" },
  { id: 2, name: "Q2 실적보고서 V3",       st: "bac", date: "5/25" },
  { id: 3, name: "외부 강사료 지급품의",   st: "bdo", date: "5/20" },
  { id: 4, name: "사무용품 구매 품의",     st: "bre", date: "5/23" },
  { id: 5, name: "5월 법인카드 영수증",    st: "bpa", date: "5/26" },
];

/**
 * 결재 경로 데이터 (문서별 단계 배열)
 * s 상태값: 'done' | 'cur' | 'wait' | 'rej'
 * @type {{n:string, s:string}[][]}
 */
const approvals = [
  [{ n: "담당", s: "done" }, { n: "팀장", s: "done" }, { n: "부장", s: "cur" }, { n: "본부장", s: "wait" }, { n: "대표", s: "wait" }],
  [{ n: "담당", s: "done" }, { n: "팀장", s: "cur" }, { n: "본부장", s: "wait" }, { n: "대표", s: "wait" }],
  [{ n: "담당", s: "done" }, { n: "팀장", s: "done" }, { n: "부장", s: "done" }, { n: "본부장", s: "cur" }, { n: "대표", s: "wait" }],
  [{ n: "담당", s: "done" }, { n: "팀장", s: "rej" }],
];

/** @type {{id:number, msg:string, time:string, color:string, read:boolean}[]} */
const alerts = [
  { id: 1, msg: "📋 법인카드 정산 신청서 — 부장 검토 중", time: "10분 전",  color: "#fbbf24", read: false },
  { id: 2, msg: "🔴 Q2 보고서 마감 D-1 임박!",             time: "1시간 전", color: "#ef4444", read: false },
  { id: 3, msg: "✅ 사무용품 구매 품의 완결 처리",          time: "2시간 전", color: "#22c55e", read: true  },
  { id: 4, msg: "💬 김철수 팀장이 채팅을 보냈습니다",       time: "30분 전",  color: "#3b82f6", read: false },
];

/** @type {{name:string, email:string, role:string, avatar:string, online:boolean}[]} */
const members = [
  { name: "정세연", email: "jeong@company.kr", role: "member", avatar: "정", online: true  },
  { name: "김철수", email: "kim@company.kr",   role: "leader", avatar: "김", online: true  },
  { name: "이영희", email: "lee@company.kr",   role: "member", avatar: "이", online: false },
  { name: "박민준", email: "park@company.kr",  role: "member", avatar: "박", online: true  },
  { name: "최지수", email: "choi@company.kr",  role: "admin",  avatar: "최", online: false },
];

/** @type {{member:string, task:string}[]} */
const assigns = [
  { member: "정세연", task: "결재문서 관리, 예산 정산" },
  { member: "김철수", task: "팀 일정 조율, 회의 운영" },
  { member: "이영희", task: "공문서 작성, 대외 응대"  },
  { member: "박민준", task: "시설 관리, 비품 구매"    },
];

/** @type {{name:string, type:string, avatar:string, online:boolean, unread:number}[]} */
const snsChats = [
  { name: "#총무팀 전체", type: "channel", avatar: "팀", online: true,  unread: 2 },
  { name: "김철수 팀장",  type: "dm",      avatar: "김", online: true,  unread: 1 },
  { name: "이영희",       type: "dm",      avatar: "이", online: false, unread: 0 },
  { name: "박민준",       type: "dm",      avatar: "박", online: true,  unread: 1 },
  { name: "#공지채널",   type: "channel", avatar: "공", online: true,  unread: 0 },
];

/** @type {{from:string, text:string, me:boolean, time:string}[][]} */
const snsMessages = [
  [
    { from: "김철수 팀장", text: "안녕하세요! Q2 보고서 진행 상황 어떻게 되나요?",    me: false, time: "09:15" },
    { from: "나",         text: "현재 75% 완료됐습니다. 오늘 오후까지 1차 완료 예정이에요.", me: true,  time: "09:17" },
    { from: "이영희",     text: "공문서 초안 작성 완료했습니다. 검토 부탁드립니다!",  me: false, time: "09:30" },
    { from: "김철수 팀장", text: "👍 수고하셨습니다. 오늘 오후 3시에 팀 회의 잡겠습니다.", me: false, time: "09:45" },
    { from: "나",         text: "네, 확인했습니다!",                                  me: true,  time: "09:46" },
  ],
];

/** @type {{type:string, title:string, date:string, author:string}[]} */
const notices = [
  { type: "긴급", title: "5/28 본부장 결재 자료 오전 9시 제출", date: "5/26", author: "관리자" },
  { type: "안내", title: "6월 정기 시설 점검 6/3~4 예정",       date: "5/25", author: "박민준" },
  { type: "공지", title: "상반기 인사평가 6/1~15 시행 안내",    date: "5/24", author: "김철수" },
];

let stickies = [];
const sharedStickies = [
  { id: 1, text: "내일 오전 회의 준비물 챙기기!", color: "yellow", author: "김철수" },
  { id: 2, text: "법인카드 마감 이번 주 금요일",  color: "pink",   author: "이영희" },
];

const loginLog = [
  { device: "Chrome · Windows", time: "2026-05-26 09:12", loc: "서울" },
  { device: "Safari · iPhone",  time: "2026-05-25 18:45", loc: "서울" },
];

/** 달력 이벤트. 키: 'YYYY-M-D' */
const calEvents = {
  "2026-5-5":  ["어린이날"],
  "2026-5-26": ["Q2 보고서 마감", "팀 회의 15:00"],
  "2026-5-28": ["본부장 결재"],
  "2026-5-30": ["월급날 🎉"],
  "2026-6-1":  ["인사평가 시작"],
  "2026-6-3":  ["시설 점검"],
  "2026-6-10": ["창립기념일"],
};

/** 업무 밀도 히트맵 데이터 (13개 시간대) */
const hmData = [8, 12, 15, 10, 6, 18, 14, 9, 11, 7, 13, 16, 14];

/** 결산 분석 데이터 */
const analysisData = {
  daily:   { label: "일일 결산 (2026-05-26)",  items: [{ n: "완료 업무", v: 3,  max: 8,   c: "#22c55e" }, { n: "진행 업무", v: 5,  max: 8,   c: "#3b82f6" }, { n: "결재 처리", v: 2,  max: 5,   c: "#fbbf24" }, { n: "문서 기안", v: 2,  max: 8,   c: "#a855f7" }] },
  weekly:  { label: "주간 결산 (5/20~5/26)",   items: [{ n: "완료",     v: 12, max: 20,  c: "#22c55e" }, { n: "지연",     v: 2,  max: 20,  c: "#ef4444" }, { n: "결재",     v: 7,  max: 10,  c: "#fbbf24" }, { n: "회의",     v: 4,  max: 10,  c: "#a855f7" }] },
  monthly: { label: "월간 결산 (2026년 5월)",  items: [{ n: "완료",     v: 38, max: 60,  c: "#22c55e" }, { n: "지연",     v: 5,  max: 60,  c: "#ef4444" }, { n: "결재완결", v: 21, max: 30,  c: "#3b82f6" }, { n: "예산집행", v: 33, max: 50,  c: "#fbbf24" }] },
  quarter: { label: "분기 결산 (Q2 2026)",     items: [{ n: "목표달성", v: 76, max: 100, c: "#22c55e" }, { n: "예산소진", v: 68, max: 100, c: "#fbbf24" }, { n: "완료건",   v: 94, max: 150, c: "#3b82f6" }, { n: "반려건",   v: 4,  max: 20,  c: "#ef4444" }] },
  annual:  { label: "연간 결산 (2026년)",      items: [{ n: "목표달성", v: 52, max: 100, c: "#22c55e" }, { n: "예산소진", v: 43, max: 100, c: "#fbbf24" }, { n: "완료건",   v: 186,max: 400, c: "#3b82f6" }, { n: "인원변동", v: 2,  max: 10,  c: "#a855f7" }] },
};

/** 문서 초안 템플릿 */
const templates = {
  품의서:   `품 의 서\n━━━━━━━━━━━━━━━━━━━━\n제 목: [제목 입력]\n기안일: ${TODAY.toLocaleDateString("ko-KR")}\n기안자: 정세연 / 총무팀\n━━━━━━━━━━━━━━━━━━━━\n1. 목적\n   [목적을 기술하세요]\n\n2. 주요 내용\n   [내용을 기술하세요]\n\n3. 소요 예산\n   금 액: ₩___________\n   지급처: ___________\n━━━━━━━━━━━━━━━━━━━━\n결재: 팀장 □ | 부장 □ | 본부장 □`,
  회의록:   `회  의  록\n━━━━━━━━━━━━━━━━━━━━\n일 시: ${TODAY.toLocaleDateString("ko-KR")} ___:___ ~ ___:___\n장 소: ________\n참석자: ________\n━━━━━━━━━━━━━━━━━━━━\n【안건 및 논의 사항】\n1. \n\n2. \n\n【결정 사항】\n-\n\n【차기 일정】\n-`,
  보고서:   `보  고  서\n━━━━━━━━━━━━━━━━━━━━\n제 목: [보고서 제목]\n보고일: ${TODAY.toLocaleDateString("ko-KR")}\n보고자: 정세연\n━━━━━━━━━━━━━━━━━━━━\nⅠ. 개요\n\nⅡ. 주요 내용\n\nⅢ. 결과 및 현황\n\nⅣ. 향후 계획\n\nⅤ. 건의 사항`,
  출장신청: `출 장 신 청 서\n━━━━━━━━━━━━━━━━━━━━\n신청자: 정세연 / 총무팀\n출장지: ________\n출장 기간: ___ ~ ___\n출장 목적: ________\n━━━━━━━━━━━━━━━━━━━━\n교통비: ₩_______\n숙박비: ₩_______\n기 타: ₩_______\n합 계: ₩_______`,
  업무협조: `업 무 협 조 요 청\n━━━━━━━━━━━━━━━━━━━━\n수 신: ________\n발 신: 정세연 / 총무팀\n일 자: ${TODAY.toLocaleDateString("ko-KR")}\n━━━━━━━━━━━━━━━━━━━━\n제 목: [협조 요청 제목]\n\n【요청 내용】\n\n\n【협조 기한】\n___년 ___월 ___일 까지`,
  연차신청: `연 차 신 청 서\n━━━━━━━━━━━━━━━━━━━━\n신청자: 정세연 / 총무팀\n신청일: ${TODAY.toLocaleDateString("ko-KR")}\n━━━━━━━━━━━━━━━━━━━━\n연차 기간: ___ ~ ___\n연차 일수: ___ 일\n잔여 연차: 11 일 / 25 일\n사유: ________\n━━━━━━━━━━━━━━━━━━━━\n결재: 팀장 □ | 부장 □`,
};

/** AI 비서 사전 정의 응답 맵 */
const aiResponses = {
  "오늘 주요 업무 브리핑해줘": "📋 오늘 주요 업무: ① Q2 보고서 마감(D-1) ② 임원회의실 예약. 현재 미완료 업무 5건입니다.",
  "미결 결재 현황 알려줘":     "📄 미결 결재: 법인카드 정산(검토중), Q2 보고서(기안중), 강사료 품의(완결) 총 2건 처리 중입니다.",
  "이번 주 일정 알려줘":       "📅 이번 주: 5/26 Q2 보고서 마감, 5/28 임원 보고, 5/30 월급날 🎉",
  "연차 현황 알려줘":          "🏖️ 연차 현황: 총 25일 중 11일 잔여 (사용 14일). 상반기 내 10일 이상 사용 권장합니다.",
  "회의실 현황 알려줘":        "🏢 A회의실: 14:00-16:00 예약 있음, B회의실: 현재 사용 가능, 임원회의실: 사전 신청 필요.",
  "법인카드 안내해줘":         "💳 법인카드 사용 한도: 월 300만원, 영수증 제출 기한: 익월 5일. 현재 잔여 한도 ₩180만원.",
};

/** 포스트잇 색상 맵 */
const stickyColors = {
  yellow: "#fde68a",
  green:  "#bbf7d0",
  pink:   "#fecdd3",
  blue:   "#bfdbfe",
};


// ══════════════════════════════════════════════
// 4. 초기화
// ══════════════════════════════════════════════

let todoIdSeq    = todos.length + 1;
let trackerIdSeq = trackers.length + 1;
let stickyIdSeq  = 10;
let sharedIdSeq  = 100;

/**
 * 앱 부트스트랩.
 * DOMContentLoaded 및 load 이벤트 모두에서 호출되어 안전하게 초기화됩니다.
 */
async function init() {
  updateClock();
  setInterval(updateClock, 1000);

  renderTodo();
  renderMilestones();
  renderTracker();
  renderApproval();
  renderAlerts();
  renderCalendar();
  renderHeatmap();
  renderAnalysis();
  renderMembers();
  renderAssigns();
  renderSNSUserList();
  renderSNSMessages();
  renderStickies();
  renderSharedStickies();
  renderNotices();
  renderLoginLog();
  updateDonut();
  updateKPI();

  const hasAuthToken =
    window.location.hash && window.location.hash.includes("access_token=");

  if (supabaseClient && (hasAuthToken || (await checkSupabaseSession()))) {
    // Supabase 세션 처리
  } else {
    document.getElementById("login-overlay").style.display = "flex";
  }

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        handleSupabaseUser(session.user, "Google");
      } else if (event === "SIGNED_OUT") {
        document.getElementById("login-overlay").style.display = "flex";
      }
    });
  }
}

window.addEventListener("DOMContentLoaded", init);
window.addEventListener("load", init);


// ══════════════════════════════════════════════
// 5. 시계
// ══════════════════════════════════════════════

/** 상단 바 시계를 현재 시각으로 갱신합니다. */
function updateClock() {
  const n = new Date();
  document.getElementById("clock").textContent = n.toLocaleTimeString("ko-KR");
}


// ══════════════════════════════════════════════
// 6. 인증 (Supabase + 데모)
// ══════════════════════════════════════════════

/**
 * Supabase 세션을 확인하고 유효하면 사용자 정보를 설정합니다.
 * @returns {Promise<boolean>}
 */
async function checkSupabaseSession() {
  if (!supabaseClient) return false;
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
      handleSupabaseUser(session.user, "Google");
      return true;
    }
  } catch (e) {
    console.error("세션 체크 오류:", e);
  }
  return false;
}

/**
 * Supabase 인증 완료 후 UI를 사용자 정보로 채웁니다.
 * @param {object} user - Supabase user 객체
 * @param {string} provider - 'Google' | 'Naver'
 */
function handleSupabaseUser(user, provider) {
  const fullName = user.user_metadata.full_name || user.email.split("@")[0];
  currentUser = { name: fullName, email: user.email, avatar: fullName[0] };

  _applyUserToUI();
  document.getElementById("login-overlay").style.display = "none";
  showToast(`✅ ${currentUser.name}님 로그인 완료 (${provider})`);
}

/** Google OAuth 로그인 (Supabase 미연동 시 데모 모드로 대체) */
async function loginGoogle() {
  if (!supabaseClient) {
    showToast("🔵 [시뮬레이션] Google 로그인 중...");
    setTimeout(() => doLoginAction("Google"), 500);
    return;
  }
  showToast("🔵 Google OAuth 인증 창으로 이동 중...");
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (error) showToast("❌ 로그인 오류: " + error.message);
  } catch (e) {
    showToast("❌ 로그인 중단: " + e.message);
  }
}

/** Naver 로그인 (시뮬레이션) */
function loginNaver() {
  showToast("🟢 Naver OAuth 인증 중...");
  setTimeout(() => doLoginAction("Naver"), 800);
}

/** 로그인 폼 제출 */
function doLogin() { doLoginAction(); }

/**
 * 데모 로그인 실행. 선택된 역할에 따라 사용자 정보를 설정합니다.
 * @param {string} [provider=''] - 소셜 로그인 제공자 이름 (표시용)
 */
function doLoginAction(provider = "") {
  try {
    currentRole = selectedRole;
    const names = { member: "정세연", leader: "김철수", admin: "최지수" };
    const roles = { member: "팀원 · 총무팀", leader: "팀장 · 총무팀", admin: "관리자 · 시스템" };

    currentUser.name   = names[currentRole];
    currentUser.avatar = names[currentRole][0];

    _applyUserToUI(roles[currentRole]);

    // 팀장/관리자만 팀원 추가 버튼 노출
    const addBtn = document.getElementById("btn-addmember");
    if (addBtn) {
      addBtn.style.display =
        currentRole === "leader" || currentRole === "admin" ? "flex" : "none";
    }

    document.getElementById("login-overlay").style.display = "none";
    showToast(`✅ ${currentUser.name}님 로그인 완료${provider ? " (" + provider + ")" : ""}`);
  } catch (err) {
    console.error("로그인 UI 업데이트 중 오류:", err);
  }
}

/** 로그아웃 */
async function doLogout() {
  closeModal("m-settings");
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  } else {
    document.getElementById("login-overlay").style.display = "flex";
  }
  showToast("🔒 로그아웃 되었습니다.");
}

/**
 * 역할 선택 버튼 클릭 시 호출
 * @param {'member'|'leader'|'admin'} r
 */
function setRole(r) {
  selectedRole = r;
  ["member", "leader", "admin"].forEach((x) =>
    document.getElementById("role-" + x).classList.toggle("active", x === r)
  );
}

/** 공통 UI 사용자 정보 반영 헬퍼 */
function _applyUserToUI(roleLabel = "") {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("user-name",     currentUser.name);
  set("user-avatar",   currentUser.avatar);
  set("settings-avatar", currentUser.avatar);
  set("settings-name",   currentUser.name);
  set("settings-email",  currentUser.email);
  if (roleLabel) set("user-role-lbl", roleLabel);
  const emailInp = document.getElementById("settings-inp-email");
  if (emailInp) emailInp.value = currentUser.email;
}


// ══════════════════════════════════════════════
// 7. 페이지 탭 전환
// ══════════════════════════════════════════════

/**
 * 지정된 페이지를 활성화합니다.
 * @param {number} n - 페이지 번호 (1~5)
 */
function showPage(n) {
  currentPage = n;
  document.querySelectorAll(".page").forEach((p, i) =>
    p.classList.toggle("active", i === n - 1)
  );
  document.querySelectorAll(".ptab").forEach((t, i) =>
    t.classList.toggle("active", i === n - 1)
  );
}


// ══════════════════════════════════════════════
// 8. KPI 바
// ══════════════════════════════════════════════

/** 상단 KPI 지표를 현재 데이터 기준으로 갱신합니다. */
function updateKPI() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("kpi-a", todos.filter((t) => !t.done).length);
  set("kpi-w", trackers.filter((t) => t.st === "bpa").length);
  set("kpi-u", todos.filter((t) => !t.done && t.pri === "d1").length);
  set("kpi-d", todos.filter((t) => t.done).length);

  const unread = alerts.filter((a) => !a.read).length;
  set("notif-cnt", unread);
}


// ══════════════════════════════════════════════
// 9. Todo (할 일 관리)
// ══════════════════════════════════════════════

/**
 * Todo 필터 변경
 * @param {'all'|'active'|'done'} f
 */
function filterTodo(f) { todoFilter = f; renderTodo(); }

/** Todo 목록 렌더링 (최대 5건 표시) */
function renderTodo() {
  const filtered =
    todoFilter === "all"    ? todos :
    todoFilter === "active" ? todos.filter((t) => !t.done) :
                              todos.filter((t) => t.done);

  document.getElementById("todo-list").innerHTML = filtered.slice(0, 5).map(
    (t) => `
    <div class="row">
      <input type="checkbox" ${t.done ? "checked" : ""} onchange="toggleTodo(${t.id})"
        style="accent-color:#3b82f6;cursor:pointer;width:13px;height:13px;flex-shrink:0"/>
      <span class="flex1 f10" style="${t.done ? "text-decoration:line-through;color:#334155" : "color:#cbd5e1"}">${t.text}</span>
      <span class="tag ${t.pri === "d1" ? "td1" : t.pri === "d2" ? "td2" : "td5"}">${t.pri.toUpperCase()}</span>
      <span class="xb" onclick="deleteTodo(${t.id})">✕</span>
    </div>`
  ).join("");

  document.getElementById("todo-cnt").textContent =
    `(${todos.filter((x) => !x.done).length}/${todos.length})`;
  updateKPI();
}

/**
 * Todo 완료 상태 토글
 * @param {number} id
 */
function toggleTodo(id) {
  const t = todos.find((x) => x.id === id);
  if (!t) return;
  t.done = !t.done;
  renderTodo();
  const tog = document.getElementById("tog-toast");
  if (t.done && tog?.checked) showToast("✅ 업무 완료: " + t.text.slice(0, 20) + "...");
}

/**
 * Todo 삭제
 * @param {number} id
 */
function deleteTodo(id) {
  const i = todos.findIndex((x) => x.id === id);
  if (i > -1) todos.splice(i, 1);
  renderTodo();
}

/** 인라인 입력으로 Todo 추가 */
function addTodo() {
  const inp = document.getElementById("todo-inp");
  const pri = document.getElementById("todo-pri").value;
  if (!inp.value.trim()) return;
  todos.unshift({ id: todoIdSeq++, text: inp.value.trim(), pri, done: false, assign: currentUser.name });
  inp.value = "";
  renderTodo();
}

/** 모달에서 Todo 추가 */
function addTaskFromModal() {
  const name = document.getElementById("task-name").value.trim();
  const pri  = document.getElementById("task-pri").value;
  if (!name) return;
  todos.unshift({
    id: todoIdSeq++,
    text: name,
    pri,
    done: false,
    assign: document.getElementById("task-assign").value,
  });
  document.getElementById("task-name").value = "";
  closeModal("m-addtask");
  renderTodo();
  showToast("✅ 업무 등록 완료");
}


// ══════════════════════════════════════════════
// 10. 마일스톤
// ══════════════════════════════════════════════

/** 프로젝트 마일스톤 목록 렌더링 */
function renderMilestones() {
  document.getElementById("ms-list").innerHTML = milestones.map(
    (m) => `
    <div class="row" style="flex-direction:column;align-items:stretch;gap:4px">
      <div style="display:flex;justify-content:space-between">
        <span class="f10" style="color:#cbd5e1">${m.name}</span>
        <span class="f9 c64">마감 ${m.due}</span>
      </div>
      <div class="pb"><div class="pf" style="width:${m.pct}%;background:${m.color}"></div></div>
      <div style="text-align:right;font-size:9px;color:${m.color}">${m.pct}%</div>
    </div>`
  ).join("");
}


// ══════════════════════════════════════════════
// 11. 결재 트래커
// ══════════════════════════════════════════════

/** 결재 문서 트래커 렌더링 */
function renderTracker() {
  const stCls = { bac: "bac", bpa: "bpa", bdo: "bdo", bre: "bre" };
  const stLbl = { bac: "기안중", bpa: "검토중", bdo: "완결", bre: "반려" };

  document.getElementById("tracker-list").innerHTML = trackers.slice(0, 4).map(
    (t) => `<div class="row">
      <span class="flex1 f10 c94">${t.name}</span>
      <span class="f9 c64">${t.date}</span>
      <span class="tbadge ${stCls[t.st]}">${stLbl[t.st]}</span>
    </div>`
  ).join("");

  ["bac","bpa","bdo","bre"].forEach((st, i) => {
    const ids = ["tr-d","tr-w","tr-ok","tr-r"];
    const el = document.getElementById(ids[i]);
    if (el) el.textContent = trackers.filter((t) => t.st === st).length;
  });

  const ml = document.getElementById("m-tracker-list");
  if (ml) ml.innerHTML = trackers.map(
    (t) => `<div class="row">
      <span class="flex1 f10 c94">${t.name}</span>
      <span class="f9 c64">${t.date}</span>
      <span class="tbadge ${stCls[t.st]}">${stLbl[t.st]}</span>
    </div>`
  ).join("");
}

/** 모달에서 결재 문서 등록 */
function addTracker() {
  const n  = document.getElementById("m-track-inp").value.trim();
  const st = document.getElementById("m-track-st").value;
  if (!n) return;
  trackers.unshift({
    id: trackerIdSeq++,
    name: n,
    st,
    date: new Date().toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }),
  });
  document.getElementById("m-track-inp").value = "";
  renderTracker();
  showToast("📄 문서 등록 완료");
}


// ══════════════════════════════════════════════
// 12. 결재 경로 시각화
// ══════════════════════════════════════════════

/** 선택된 문서의 결재 경로를 단계별로 렌더링합니다. */
function renderApproval() {
  const idx   = parseInt(document.getElementById("ap-sel").value);
  const steps = approvals[idx];
  document.getElementById("ap-path").innerHTML = steps.map(
    (s, i) => `
    <div class="ap-step">
      <div class="ap-node ap-${s.s}">${s.n}</div>
      <div class="ap-name">${s.n}</div>
    </div>${i < steps.length - 1 ? '<div class="ap-arr">→</div>' : ""}`
  ).join("");
}


// ══════════════════════════════════════════════
// 13. 알림
// ══════════════════════════════════════════════

/** 알림 목록 렌더링 */
function renderAlerts() {
  const row = (a) => `
    <div class="row" style="${a.read ? "opacity:.5" : ""}">
      <span style="width:7px;height:7px;border-radius:50%;background:${a.color};flex-shrink:0"></span>
      <span class="flex1 f10 c94">${a.msg}</span>
      <span class="f9 c64">${a.time}</span>
    </div>`;

  const list = document.getElementById("alert-list");
  if (list) list.innerHTML = alerts.slice(0, 4).map(row).join("");

  const ml = document.getElementById("m-notif-list");
  if (ml) ml.innerHTML = alerts.map(row).join("");

  updateKPI();
}

/** 모든 알림을 읽음 처리합니다. */
function clearAlerts() {
  alerts.forEach((a) => (a.read = true));
  renderAlerts();
  showToast("🔕 알림을 모두 읽음 처리했습니다");
}


// ══════════════════════════════════════════════
// 14. 달력
// ══════════════════════════════════════════════

/** 현재 calYear/calMonth 기준으로 그리드형 달력을 렌더링합니다. */
function renderCalendar() {
  document.getElementById("cal-title").innerHTML = `${calYear}년 ${calMonth + 1}월`;

  const days  = ["일", "월", "화", "수", "목", "금", "토"];
  const first = new Date(calYear, calMonth, 1).getDay();
  const last  = new Date(calYear, calMonth + 1, 0).getDate();
  const todayKey = `${TODAY.getFullYear()}-${TODAY.getMonth() + 1}-${TODAY.getDate()}`;

  let html = '<div class="cal-grid">';
  html += days.map((d, i) =>
    `<div class="cdn ${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${d}</div>`
  ).join("");

  for (let i = 0; i < first; i++) html += `<div class="cd empty"></div>`;

  for (let d = 1; d <= last; d++) {
    const key       = `${calYear}-${calMonth + 1}-${d}`;
    const isToday   = key === todayKey;
    const past      = new Date(calYear, calMonth, d) < TODAY && !isToday;
    const dayOfWeek = (first + d - 1) % 7;

    let cls = "cd";
    if (isToday) cls += " today";
    else if (past) cls += " past";
    else {
      if (dayOfWeek === 0) cls += " sun";
      if (dayOfWeek === 6) cls += " sat";
    }

    let evHtml = "";
    if (calEvents[key]) {
      evHtml = calEvents[key].slice(0, 2).map(
        (e, idx) => `<div class="ev-badge ${idx > 0 ? "multi" : ""}">${e}</div>`
      ).join("");
      if (calEvents[key].length > 2)
        evHtml += `<div style="font-size:7px;color:#94a3b8;margin-top:1px;padding-left:2px">+${calEvents[key].length - 2}</div>`;
    }

    html += `<div class="${cls}" onclick="selectDay(${d})">
      <div class="cd-num">${d}</div>
      <div class="ev-wrap">${evHtml}</div>
    </div>`;
  }

  const totalCells = first + last;
  const endEmpty   = Math.ceil(totalCells / 7) * 7 - totalCells;
  for (let i = 0; i < endEmpty; i++) html += `<div class="cd empty"></div>`;
  html += "</div>";

  document.getElementById("cal-grid").innerHTML = html;
}

/**
 * 달력 월 이동
 * @param {-1|1} d - -1: 이전달, 1: 다음달
 */
function changeMonth(d) {
  calMonth += d;
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0;  calYear++; }
  renderCalendar();
}

/**
 * 달력 날짜 클릭 시 이벤트 팝업 표시
 * @param {number} d - 날짜 숫자
 */
function selectDay(d) {
  const key = `${calYear}-${calMonth + 1}-${d}`;
  const box = document.getElementById("cal-ev-box");
  if (!box) return;
  if (calEvents[key]) {
    box.style.display = "block";
    box.innerHTML = `<b>${calMonth + 1}/${d}</b><br>` +
      calEvents[key].map((e) => `• ${e}`).join("<br>");
  } else {
    box.style.display = "none";
  }
}


// ══════════════════════════════════════════════
// 15. 히트맵
// ══════════════════════════════════════════════

/** 업무 밀도 히트맵 렌더링 */
function renderHeatmap() {
  const max = Math.max(...hmData);
  const el  = document.getElementById("hm-grid");
  if (!el) return;
  el.innerHTML = hmData.map((v) => {
    const a = 0.15 + (v / max) * 0.85;
    return `<div class="hm-cell" style="background:rgba(59,130,246,${a.toFixed(2)})" title="${v}건"></div>`;
  }).join("");
}


// ══════════════════════════════════════════════
// 16. 결산 분석
// ══════════════════════════════════════════════

/**
 * 분석 탭 전환
 * @param {'daily'|'weekly'|'monthly'|'quarter'|'annual'} mode
 */
function switchAnalysis(mode) {
  analysisMode = mode;
  document.querySelectorAll(".atab").forEach((t, i) => {
    const modes = ["daily", "weekly", "monthly", "quarter", "annual"];
    t.classList.toggle("active", modes[i] === mode);
  });
  renderAnalysis();
}

/** 현재 analysisMode 기준으로 결산 분석 차트 렌더링 */
function renderAnalysis() {
  const d    = analysisData[analysisMode];
  const area = document.getElementById("analysis-area");
  if (!area) return;
  area.innerHTML =
    `<div style="font-size:10px;color:#60a5fa;font-weight:700;margin-bottom:8px">${d.label}</div>` +
    d.items.map(
      (item) => `
      <div style="margin-bottom:6px">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-bottom:2px">
          <span>${item.n}</span>
          <span style="color:${item.c};font-weight:700">${item.v}</span>
        </div>
        <div class="pb"><div class="pf" style="width:${Math.round((item.v / item.max) * 100)}%;background:${item.c}"></div></div>
      </div>`
    ).join("");
}


// ══════════════════════════════════════════════
// 17. 도넛 차트 (예산)
// ══════════════════════════════════════════════

/** SVG 도넛 차트 stroke-dasharray 애니메이션 적용 */
function updateDonut() {
  const circ = 188;
  const data = [
    { pct: 0.44,  el: "dc1" },
    { pct: 0.17,  el: "dc2" },
    { pct: 0.085, el: "dc3" },
  ];
  let cum = 0;
  data.forEach((d) => {
    const el = document.getElementById(d.el);
    if (!el) return;
    el.style.strokeDasharray  = `${circ * d.pct} ${circ - circ * d.pct}`;
    el.style.strokeDashoffset = String(-(circ * cum));
    cum += d.pct;
  });
}


// ══════════════════════════════════════════════
// 18. AI 비서 채팅
// ══════════════════════════════════════════════

/** AI 비서 입력창 메시지 전송 */
function sendAI() {
  const inp = document.getElementById("ai-inp");
  const q   = inp.value.trim();
  if (!q) return;
  addChatMsg(q, true);
  inp.value = "";

  const area = document.getElementById("chat-area");
  const spin = document.createElement("div");
  spin.className = "msg ml2";
  spin.style.cssText = "color:#475569;font-size:11px;align-self:flex-start;padding:6px";
  spin.innerHTML = '<span class="sp2"></span>';
  area.appendChild(spin);
  area.scrollTop = area.scrollHeight;

  setTimeout(() => {
    area.removeChild(spin);
    const ans =
      aiResponses[q] ||
      `🤖 현재 업무 기준으로 분석 중입니다. 진행 업무 ${todos.filter((t) => !t.done).length}건, 결재 대기 ${trackers.filter((t) => t.st === "bpa").length}건이 있습니다. 다른 질문이 있으시면 말씀해주세요!`;
    addChatMsg(ans, false);
  }, 800 + Math.random() * 400);
}

/**
 * 빠른 질문 버튼 클릭
 * @param {string} q - 질문 텍스트
 */
function quickAsk(q) {
  document.getElementById("ai-inp").value = q;
  sendAI();
}

/**
 * AI 채팅 말풍선 추가
 * @param {string} txt
 * @param {boolean} isUser - true: 사용자, false: AI
 */
function addChatMsg(txt, isUser) {
  const area = document.getElementById("chat-area");
  const div  = document.createElement("div");
  div.className = "msg " + (isUser ? "mu" : "ma");
  div.innerHTML = (isUser ? "" : `<div class="mal">AI 비서</div>`) + txt;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}


// ══════════════════════════════════════════════
// 19. 메모
// ══════════════════════════════════════════════

/** 메모 내용을 localStorage에 저장 */
function saveMemo() {
  const val = document.getElementById("memo-area")?.value;
  if (localStorage && val !== undefined) localStorage.setItem("adminmemo", val);
  const s = document.getElementById("memo-saved");
  if (s) { s.style.opacity = "1"; setTimeout(() => (s.style.opacity = "0"), 2000); }
}

/** 메모 초기화 */
function clearMemo() {
  const el = document.getElementById("memo-area");
  if (el) el.value = "";
  if (localStorage) localStorage.removeItem("adminmemo");
}


// ══════════════════════════════════════════════
// 20. 포스트잇
// ══════════════════════════════════════════════

/**
 * 개인 포스트잇 추가
 * @param {'yellow'|'green'|'pink'|'blue'} color
 */
function addSticky(color) {
  const txt = prompt("포스트잇 내용을 입력하세요:");
  if (!txt) return;
  stickies.push({ id: stickyIdSeq++, text: txt, color });
  renderStickies();
}

/** 개인 포스트잇 렌더링 */
function renderStickies() {
  const el = document.getElementById("sticky-wrap");
  if (!el) return;
  el.innerHTML = stickies.map(
    (s) => `
    <div class="sticky" style="background:${stickyColors[s.color]}" title="${s.text}">
      <button class="sticky-del" onclick="deleteSticky(${s.id})">✕</button>
      <div class="sticky-text">${s.text.slice(0, 50)}</div>
    </div>`
  ).join("");
}

/**
 * 개인 포스트잇 삭제
 * @param {number} id
 */
function deleteSticky(id) {
  const i = stickies.findIndex((s) => s.id === id);
  if (i > -1) stickies.splice(i, 1);
  renderStickies();
}

/**
 * 팀 공유 포스트잇 추가
 * @param {'yellow'|'green'|'pink'|'blue'} color
 */
function addSharedSticky(color) {
  const txt = prompt("공유 포스트잇 내용:");
  if (!txt) return;
  sharedStickies.push({ id: sharedIdSeq++, text: txt, color, author: currentUser.name });
  renderSharedStickies();
  showToast("📌 팀 공유 포스트잇 추가");
}

/** 팀 공유 포스트잇 렌더링 */
function renderSharedStickies() {
  const el = document.getElementById("shared-sticky-wrap");
  if (!el) return;
  el.innerHTML = sharedStickies.map(
    (s) => `
    <div class="sticky" style="background:${stickyColors[s.color]}">
      <button class="sticky-del" onclick="deleteSharedSticky(${s.id})">✕</button>
      <div style="font-size:8px;color:#555;margin-bottom:2px">${s.author}</div>
      <div class="sticky-text">${s.text.slice(0, 40)}</div>
    </div>`
  ).join("");
}

/**
 * 팀 공유 포스트잇 삭제
 * @param {number} id
 */
function deleteSharedSticky(id) {
  const i = sharedStickies.findIndex((s) => s.id === id);
  if (i > -1) sharedStickies.splice(i, 1);
  renderSharedStickies();
}


// ══════════════════════════════════════════════
// 21. SNS 채팅
// ══════════════════════════════════════════════

/** SNS 채팅 사용자 목록 렌더링 */
function renderSNSUserList() {
  const el = document.getElementById("sns-userlist");
  if (!el) return;
  el.innerHTML = snsChats.map(
    (c, i) => `
    <div class="sns-user${i === snsActiveChat ? " active" : ""}" onclick="selectSNSChat(${i})">
      <div class="avatar" style="width:24px;height:24px;font-size:10px;flex-shrink:0">${c.avatar}</div>
      <div style="flex:1;overflow:hidden">
        <div style="font-size:10px;font-weight:600;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.name}</div>
        <div style="font-size:9px;color:#64748b">${c.type === "channel" ? "채널" : "DM"}</div>
      </div>
      ${c.unread ? `<span class="badge-cnt">${c.unread}</span>` : ""}
    </div>`
  ).join("");
}

/**
 * SNS 채팅방 선택
 * @param {number} i - 채팅방 인덱스
 */
function selectSNSChat(i) {
  snsActiveChat = i;
  snsChats[i].unread = 0;
  const c = snsChats[i];

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("sns-chat-avatar", c.avatar);
  set("sns-chat-name",   c.name);
  set("sns-chat-status",
    c.type === "channel"
      ? "채널 · " + (Math.floor(Math.random() * 4) + 2) + "명 참여"
      : c.online ? "● 온라인" : "○ 오프라인"
  );

  renderSNSMessages();
  renderSNSUserList();

  const total = snsChats.reduce((a, x) => a + x.unread, 0);
  const kpiEl = document.getElementById("kpi-chat");
  if (kpiEl) kpiEl.textContent = total;
}

/** 현재 채팅방 메시지 렌더링 */
function renderSNSMessages() {
  const msgs = snsMessages[snsActiveChat] || [];
  const el   = document.getElementById("sns-msgs");
  if (!el) return;
  el.innerHTML = msgs.map(
    (m) => `
    <div class="${m.me ? "sns-msg-u" : "sns-msg-t"}">
      ${!m.me ? `<div class="sns-from">${m.from}</div>` : ""}
      ${m.text}
      <div style="font-size:8px;opacity:.5;margin-top:2px;text-align:${m.me ? "right" : "left"}">${m.time}</div>
    </div>`
  ).join("");
  el.scrollTop = el.scrollHeight;
}

/** SNS 메시지 전송 (자동 응답 포함) */
function sendSNS() {
  const inp = document.getElementById("sns-inp");
  const txt = inp.value.trim();
  if (!txt) return;

  if (!snsMessages[snsActiveChat]) snsMessages[snsActiveChat] = [];
  snsMessages[snsActiveChat].push({
    from: "나", text: txt, me: true,
    time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
  });
  inp.value = "";
  renderSNSMessages();

  setTimeout(() => {
    const replies = ["알겠습니다!", "확인했습니다 👍", "수고하세요!", "네, 바로 처리하겠습니다.", "감사합니다!"];
    const r = replies[Math.floor(Math.random() * replies.length)];
    snsMessages[snsActiveChat].push({
      from: snsChats[snsActiveChat].name, text: r, me: false,
      time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    });
    renderSNSMessages();
    const tog = document.getElementById("tog-chatnotif");
    if (tog?.checked) showToast("💬 새 메시지: " + r.slice(0, 20));
  }, 1200);
}

/** 새 채팅 / 채널 생성 */
function createChat() {
  const name = document.getElementById("new-chat-name").value.trim();
  if (!name) return;
  snsChats.push({ name, type: "channel", avatar: name[0], online: true, unread: 0 });
  snsMessages.push([{
    from: "시스템",
    text: `${name} 채널이 생성되었습니다.`,
    me: false,
    time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
  }]);
  closeModal("m-newchat");
  renderSNSUserList();
  showToast("💬 채팅방 생성: " + name);
}


// ══════════════════════════════════════════════
// 22. 팀원 관리
// ══════════════════════════════════════════════

/** 팀원 목록 렌더링 */
function renderMembers() {
  const roleLbl = { member: "팀원", leader: "팀장", admin: "관리자" };
  const roleCls = { member: "role-member", leader: "role-leader", admin: "role-tag" };
  const el = document.getElementById("member-list");
  if (!el) return;
  el.innerHTML = members.map(
    (m) => `
    <div class="member-row">
      <div class="avatar" style="width:26px;height:26px;font-size:11px;flex-shrink:0">${m.avatar}</div>
      <div style="flex:1">
        <div style="font-size:11px;font-weight:600;color:#e2e8f0">${m.name}</div>
        <div style="font-size:9px;color:#64748b">${m.email}</div>
      </div>
      <div class="online-dot" style="background:${m.online ? "#22c55e" : "#334155"}"></div>
      <span class="role-tag ${roleCls[m.role]}">${roleLbl[m.role]}</span>
    </div>`
  ).join("");
}

/** 모달에서 팀원 추가 */
function addMember() {
  const name  = document.getElementById("new-member-name").value.trim();
  const email = document.getElementById("new-member-email").value.trim();
  const role  = document.getElementById("new-member-role").value;
  if (!name || !email) return;
  members.push({ name, email, role, avatar: name[0], online: false });
  document.getElementById("new-member-name").value  = "";
  document.getElementById("new-member-email").value = "";
  closeModal("m-addmember");
  renderMembers();
  showToast("👤 팀원 추가: " + name);
}


// ══════════════════════════════════════════════
// 23. 업무 분장
// ══════════════════════════════════════════════

/** 업무 분장 목록 렌더링 */
function renderAssigns() {
  const el = document.getElementById("assign-list");
  if (el) el.innerHTML = assigns.map(
    (a) => `<div class="row">
      <span class="f10" style="color:#93c5fd;min-width:44px;flex-shrink:0">${a.member}</span>
      <span class="flex1 f10 c94">${a.task}</span>
    </div>`
  ).join("");

  const ml = document.getElementById("assign-modal-list");
  if (ml) ml.innerHTML = assigns.map(
    (a) => `<div class="row">
      <span class="f10" style="color:#93c5fd;min-width:44px">${a.member}</span>
      <span class="flex1 f10 c94">${a.task}</span>
      <span class="xb" onclick="deleteAssign('${a.member}')">✕</span>
    </div>`
  ).join("");
}

/** 업무 분장 추가 또는 수정 */
function addAssign() {
  const member = document.getElementById("assign-member").value;
  const task   = document.getElementById("assign-task").value.trim();
  if (!task) return;
  const existing = assigns.find((a) => a.member === member);
  if (existing) existing.task = task;
  else assigns.push({ member, task });
  document.getElementById("assign-task").value = "";
  renderAssigns();
  showToast("✅ 업무 분장 업데이트");
}

/**
 * 업무 분장 삭제
 * @param {string} member - 팀원 이름
 */
function deleteAssign(member) {
  const i = assigns.findIndex((a) => a.member === member);
  if (i > -1) assigns.splice(i, 1);
  renderAssigns();
}


// ══════════════════════════════════════════════
// 24. 공지
// ══════════════════════════════════════════════

const noticeColors = { 긴급: "#ef4444", 안내: "#fbbf24", 공지: "#3b82f6", 행사: "#22c55e" };

/** 공지 목록 렌더링 */
function renderNotices() {
  const el = document.getElementById("notice-list");
  if (!el) return;
  el.innerHTML = notices.map(
    (n) => `
    <div class="row">
      <span style="width:6px;height:6px;border-radius:50%;background:${noticeColors[n.type]};flex-shrink:0"></span>
      <div style="flex:1">
        <div style="font-size:10px;color:#e2e8f0">[${n.type}] ${n.title}</div>
        <div style="font-size:9px;color:#64748b">${n.date} · ${n.author}</div>
      </div>
    </div>`
  ).join("");
}

/** 공지 작성 및 등록 */
function postNotice() {
  const title = document.getElementById("notice-title").value.trim();
  const type  = document.getElementById("notice-type").value;
  if (!title) return;
  notices.unshift({
    type, title,
    date: new Date().toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }),
    author: currentUser.name,
  });
  document.getElementById("notice-title").value = "";
  document.getElementById("notice-body").value  = "";
  closeModal("m-notice");
  renderNotices();
  showToast("📢 공지 등록 완료");
}


// ══════════════════════════════════════════════
// 25. 로그인 기록
// ══════════════════════════════════════════════

/** 로그인 기록 목록 렌더링 */
function renderLoginLog() {
  const el = document.getElementById("login-log");
  if (!el) return;
  el.innerHTML = loginLog.map(
    (l) => `
    <div class="row">
      <span class="flex1 f10 c94">${l.device}</span>
      <span class="f9 c64">${l.loc}</span>
      <span class="f9 c64">${l.time.split(" ")[1]}</span>
    </div>`
  ).join("");
}


// ══════════════════════════════════════════════
// 26. 문서 초안 생성기
// ══════════════════════════════════════════════

/**
 * 문서 유형에 맞는 초안 템플릿을 미리보기 영역에 표시합니다.
 * @param {'품의서'|'회의록'|'보고서'|'출장신청'|'업무협조'|'연차신청'} type
 */
function genDoc(type) {
  const prev = document.getElementById("doc-prev");
  if (!prev) return;
  prev.textContent = templates[type] || "템플릿 없음";
  prev.style.display = "block";
  showToast("📝 " + type + " 초안 생성 완료");
}


// ══════════════════════════════════════════════
// 27. 일일결산 이메일 발송 시뮬레이션
// ══════════════════════════════════════════════

/** 일일결산 이메일 발송 시뮬레이션 (콘솔에 내용 출력) */
function sendDailyEmail() {
  showToast("📧 일일결산 이메일 발송 중...");
  setTimeout(() => {
    const completed = todos.filter((t) => t.done).length;
    const pending   = todos.filter((t) => !t.done).length;
    const urgent    = todos.filter((t) => !t.done && t.pri === "d1").length;
    const subject   = `[일일결산] ${TODAY.toLocaleDateString("ko-KR")} 총무팀 업무 현황`;
    const body      = `총무팀 일일결산 보고\n\n완료 업무: ${completed}건\n진행 업무: ${pending}건\n긴급 업무: ${urgent}건\n결재 대기: ${trackers.filter((t) => t.st === "bpa").length}건\n\n– 발신: ${currentUser.name} (${currentUser.email})`;
    showToast(`✅ 일일결산 발송 완료!\n${subject}`);
    console.log("EMAIL SENT\nTo:", currentUser.email, "\nSubject:", subject, "\nBody:\n", body);
  }, 1200);
}


// ══════════════════════════════════════════════
// 28. 모달
// ══════════════════════════════════════════════

/**
 * 모달 열기
 * @param {string} id - 모달 요소 id
 */
function openModal(id) {
  document.getElementById(id)?.classList.add("open");
  if (id === "m-tracker") renderTracker();
  if (id === "m-notif")   renderAlerts();
}

/**
 * 모달 닫기
 * @param {string} id - 모달 요소 id
 */
function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}


// ══════════════════════════════════════════════
// 29. 토스트 알림
// ══════════════════════════════════════════════

/**
 * 토스트 메시지를 3초간 표시합니다.
 * @param {string} msg - 표시할 메시지
 */
function showToast(msg) {
  const wrap = document.getElementById("toast-wrap");
  if (!wrap) return;
  const t = document.createElement("div");
  t.className   = "toast";
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.animation = "slideOut .3s ease forwards";
    setTimeout(() => wrap.contains(t) && wrap.removeChild(t), 300);
  }, 3000);
}


// ══════════════════════════════════════════════
// 30. 도넛 초기 애니메이션 (지연 실행)
// ══════════════════════════════════════════════

setTimeout(() => {
  const circ = 188;
  const segs = [
    { el: "dc1", pct: 0.44,  color: "#3b82f6" },
    { el: "dc2", pct: 0.17,  color: "#22c55e" },
    { el: "dc3", pct: 0.085, color: "#fbbf24" },
  ];
  let cum = 0;
  segs.forEach((s) => {
    const el = document.getElementById(s.el);
    if (!el) return;
    const dl = circ * s.pct;
    el.style.strokeDasharray  = `${dl} ${circ - dl}`;
    el.style.strokeDashoffset = String(-(circ * cum));
    cum += s.pct;
  });
}, 500);
