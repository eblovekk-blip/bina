# 나의 가계부 (bina)

휴대폰 웹 링크로 바로 열고, 홈 화면에 추가해서 앱처럼 쓰는 가계부입니다.

- **라이브 앱**: <https://eblovekk-blip.github.io/bina/>
- **디자인**: 소프트 화이트 & 올리브·테라코타 라이트 테마 (배경 `#FAFAFA`, 카드·모달 `#FFFFFF`, 입력창·칩 `#F2F2EF`, 보더 `#EAEAEA`, 액센트 딥 올리브 `#3D5A45`, 지출·강조 테라코타 `#C86D51`, 수입 `#2E7D5B`) — PWA `theme_color`/`background_color`도 `#FAFAFA`
- **글꼴**: Pretendard 가변 웹폰트(jsDelivr CDN) → 없으면 기기 기본 한글 산세리프로 대체
- **앱 아이콘**: 크림 타일 위 딥 올리브 아치 + 상승 라인 + 테라코타 코인(새싹) — 512/512 maskable/192/180/32 5종
- **저장 위치**: 이 브라우저(`localStorage`) + Google 로그인으로 연결한 Google 스프레드시트(양쪽 함께).
- **공식 연동 방식 (2026-11-16부터)**: **Google 로그인(OAuth 2.0 / Google Identity Services) + Google Sheets API v4 직접 호출**.
  무인증 Apps Script 웹 앱(`apps-script/Code.gs`) 방식은 폐기·보관 상태입니다 (아래 1-4 참고).
- 기록 이동·백업은 앱의 'JSON으로 내보내기 / 불러오기'를 쓰세요.
- 홈 화면 추가: iPhone은 Safari 공유 → '홈 화면에 추가', Android는 Chrome 메뉴(⋮) → '홈 화면에 추가'.

---

## 1. Google 계정 연동 (한 번만 설정)

### 1-1. 시트
- 스프레드시트: **이은빈 가계부 (bina)**
- URL: <https://docs.google.com/spreadsheets/d/18IFbYx1RO857pWrbkCj55bzyf2vREPz4QOuO_QN84og/edit>
- ID: `18IFbYx1RO857pWrbkCj55bzyf2vREPz4QOuO_QN84og`
- 탭 2개: `entries`(가계부 기록), `budgets`(월 예산)
- 앱 설정의 **스프레드시트 ID** 칸에 이 ID가 기본값으로 들어 있습니다. 다른 시트로 옮기면 그 ID로 바꾸면 됩니다.

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

- 다른 클라이언트 ID를 쓰려면 설정의 **Google Client ID** 칸에 바꿔 넣으면 그 값이 이 브라우저에서 우선합니다.
- 같은 클라이언트 ID의 **승인된 자바스크립트 원본**에는 `https://eblovekk-blip.github.io`, **테스트 사용자**에는 `eblovekk@gmail.com`이 들어 있어야 합니다.

| 상단 배지 | 뜻 |
| --- | --- |
| `Google` | 클라이언트 ID가 아직 없음 · 배지를 누르면 설정이 열림 |
| `Google 로그인` | 로그인이 필요하거나 만료됨 · 배지를 누르면 바로 로그인 |
| `⇅ 동기화 중` | 시트와 주고받는 중 |
| `⇅ 시트` | 연결됨 · 배지를 누르면 새로고침 |
| `⇅ 확인` | 연결 문제 · 설정 화면 상태 줄에 이유가 나옴 |

설정 화면의 상태 줄에는 `Google 연결됨 · 마지막 11/16 22:40`처럼 마지막 동기화 시각이 표시됩니다. 아직 못 올린 변경이 있으면 `· 대기 N건`이 붙습니다.

### 1-4. 동기화 방식 (Google Sheets API v4)

