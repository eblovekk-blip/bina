# 나의 가계부 (bina)

휴대폰 웹 링크로 바로 열고, 홈 화면에 추가해서 앱처럼 쓰는 가계부입니다.

- **라이브 앱**: <https://eblovekk-blip.github.io/bina/>
- **저장소**: `eblovekk-blip/bina` (**Public**), GitHub Pages(`main /`, HTTPS)로 배포
- **디자인**: 화이트 바탕 + 선명한 핑크 1포인트 테마 (배경 `#FAFAFA`, 카드 `#FFFFFF`, 보더 `#F1F5F9`, 포인트 핑크 `#EC4899`, 틴트 `#FDF2F8`/`#FCE7F3`). 핑크는 **주요 CTA·활성 탭·선택 상태**에만 절제해 쓰고, 지출은 로즈 `#BE123C`, 수입은 에메랄드 `#047857`로 전 화면에서 의미를 고정했습니다. 보조 글자는 `#64748B` 이상으로 올려 대비를 확보했습니다.
- **카테고리 색상 팔레트**: 톤온톤이 아니라 **서로 확실히 구분되는 대비 팔레트** — 오렌지 `#F97316` · 골드 `#CA8A04` · 시안 `#06B6D4` · 퍼플 `#8B5CF6` · 인디고 `#4F46E5` · 틸 `#14B8A6` · 마젠타 `#C026D3` · 스카이 `#0284C7` · 로즈 `#E11D48` · 그레이 `#64748B`
- **화면 구성**: 하단 **4탭** — `홈` / `가계부` / `자산` / `결혼` (이모지 대신 **동일 굵기 1.8px 단색 SVG 라인 아이콘**)
- **글꼴**: Pretendard 가변 웹폰트(jsDelivr CDN) — 본문 400, 금액·제목 500 위주로 굵기를 줄이고 본문 15.5px로 가독성 확보
- **앱 아이콘**: 핑크 그라데이션(`#F43F5E`→`#EC4899`) 바탕 + 흰색 미니멀 `₩` 심볼 — 512/maskable 512/192/180/32 5종
- **금액 숨김(프라이버시)**: **별도 버튼 없이 숫자 자체를 탭하면 토글**됩니다. 기본 숨김은 **자산 탭 `순자산`·`총자산`·`총부채`·`투자`** 숫자와 **홈 하단 `순자산`** 숫자뿐이고(표시 `••••••원`), 홈의 남은 생활비·많이 쓴 곳·최근 거래와 결혼 탭 예산/납부완료는 항상 그대로 보입니다. 앱을 새로 열면 다시 숨김 상태로 시작합니다(세션 내 토글).
- **저장 위치**: 이 브라우저(`localStorage`) + Google 로그인으로 연결한 Google 스프레드시트(양쪽 함께).
- **연동 방식**: Google 로그인(OAuth 2.0 / Google Identity Services) + Google Sheets API v4 직접 호출.
  무인증 Apps Script 웹 앱(`apps-script/Code.gs`) 방식은 폐기·보관 상태입니다.
- **번역 팝업 차단**: `<html lang="ko" translate="no">`, `<meta name="google" content="notranslate">`, `<meta http-equiv="Content-Language" content="ko">`, `<body class="notranslate" translate="no">` — 브라우저가 '페이지를 번역하겠습니까?' 팝업을 띄우지 않게 합니다. **이 4가지는 지우지 마세요.**
- 기록 이동·백업은 앱의 'JSON으로 내보내기 / 불러오기'를 쓰세요.
- 홈 화면 추가: iPhone은 Safari 공유 → '홈 화면에 추가', Android는 Chrome 메뉴(⋮) → '홈 화면에 추가'.

### 핵심 값 요약 (다른 AI가 바로 쓸 수 있게)

| 항목 | 값 |
| --- | --- |
| 라이브 URL | `https://eblovekk-blip.github.io/bina/` |
| 저장소 | `eblovekk-blip/bina` (Public, Pages는 `main /` 루트) |
| Google OAuth 2.0 클라이언트 ID | `77594730795-59gjsnevseiubedp1pecppfn6tegeufl.apps.googleusercontent.com` (앱에 기본값 내장, `DEFAULT_GOOGLE_CLIENT_ID`) |
| Google 시트 ID | `18IFbYx1RO857pWrbkCj55bzyf2vREPz4QOuO_QN84og` |
| 시트 탭 | `entries` · `budgets` · `assets` · `wedding` (컬럼 규격은 2-1) |
| 로그인 계정 | `eblovekk@gmail.com` (OAuth 동의 화면 테스트 사용자) |
| 앱 캐시 버전 | `sw.js`의 `CACHE = 'budget-app-v16'` |

