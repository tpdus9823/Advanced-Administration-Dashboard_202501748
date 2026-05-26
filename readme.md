# 행정업무 종합 대시보드 v2.0

행정팀(총무팀)의 일상적인 업무를 하나의 화면에서 통합 관리하는 웹 기반 대시보드입니다.  
단일 HTML 파일로 구성되어 별도 설치 없이 브라우저에서 즉시 실행됩니다.

---

## 주요 기능

### 1. 로그인 / 인증
- **역할 선택 로그인**: 팀원 / 팀장 / 관리자 역할을 선택하여 데모 로그인
- **Google OAuth 로그인**: Supabase를 통한 Google 소셜 로그인 연동 (선택적)
- **Naver OAuth 로그인**: 시뮬레이션 지원
- 로그인 상태에 따라 UI 권한(팀원 추가 버튼 등) 자동 제어

### 2. 상단 KPI 바 (7개 지표 실시간 표시)
| 지표 | 설명 |
|------|------|
| 진행업무 | 미완료 Todo 건수 |
| 결재대기 | 검토중(bpa) 상태 문서 건수 |
| 긴급(D-1) | 마감 D-1인 미완료 업무 수 |
| 완료 | 완료 처리된 Todo 수 |
| 미읽은 알림 | 읽지 않은 알림 건수 |
| 안읽은채팅 | SNS 채팅 미읽음 합계 |
| 실시간 시계 | 현재 시각 (1초 갱신) |

### 3. 페이지 탭 구성 (5개 페이지)

#### 📋 Page 1: 업무 · 결재 · AI비서
- **할 일(Todo) 관리**: 추가 / 완료 체크 / 삭제 / 우선순위(D-1~D-5) 필터
- **프로젝트 마일스톤**: 진행률 프로그레스 바 + 마감일 표시
- **결재 경로 추적기**: 결재 문서별 단계(담당→팀장→부장→본부장→대표) 시각화
- **결재·문서 트래커**: 기안중 / 검토중 / 완결 / 반려 상태 집계 + 목록
- **부서 예산 현황**: 도넛 차트 (소모품 44% / 교육비 17% / 회식비 8.5% / 잔여)
- **빠른 문서 초안 생성기**: 품의서 / 회의록 / 보고서 / 출장신청 / 업무협조 / 연차신청 템플릿 자동 생성
- **AI 비서**: 미리 정의된 응답 + 자유 텍스트 질문 지원 (빠른 버튼 제공)
- **그리드형 달력**: 월 이동 가능, 일정 이벤트 표시, 날짜 클릭 시 이벤트 상세 팝업