| 시점 | 요청 |
| --- | --- |
| 앱 열기 / `새로고침` / 탭 다시 보기(1분 경과) | `GET /v4/spreadsheets/{ID}/values:batchGet` — `entries!A1:H1`, `entries!A2:H`, `budgets!A1:B1`, `budgets!A2:B` (값은 `UNFORMATTED_VALUE`로 읽어 숫자·문자를 그대로 받음) |
| 시트에 없는 로컬 기록 | `POST /values/entries!A:H:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS` |
| 기록 추가 | 위 `append` (id가 이미 있으면 아래 수정으로 처리) |
| 기록 수정 | `GET entries!A2:A`로 id의 행을 찾고 → `PUT /values/entries!A{row}:H{row}?valueInputOption=USER_ENTERED` |
| 기록 삭제 | 행을 찾고 → `POST /v4/spreadsheets/{ID}:batchUpdate` (`deleteDimension`으로 그 행 삭제) |
| 예산 저장 | `budgets!A2:B`에서 `month` 행을 찾아 `PUT`, 없으면 `append` |
| 예산 해제 | 해당 `month` 행을 `deleteDimension`으로 삭제 |

- 앱을 열면 시트를 먼저 읽어 로컬과 병합하고, **시트에 없는 로컬 기록은 자동으로 시트에 올립니다.**
- 오프라인이거나 실패한 변경은 `localStorage` 큐에 쌓였다가 15초 간격·재접속·다음 로그인 때 순서대로 올라갑니다.
- 액세스 토큰이 만료돼 `401`이 오면 조용히 토큰을 지우고 배지를 `Google 로그인`으로 바꿉니다. 기록은 큐에 그대로 남고, 다시 로그인하면 이어서 올라갑니다.
- 로그아웃은 이 브라우저의 로그인 정보만 지웁니다(Google 토큰 폐기 포함). 시트 기록과 아직 못 올린 큐는 그대로 둡니다.

### 1-5. 보안 · 접근 범위

- 요청 스코프는 `https://www.googleapis.com/auth/spreadsheets` **하나뿐**입니다(스프레드시트 읽기·쓰기). 메일·드라이브 전체 권한은 요청하지 않습니다.
- 로그인한 Google 계정이 **열 수 있는 스프레드시트만** 읽고 쓸 수 있습니다. 앱에는 접근 비밀번호가 따로 없고, Google이 본인 인증과 권한을 확인합니다.
- 액세스 토큰은 이 브라우저의 `localStorage`(`household_book_oauth_token_v1`)에 만료 시각과 함께 약 1시간만 보관되고, `로그아웃`하면 즉시 지웁니다.
- 무인증 공개 URL이 없어졌으므로, 링크를 아는 사람이 시트에 접근할 수는 없습니다.
- 같은 시트를 다른 AI 비서·도구가 쓰려면 **그 도구의 Google 연결 계정에 이 스프레드시트를 공유**하거나 같은 계정(`eblovekk@gmail.com`)으로 연결하면 됩니다. 그 도구는 Google Sheets API/커넥터로 같은 `entries`·`budgets` 규격을 읽고 쓰면 됩니다.

> `apps-script/Code.gs`는 2026-11-16부터 **보관(미사용)** 입니다. '모든 사용자'에게 열리는 무인증 웹 앱이라 위 보안 요구를 만족하지 못해 폐기했습니다. 다시 배포하지 마세요.

---

## 2. 다른 AI·도구를 위한 데이터 규격

### 2-1. Google Sheets 컬럼 (머리글 이름 기준으로 읽고 씀, 열 순서는 바뀌어도 됨)

**`entries` 탭**

| 열 | 이름 | 형식 | 예 |
| --- | --- | --- | --- |
| A | `id` | 문자열 고유값 | `bs_cb00a138d4d3` |
| B | `date` | `YYYY-MM-DD` (**문자**) | `2026-11-14` |
| C | `type` | `expense` \| `income` | `expense` |
| D | `amount` | 원 단위 정수 (양수) | `23500` |
| E | `category` | 허용 카테고리 (아래) | `식비` |
| F | `method` | `카드` \| `현금` \| `이체` | `카드` |
| G | `memo` | 자유 문자열 (앱은 60자까지) | `한신우동당산점` |
| H | `createdAt` | 밀리초 타임스탬프(숫자) | `1794582000000` |