---

## 0. 화면 구성 (2026-11-17 v16 개편)

| 탭 | 내용 |
| --- | --- |
| `홈` | 생활비 대시보드 — ① **이번 달 남은 생활비 예산**(큰 숫자 + 사용률 바 + `오늘부터 하루 약 XX원씩` + **지난달 같은 날짜까지 대비 한 줄**), ② **많이 쓴 곳**(이번 달 지출 TOP 3~4 가로 막대), ③ **＋ 지출/수입 기록** 버튼 + **최근 거래 4건**(누르면 수정), 맨 아래 작은 링크 `순자산 ›` · `결혼 D-201 ›` |
| `가계부` | 상단 3단 토글 `달력` / `내역` / `분석` + 월 요약(수입·지출·**월간 수지**) |
|  └ 달력 | 일~토 7열, 날짜별 `+수입`(초록) / `-지출`(로즈), 날짜 탭하면 그날 내역이 아래에 표시 |
|  └ 내역 | 검색(메모·사용처) + 분류 칩(`전체`·`기타(미분류)`·주요 분류) + 결제수단 칩 + 날짜별 행 목록, 내부이동은 `이체/이동` 배지와 `↔` 표기 |
|  └ 분석 | 예산 카드(빈 상태에선 버튼 1개), **카드별 실적 게이지**, **카테고리별 가로 막대(상위순)** + **지난달 1일~같은 날짜 대비 증감**, 저축률(수입 없으면 `—`), 고정비·변동비, 최근 6개월 수입·지출 막대 |
| `자산` | 대표 숫자 **순자산 + 기준일**, 보조 지표 `총자산`·`총부채`·`투자`(숫자 탭하면 보임), 아래 `＋ 자산 추가`·`잔액 갱신` 주요 버튼 + `스냅샷 저장`·`요약 복사` 보조 버튼, **자산 구성**(분류별 합계 → 누르면 계좌·종목 펼침) |
| `결혼` | D-day + 총예산·**납부완료**·잔여 + 진행 바 + `예정 XX원`(계약·예정 항목), 항목이 있는 분류만 펼치고 **비어 있는 분류는 하단 칩 하나로** 모음, 항목 상태 `예정` / `계약확정` / `납부완료` |

- **용어 구분**: 홈은 **생활비 예산의 잔액**, 가계부는 **월간 수지(수입 − 지출)** — 서로 다른 숫자입니다. **내부이동(계좌이체·카드대금·저축)** 은 `type: transfer`로 저장하고 수입·지출 합계에서 제외합니다.
- **저축률**: `(수입 − 지출) / 수입 × 100%` (수입 0이면 `— (수입 기록 없음)`)
- **결제수단**: 기본 목록 `카드` / `체크카드` / `현금` / `이체`(`METHODS`)에 **설정에 등록한 카드 이름**과 **이미 기록에 쓰인 결제수단**을 더해 칩으로 보여 줍니다(`methodList()`). 기록 추가·수정 화면의 결제수단 칩과 내역 탭의 결제수단 필터 칩이 같은 목록을 쓰고, 필터 칩은 그 달 목록에 실제로 있는 결제수단만 보입니다. 기록의 `method`는 **아무 문자열이나 그대로 보존**합니다(예전 시트 값·뱅크샐러드 카드명이 `카드`로 뭉개지지 않게).
- **카드별 실적 게이지**: 분석 탭 상단 — 등록한 카드마다 이번 달(조회 중인 달) 사용액·목표 실적·진행률 바·`남은 금액`/`달성 완료` 배지를 보여 줍니다. 목표가 0인 카드는 사용액만(목표 없는 카드는 그 달 사용액이 있을 때만) 표시하고, 사용액은 그 달 `type: expense` 중 `method`가 카드 이름과 같은 건의 합계입니다.
- **카드 및 목표 실적 설정**: 설정(⚙) → 카드별 실적 설정 — 카드 이름 추가·삭제, 월 목표 실적(원) 변경, 최대 12개(`localStorage` `household_book_cards_v1`). 기본값은 `우리 K-패스` 30만 · `네이버 현대카드` 30만 · `신한 Always` 목표 없음 · `LOCA LIKIT 1.2 카드` 목표 없음. 카드를 삭제해도 기록은 지워지지 않습니다.
- **고정비·변동비**: 설정(⚙) → 고정비 카테고리 설정에서 고정비로 셀 카테고리를 자유롭게 토글 (localStorage 저장, 기본 `주거/통신`)
- **카테고리별 예산**: 분석 탭 예산 카드의 `변경`(빈 상태에선 `예산 설정` 하나만) → 월 전체 + 지출 카테고리별 금액 입력
- **결혼 지출 합계**: `납부완료` 항목의 결제액만 합산합니다. `예정`·`계약확정` 항목은 `예정` 금액으로 따로 표시합니다.
- **자산 스냅샷**: 자산 탭 `스냅샷 저장` → 그 달 순자산을 기록, 이전 기록 대비 증감과 추이 자동 계산
- **자산 중복 집계 방지**: 같은 자산이 다른 id로 두 번 들어오면(과거 동기화·가져오기 사고) 내용이 완전히 같은 사본은 한 번만 집계합니다(`normalizeState`의 서명 검사).

