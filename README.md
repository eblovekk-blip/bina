# 나의 가계부 (bina)

휴대폰 웹 링크로 바로 열고, 홈 화면에 추가해서 앱처럼 쓰는 가계부입니다.

- **라이브 앱**: <https://eblovekk-blip.github.io/bina/>
- **디자인**: 블랙 & 네온 라임 다크 테마 (배경 `#0A0A0C`, 카드 `#14151A`, 액센트 `#CCFF00`, 수입 `#00E5A3`, 지출 `#FF4D6D`) — PWA `theme_color`/`background_color`도 `#0A0A0C`
- 기록은 기본적으로 이 브라우저(localStorage)에 저장됩니다.
- 구글 시트(Apps Script 웹 앱)를 연결하면 **시트와 실시간 양방향 동기화**됩니다.
- 기록 이동·백업은 앱의 'JSON으로 내보내기 / 불러오기'를 쓰세요.
- 홈 화면 추가: iPhone은 Safari 공유 → '홈 화면에 추가', Android는 Chrome 메뉴(⋮) → '홈 화면에 추가'.

---

## 1. 구글 시트 연동 (한 번만 설정)

### 시트
- 스프레드시트: **이은빈 가계부 (bina)**
- URL: <https://docs.google.com/spreadsheets/d/18IFbYx1RO857pWrbkCj55bzyf2vREPz4QOuO_QN84og/edit>
- ID: `18IFbYx1RO857pWrbkCj55bzyf2vREPz4QOuO_QN84og`
- 탭 2개: `entries`(가계부 기록), `budgets`(월 예산)

### Apps Script 웹 앱 배포 3단계
1. 가계부 스프레드시트에서 **확장 프로그램 → Apps Script**를 엽니다.
2. 기본 `Code.gs` 내용을 모두 지우고 이 저장소의 [`apps-script/Code.gs`](./apps-script/Code.gs) **전체를 붙여넣은 뒤 저장**(Ctrl/⌘+S)합니다.
3. **배포 → 새 배포 → 유형 '웹 앱'**
   - 다음 사용자로 실행: **나**
   - 액세스 권한: **모든 사용자**
   - → 배포 → 권한 승인 → 나오는 **웹 앱 URL**(`https://script.google.com/macros/s/…/exec`)을 복사합니다.

복사한 URL을 가계부 앱 **설정(⚙) → 구글 시트 연동** 칸에 붙여넣고 **[연결 및 동기화]**를 누르면 끝입니다.

- 코드를 고친 뒤에는 **배포 → 배포 관리 → ✏️ → 버전 '새 버전' → 배포**로 다시 배포해야 반영됩니다. (URL은 그대로)
- 앱 상단의 `⇅ 시트` 배지는 연동 상태를 보여 줍니다. 문제가 있으면 설정 화면 상태 줄에 이유가 나옵니다.

### 동기화 방식
| 시점 | 동작 |
| --- | --- |
| 앱 열기 / '새로고침' / 탭 다시 보기 | `GET ?action=list` 로 시트의 `entries`·`budgets`를 받아 로컬과 병합 (시트에 없는 로컬 기록은 자동 업로드) |
| 기록 추가·수정 | `POST {action:"upsertEntry"}` |
| 기록 삭제 | `POST {action:"deleteEntry"}` |
| 예산 저장·해제 | `POST {action:"setBudget"}` (0 이하 = 예산 없음) |
| JSON 가져오기 | `POST {action:"bulkSync"}` |

- POST는 `Content-Type: text/plain` 으로 보내 CORS preflight를 피하고, Apps Script `doPost(e)` 에서 `JSON.parse(e.postData.contents)` 로 읽습니다.
- 오프라인이거나 실패한 변경은 브라우저에 큐로 쌓였다가 다시 연결되면 순서대로 올라갑니다.
- URL을 비우면 연동 없이 기존처럼 로컬 저장만 사용합니다.

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
- `date`·`month` 열은 문자 서식으로 두어 `2026-11-14` 가 날짜 값으로 바뀌지 않게 했습니다.
- `id` 가 같으면 같은 기록입니다. 새 기록을 넣을 때는 겹치지 않는 id를 쓰세요.

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

### 2-4. Apps Script API

| 요청 | 본문 | 응답 |
| --- | --- | --- |
| `GET …?action=list` | – | `{ ok:true, entries:[…], budgets:{…}, count, updatedAt }` |
| `POST` | `{ "action":"upsertEntry", "entry":{…} }` | `{ ok:true, written, mode, id }` |
| `POST` | `{ "action":"upsertEntries", "entries":[…] }` | `{ ok:true, added, updated }` |
| `POST` | `{ "action":"deleteEntry", "id":"…" }` | `{ ok:true, deleted }` |
| `POST` | `{ "action":"setBudget", "month":"2026-11", "amount":1200000 }` | `{ ok:true, month, amount, mode }` |
| `POST` | `{ "action":"bulkSync", "entries":[…], "budgets":{…} }` | `{ ok:true, added, updated, budgets }` |

실패는 `{ ok:false, error:"…" }` 로 돌아옵니다.

---

## 3. 파일 구성

```
index.html                  앱 본체 (단일 파일, localStorage + 시트 동기화)
manifest.webmanifest        PWA 설정
sw.js                       오프라인 캐시
apps-script/Code.gs         구글 시트 동기화용 Apps Script (시트에 붙여넣고 배포)
icon-*.png, favicon-32.png, apple-touch-icon.png   앱 아이콘 (블랙 타일 + 라임 바 차트)
```

GitHub Pages로 배포됩니다: <https://eblovekk-blip.github.io/bina/>