**`budgets` 탭**

| 열 | 이름 | 형식 | 예 |
| --- | --- | --- | --- |
| A | `month` | `YYYY-MM` (**문자**) | `2026-11` |
| B | `amount` | 원 단위 정수 | `1200000` |

- 첫 행은 머리글, 2행부터 데이터입니다. 빈 줄은 무시됩니다.
- `amount` 열은 **숫자**입니다(화면 표시만 천 단위 콤마). 다른 도구로 읽어 `23,500` 처럼 콤마가 보이면 콤마를 지우고 숫자로 다루세요. 앱은 `UNFORMATTED_VALUE`로 읽어 숫자를 그대로 받고, 혹시 콤마가 섞여 와도 숫자만 남겨 읽습니다.
- `date`·`month` 열은 문자 서식으로 두어 `2026-11-14` 가 날짜 값으로 바뀌지 않게 했습니다.
- `id` 가 같으면 같은 기록입니다. 새 기록을 넣을 때는 겹치지 않는 id를 쓰세요. id가 없는 행은 앱이 내용 기준의 임시 id로 읽습니다.
- 예산은 월당 한 행입니다. 0 이하이거나 비우면 '예산 없음'입니다.

### 2-2. JSON 내보내기 / 가져오기 스키마

```json
{
  "app": "나의 가계부",
  "version": 1,
  "exportedAt": "2026-11-16T21:26:00.000Z",
  "budgets": { "2026-11": 1200000 },
  "entries": [
    {
      "id": "bs_cb00a138d4d3",
      "date": "2026-11-14",
      "type": "expense",
      "amount": 23500,
      "category": "기타",
      "method": "카드",
      "memo": "한신우동당산점",
      "createdAt": 1794582000000
    }
  ]
}
```

- `entries` 배열만 있는 JSON, 또는 배열 자체(`[ {...}, {...} ]`)도 가져올 수 있습니다.
- 가져오기는 **id가 이미 있으면 건너뛰고 없는 것만 추가**합니다(덮어쓰지 않음).
- 읽을 때 `amount` 는 1 이상 정수, `date` 는 `YYYY-MM-DD` 여야 합니다. 조건에 맞지 않는 행은 버려집니다.
- `category` 가 허용 목록에 없으면 `기타`, `method` 가 목록에 없으면 `카드` 로 바뀝니다.

### 2-3. 허용 카테고리 (앱 기준)

- 지출: `식비`, `카페/간식`, `교통`, `쇼핑`, `주거/통신`, `의료/건강`, `여가/문화`, `교육`, `경조사/선물`, `기타`
- 수입: `급여`, `부수입`, `이자/수익`, `용돈`, `기타`

### 2-4. 브라우저 localStorage 키

| 키 | 내용 |
| --- | --- |
| `household_book_v1` | 기록·예산 (`{app, version, savedAt, entries, budgets}`) |
| `household_book_oauth_client_id_v1` | 입력한 Google OAuth 클라이언트 ID |
| `household_book_sheet_id_v1` | 입력한 스프레드시트 ID |
| `household_book_oauth_token_v1` | 액세스 토큰 + 만료 시각 (약 1시간) |
| `household_book_sync_queue_v1` | 아직 시트에 못 올린 변경 큐 |

---

## 3. 파일 구성

```
index.html                  앱 본체 (단일 파일, localStorage + Google OAuth·Sheets API v4)
manifest.webmanifest        PWA 설정
sw.js                       오프라인 캐시
apps-script/Code.gs         (보관·미사용) 구버전 Apps Script 웹 앱 — 참고용 기록
icon-*.png, favicon-32.png, apple-touch-icon.png   앱 아이콘 (크림 타일 + 올리브 아치·테라코타 코인)
```

GitHub Pages로 배포됩니다: <https://eblovekk-blip.github.io/bina/>