---

## 1. Google 계정 연동 (한 번만 설정)

### 1-1. 시트
- 스프레드시트: **이은빈 가계부 (bina)**
- URL: <https://docs.google.com/spreadsheets/d/18IFbYx1RO857pWrbkCj55bzyf2vREPz4QOuO_QN84og/edit>
- ID: `18IFbYx1RO857pWrbkCj55bzyf2vREPz4QOuO_QN84og`
- 탭 4개: `entries`(가계부 기록) · `budgets`(월/카테고리 예산·스냅샷) · `assets`(계좌·종목) · `wedding`(결혼 예산)
- 앱 설정의 **스프레드시트 ID** 칸에 이 ID가 기본값으로 들어 있습니다.

### 1-2. Google Cloud에서 OAuth 클라이언트 ID 발급

1. <https://console.cloud.google.com/apis/credentials> 를 본인 Google 계정(`eblovekk@gmail.com`)으로 엽니다.
2. 프로젝트가 없으면 **프로젝트 만들기** → 이름(예: `bina-budget`) → 만들고 선택.
3. 왼쪽 **라이브러리** → `Google Sheets API` 검색 → **사용**.
4. **OAuth 동의 화면**(처음 한 번):
   - 사용자 유형 **외부** → 앱 이름 `bina` → 사용자 지원 이메일(본인) → 저장
   - **테스트 사용자**에 `eblovekk@gmail.com` 추가
5. **사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
   - 애플리케이션 유형: **웹 애플리케이션**
   - **승인된 자바스크립트 원본**에 `https://eblovekk-blip.github.io` 추가 (경로 `/bina/`는 넣지 않습니다)
   - 리디렉션 URI는 필요 없습니다 (토큰 방식).
6. 만들어지면 나오는 **클라이언트 ID**(`…apps.googleusercontent.com`)를 복사합니다.

> 개인용 앱이라 동의 화면을 '테스트' 상태로 두면 됩니다. 테스트 상태에서는 보통 **7일마다 다시 로그인**이 필요할 수 있고, 그때는 앱 상단 배지가 `Google 로그인`으로 바뀝니다. 로그인만 다시 하면 밀린 기록이 자동으로 올라갑니다.

### 1-3. 앱에서 연결

발급받은 클라이언트 ID(`77594730795-59gjsnevseiubedp1pecppfn6tegeufl.apps.googleusercontent.com`)는 앱에 **기본값으로 들어 있어서** 설정에서 따로 넣지 않아도 됩니다. (`DEFAULT_GOOGLE_CLIENT_ID` 상수)

1. 가계부 앱 → **설정(⚙) → Google 계정 연동 (OAuth)** — Client ID와 스프레드시트 ID가 채워져 있는지 확인합니다.
2. **[Google로 로그인 및 시트 동기화]** → `eblovekk@gmail.com` 선택 → 권한 승인(스프레드시트 편집) → 자동으로 시트와 맞춰집니다.
3. 이후에는 앱 상단 배지를 누르면 언제든 다시 맞출 수 있습니다.