#### 💬 Page 2: SNS 채팅
- 채널 목록(#총무팀 전체, #공지채널) + 개인 DM 목록
- 메시지 송수신 (자동 랜덤 응답 시뮬레이션)
- 온라인/오프라인 상태 표시
- 미읽음 배지 표시
- 새 채팅/채널 생성 모달

#### 📊 Page 3: 팀 관리 · 결산 · 알림
- **팀원 목록**: 역할(팀원/팀장/관리자), 온라인 상태 표시
- **업무 분장 관리**: 팀원별 담당 업무 등록/수정/삭제
- **공지 게시판**: 긴급/안내/공지/행사 분류 공지 작성 및 조회
- **업무 결산 분석**: 일일 / 주간 / 월간 / 분기 / 연간 프로그레스 차트
- **업무 밀도 히트맵**: 13개 셀 히트맵으로 시간대별 업무 집중도 시각화
- **알림 센터**: 읽음/미읽음 표시, 전체 읽음 처리

#### 📌 Page 4: 메모 · 포스트잇 · 설정
- **개인 메모패드**: localStorage 저장/불러오기
- **개인 포스트잇**: 4가지 색상(노랑/초록/핑크/파랑) 추가/삭제
- **팀 공유 포스트잇**: 작성자 표시 공유 메모
- **로그인 기록**: 디바이스 / 위치 / 시간 조회
- **설정 모달**: 프로필 확인, 알림 설정 토글, Google 계정 연동 상태, 이메일 설정

#### 🏢 Page 5: 내 정보
- 프로필 카드 (이름 / 이메일 / 역할 / 아바타)
- OAuth 연동 상태 (Google / Naver)
- 잔여 연차 현황 도넛 차트
- 일일결산 이메일 발송 기능

---

## 기술 스택

| 구분 | 내용 |
|------|------|
| 언어 | HTML5, CSS3 (인라인 변수 기반), Vanilla JavaScript (ES6+) |
| 외부 라이브러리 | Supabase JS SDK v2 (`@supabase/supabase-js@2`) |
| 인증 | Supabase Auth (Google OAuth 2.0), 데모 로그인 |
| 폰트 | Pretendard, Noto Sans KR (시스템 폰트 스택) |
| 빌드 도구 | 없음 (단일 HTML 파일 자체 완결) |

---

## 프로젝트 구조

```
행정_업무_종합_대시보드.html   ← 단일 파일 (CSS + HTML + JS 통합)
readme.md                      ← 프로젝트 설명서 (이 파일)
dashboard.js                   ← 핵심 JavaScript 로직 분리 참조용
```

---

## 설치 및 실행

### 기본 실행 (데모 모드)
```bash
# 별도 설치 없이 브라우저에서 HTML 파일을 직접 열면 됩니다.
open 행정_업무_종합_대시보드.html
```

### Supabase 연동 (선택)
Google OAuth 실제 로그인이 필요한 경우 아래 단계를 따릅니다.

1. [Supabase](https://supabase.com) 프로젝트 생성
2. Supabase 콘솔 → Authentication → Providers → Google 활성화
3. HTML 파일 상단의 두 상수를 수정:
```javascript
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";
```
4. Supabase 콘솔 → Authentication → URL Configuration에 `Redirect URL` 등록

> Supabase 미설정 시 자동으로 데모 로그인 모드로 동작합니다.

---

## 데이터 구조

모든 데이터는 JavaScript 인메모리 배열로 관리됩니다. 새로고침 시 초기화됩니다.

| 변수명 | 타입 | 설명 |
|--------|------|------|
| `todos` | Array | 할 일 목록 (id, text, pri, done, assign) |
| `milestones` | Array | 프로젝트 마일스톤 (name, pct, color, due) |
| `trackers` | Array | 결재 문서 목록 (id, name, st, date) |
| `approvals` | Array[] | 결재 경로 단계별 상태 배열 |
| `alerts` | Array | 알림 목록 (id, msg, time, color, read) |
| `members` | Array | 팀원 목록 (name, email, role, avatar, online) |
| `assigns` | Array | 업무 분장 (member, task) |
| `snsChats` | Array | 채팅 목록 (name, type, avatar, online, unread) |
| `snsMessages` | Array[] | 채팅방별 메시지 배열 |
| `notices` | Array | 공지 목록 (type, title, date, author) |
| `calEvents` | Object | 달력 이벤트 (`'YYYY-M-D'` 키 → 이벤트 배열) |
| `analysisData` | Object | 결산 분석 데이터 (daily/weekly/monthly/quarter/annual) |
| `stickies` | Array | 개인 포스트잇 |
| `sharedStickies` | Array | 팀 공유 포스트잇 |

---

## 주요 함수 목록

자세한 내용은 `dashboard.js` 파일을 참조하세요.

| 함수 | 기능 |
|------|------|
| `init()` | 앱 초기화, 모든 렌더링 함수 호출 |
| `doLogin()` / `loginGoogle()` | 로그인 처리 |
| `showPage(n)` | 탭 페이지 전환 |
| `addTodo()` / `toggleTodo()` / `deleteTodo()` | Todo CRUD |
| `renderTracker()` / `addTracker()` | 결재 트래커 관리 |
| `renderApproval()` | 결재 경로 시각화 |
| `renderCalendar()` / `changeMonth()` | 달력 렌더링 |
| `sendAI()` / `quickAsk()` | AI 비서 채팅 |
| `sendSNS()` / `selectSNSChat()` | SNS 채팅 |
| `genDoc(type)` | 문서 템플릿 생성 |
| `sendDailyEmail()` | 일일결산 이메일 발송 시뮬레이션 |
| `openModal()` / `closeModal()` | 모달 열기/닫기 |
| `showToast(msg)` | 토스트 알림 표시 |
| `updateKPI()` | 상단 KPI 바 실시간 갱신 |

---

## 역할별 권한

| 기능 | 팀원 | 팀장 | 관리자 |
|------|:----:|:----:|:------:|
| Todo 추가/완료 | ✅ | ✅ | ✅ |
| 결재 등록 | ✅ | ✅ | ✅ |
| 팀원 추가 버튼 노출 | ❌ | ✅ | ✅ |
| 공지 작성 | ✅ | ✅ | ✅ |
| 설정 접근 | ✅ | ✅ | ✅ |

---

## 라이선스

내부 업무용 도구입니다. 외부 배포 시 Supabase 및 사용된 폰트의 라이선스를 별도 확인하세요.