| 상단 배지 | 뜻 |
| --- | --- |
| `Google` | 클라이언트 ID가 아직 없음 · 배지를 누르면 설정이 열림 |
| `Google 로그인` | 로그인이 필요하거나 만료됨 · 배지를 누르면 바로 로그인 |
| `⇅ 동기화 중` | 시트와 주고받는 중 |
| `⇅ 시트` | 연결됨 · 배지를 누르면 새로고침 |
| `⇅ 확인` | 연결 문제 · 설정 화면 상태 줄에 이유가 나옴 |

### 1-4. 동기화 방식 (Google Sheets API v4)

| 시점 | 요청 |
| --- | --- |
| 앱 열기 / `새로고침` / 탭 다시 보기(1분 경과) | `GET /values:batchGet` — `entries!A1:H1·A2:H`, `budgets!A1:B1·A2:B`, `assets!A1:H1·A2:H`, `wedding!A1:I1·A2:I` (`UNFORMATTED_VALUE`) |
| 시트에 없는 로컬 기록 | `POST /values/{탭}!A:H(또는 A:I):append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS` |
| 기록·자산·결혼 항목 수정 | `GET {탭}!A2:A`로 id의 행을 찾고 → `PUT /values/{탭}!A{row}:H(또는 I){row}` |
| 삭제 | 행을 찾고 → `POST /v4/spreadsheets/{ID}:batchUpdate` (`deleteDimension`) |
| 예산 저장 | `budgets!A2:B`에서 키 행을 찾아 `PUT`, 없으면 `append` (키 = `YYYY-MM` 또는 `YYYY-MM::카테고리` 또는 `asset_snap::YYYY-MM`) |
| 예산 해제 | 해당 키 행을 `deleteDimension`으로 삭제 |

- 앱을 열면 시트를 먼저 읽어 로컬과 병합하고, **시트에 없는 로컬 데이터는 자동으로 시트에 올립니다.**
- 오프라인이거나 실패한 변경은 `localStorage` 큐에 쌓였다가 15초 간격·재접속·다음 로그인 때 순서대로 올라갑니다.
- 액세스 토큰이 만료돼 `401`이 오면 조용히 토큰을 지우고 배지를 `Google 로그인`으로 바꿉니다.

### 1-5. 보안 · 접근 범위

- 요청 스코프는 `https://www.googleapis.com/auth/spreadsheets` **하나뿐**입니다(스프레드시트 읽기·쓰기).
- 로그인한 Google 계정이 **열 수 있는 스프레드시트만** 읽고 쓸 수 있습니다.
- 액세스 토큰은 이 브라우저의 `localStorage`(`household_book_oauth_token_v1`)에 만료 시각과 함께 약 1시간만 보관되고, `로그아웃`하면 즉시 지웁니다.
- 무인증 공개 URL이 없으므로, 링크를 아는 사람이 시트에 접근할 수는 없습니다.

> `apps-script/Code.gs`는 **보관(미사용)** 입니다. 다시 배포하지 마세요.

---

## 2. 다른 AI·도구를 위한 데이터 규격

### 2-1. Google Sheets 컬럼 (머리글 이름 기준으로 읽고 씀, 열 순서는 바뀌어도 됨)

**`entries` 탭** (가계부 기록)

| 열 | 이름 | 형식 | 예 |
| --- | --- | --- | --- |
| A | `id` | 문자열 고유값 | `bs_cb00a138d4d3` |
| B | `date` | `YYYY-MM-DD` (**문자**) | `2026-11-14` |
| C | `type` | `expense` \| `income` \| `transfer`(내부이동: 계좌이체·카드대금·저축 — 수입·지출 합계에서 제외) | `expense` |
| D | `amount` | 원 단위 정수 (양수) | `23500` |
| E | `category` | 허용 카테고리 (아래) | `식비` |
| F | `method` | `카드` \| `체크카드` \| `현금` \| `이체` (기존 기록의 `카드`는 그대로 유효, 모르는 값은 `카드`로 읽음) | `카드` |
| G | `memo` | 자유 문자열 | `한신우동당산점` |
| H | `createdAt` | 밀리초 타임스탬프(숫자) | `1794582000000` |

**`budgets` 탭** (월 예산 + 카테고리 예산 + 자산 스냅샷)

| 열 | 이름 | 형식 | 예 |
| --- | --- | --- | --- |
| A | `month` | 키 (**문자**): `YYYY-MM`(월 전체) · `YYYY-MM::카테고리`(카테고리별) · `asset_snap::YYYY-MM`(순자산 스냅샷) | `2026-11` · `2026-11::식비` · `asset_snap::2026-11` |
| B | `amount` | 원 단위 정수 | `1200000` |

**`assets` 탭** (계좌·종목)

| 열 | 이름 | 형식 | 예 |
| --- | --- | --- | --- |
| A | `id` | 문자열 고유값 | `as_01` |
| B | `kind` | `cash`(입출금·파킹) \| `saving`(적금·청약) \| `pension`(연금) \| `kr_stock`(국내주식) \| `us_stock`(해외주식) \| `etc` \| `debt`(대출·부채) — 과거 `invest`는 `us_stock`로 읽음 | `us_stock` |
| C | `name` | 계좌명·종목명 | `INVESCO QQQ TRUST` |
| D | `principal` | 매입금액(원 단위 정수) | `32878966` |
| E | `current` | 잔액·평가금액(원 단위 정수, 부채는 잔액) | `46306954` |
| F | `dividend` | 배당금(연, 원 단위 정수, 선택) | `0` |
| G | `memo` | 금융사 등 | `미래에셋증권` |
| H | `updatedAt` | 밀리초 타임스탬프(숫자) | `1794836460000` |

**`wedding` 탭** (결혼 예산)

| 열 | 이름 | 형식 | 예 |
| --- | --- | --- | --- |
| A | `id` | 문자열 고유값 | `wd_01` |
| B | `category` | `웨딩홀` · `스드메` · `예물·예단` · `신혼여행` · `신혼집·혼수` (기본 5분류) 또는 직접 입력한 분류 | `스드메` |
| C | `item` | 항목명 | `스드메 중도금` |
| D | `budget` | 예산액(원 단위 정수) | `1590000` |
| E | `spent` | 실지출·결제액(원 단위 정수) | `0` |
| F | `dueDate` | `YYYY-MM-DD` (**문자**, 선택) | `2026-11-19` |
| G | `status` | `예정` \| `계약확정` \| `납부완료` (과거 값 `계약금`·`중도금`은 `계약확정`, `완납`은 `납부완료`로 읽음) | `예정` |
| H | `memo` | 자유 문자열 | `2026-11-19 납부 기한` |
| I | `updatedAt` | 밀리초 타임스탬프(숫자) | `1794836460000` |

- 모든 탭의 첫 행은 머리글, 2행부터 데이터입니다. 빈 줄은 무시됩니다.
- `amount`·`principal`·`current`·`budget`·`spent` 열은 **숫자**입니다(콤마 표시는 화면만). 앱은 `UNFORMATTED_VALUE`로 읽어 콤마가 섞여 와도 숫자만 남겨 읽습니다.
- `date`·`dueDate`·`month` 열은 문자 서식으로 두어 날짜 값으로 바뀌지 않게 했습니다.
- `id`가 같으면 같은 항목입니다. 새 항목은 겹치지 않는 id로 넣으세요.

### 2-2. JSON 내보내기 / 가져오기 스키마

```json
{
  "app": "나의 가계부",
  "version": 2,
  "exportedAt": "2026-11-16T22:40:00.000Z",
  "budgets": { "2026-11": 1200000, "2026-11::식비": 400000, "asset_snap::2026-11": 127267789 },
  "entries": [
    { "id": "bs_cb00a138d4d3", "date": "2026-11-14", "type": "expense", "amount": 23500,
      "category": "식비", "method": "카드", "memo": "한신우동당산점", "createdAt": 1794582000000 }
  ],
  "assets": [
    { "id": "as_01", "kind": "us_stock", "name": "INVESCO QQQ TRUST",
      "principal": 32878966, "current": 46306954, "dividend": 0, "memo": "미래에셋증권", "updatedAt": 1794836460000 }
  ],
  "wedding": [
    { "id": "wd_01", "category": "스드메", "item": "스드메 계약금", "budget": 200000, "spent": 200000,
      "dueDate": "2026-08-31", "status": "납부완료", "memo": "", "updatedAt": 1794836460000 }
  ],
  "fixedCats": ["주거/통신"]
}
```

- 가져오기는 **id가 이미 있으면 건너뛰고 없는 것만 추가**합니다(덮어쓰지 않음). `fixedCats`도 함께 복원합니다.
- 읽을 때 조건에 맞지 않는 행은 버려집니다: `amount`는 1 이상 정수, `date`는 `YYYY-MM-DD`, `category`가 목록에 없으면 `기타`, 자산 `kind`가 목록에 없으면 `etc`.

### 2-3. 허용 카테고리 (앱 기준)

- 지출: `식비`, `카페/간식`, `교통`, `쇼핑`, `주거/통신`, `의료/건강`, `여가/문화`, `교육`, `경조사/선물`, `기타`
- 수입: `급여`, `부수입`, `이자/수익`, `용돈`, `기타`
- 내부이동(`transfer`): `계좌이체`, `카드대금`, `저축·적립`, `현금인출`, `기타`

### 2-4. 브라우저 localStorage 키

| 키 | 내용 |
| --- | --- |
| `household_book_v1` | 기록·예산·자산·결혼 (`{app, version, savedAt, entries, budgets, assets, wedding}`) |
| `household_book_ui_v1` | 마지막 탭·가계부 보기 상태 |
| `household_book_fixed_cats_v1` | 고정비로 셀 카테고리 목록 |
| `household_book_cards_v1` | 카드별 실적 설정 — `[{ "name": "우리 K-패스", "target": 300000 }]` (없으면 기본 카드 4개) |
| `household_book_oauth_client_id_v1` | 입력한 Google OAuth 클라이언트 ID |
| `household_book_sheet_id_v1` | 입력한 스프레드시트 ID |
| `household_book_oauth_token_v1` | 액세스 토큰 + 만료 시각 (약 1시간) |
| `household_book_sync_queue_v1` | 아직 시트에 못 올린 변경 큐 |

---

## 3. 파일 구성

```
index.html                  앱 본체 (단일 파일, localStorage + Google OAuth·Sheets API v4, 4탭)
manifest.webmanifest        PWA 설정 (name/short_name/icons/theme_color)
sw.js                       오프라인 캐시 — **캐시 변수 `CACHE`** (현재 `budget-app-v16`)
apps-script/Code.gs         (보관·미사용) 구버전 Apps Script 웹 앱 — 참고용 기록
icon-192.png · icon-512.png · icon-maskable-512.png · apple-touch-icon.png · favicon-32.png   앱 아이콘
```

GitHub Pages로 배포됩니다: <https://eblovekk-blip.github.io/bina/>

---

## 4. 수정할 때 꼭 지킬 것 (다른 AI·도구 포함)

1. **작업 전 항상 최신 코드부터**: `cd work/budget-pages && git pull origin main` — 여러 AI가 동시에 만질 수 있으므로, pull 없이 편집하면 이전 작업이 덮여 사라집니다. 푸시 전에도 다시 `git pull --rebase`로 충돌을 확인하세요.
2. **`sw.js`의 `CACHE` 버전 올리기**: `index.html`을 고쳤으면 `var CACHE = 'budget-app-vNN';`의 숫자를 반드시 올립니다(예: v11 → v12). 올리지 않으면 사용자의 폰(웨일·크롬)이 예전 캐시를 계속 보여 줍니다.
3. **`notranslate` 유지**: `<html translate="no">`, `<meta name="google" content="notranslate">`, `<meta http-equiv="Content-Language" content="ko">`, `<body class="notranslate">`. 지우면 크롬/웨일이 '페이지를 번역하겠습니까?' 팝업을 다시 띄웁니다.
4. **모바일 가로 넘침 금지**: `html, body { overflow-x: clip }` 유지, flex/grid 자식에 `min-width:0`, 긴 종목명은 `overflow:hidden; text-overflow:ellipsis`, 하단 탭바는 `position:fixed; left:0; right:0` + `.tabbar-inner { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)) }`. 360px에서 `document.documentElement.scrollWidth`가 360을 넘으면 안 됩니다.
5. **시트 스키마는 머리글 이름 기준**: 열 순서를 바꿔도 앱은 머리글로 찾습니다. 다만 이름(`id`, `date`, `kind` …)은 바꾸지 마세요. `entries`·`budgets` 탭은 기존 사용자 기록이므로 함부로 지우지 않습니다.
6. **검증 뒤 배포**: `git push origin HEAD:main` → GitHub Actions의 Pages 빌드가 `built`가 되는지 확인(`gh api repos/eblovekk-blip/bina/pages/builds/latest`)한 뒤 라이브에서 확인합니다.
7. **검증용 테스트 데이터는 실제 시트에 넣지 않기**: 브라우저 `localStorage`에만 넣고, 확인 후 지웁니다.
