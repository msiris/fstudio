# Face Studio

얼굴 편집과 이미지 생성을 한 화면에서 다루는 개인용 웹앱.
세 모드 모두 Google Gemini 무료 티어로 동작하며, 서버 없이 브라우저에서 API를 직접 호출한다.

**배포 주소 — https://msiris.github.io/fstudio/**

## 휴대폰에 설치하기

홈 화면에 설치하면 주소창 없이 앱처럼 뜬다.

**Android Chrome** — 위 주소를 열고 우측 상단 ⋮ → **앱 설치** (또는 홈 화면에 추가)
**iOS Safari** — 위 주소를 열고 공유 버튼 → **홈 화면에 추가**

설치 후 첫 실행 때 API 키를 한 번 넣어두면 계속 유지된다.
인터넷 없이도 화면은 뜨지만, 이미지 생성은 Gemini 호출이라 연결이 필요하다.

## 실행

```bash
npm install
npm run dev
```

`http://localhost:5173/fstudio/` 에서 열린다.
경로에 `/fstudio/` 가 붙는 것은 GitHub Pages 프로젝트 페이지 주소와 맞추기 위해서다
(`vite.config.ts` 의 `base`).

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입 검사 후 `dist/` 로 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run icons` | 앱 아이콘 PNG 재생성 |

## 배포

`main` 에 푸시하면 GitHub Actions가 빌드해서 GitHub Pages로 올린다
(`.github/workflows/deploy.yml`). 별도로 할 일은 없다.

## API 키

1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey) 에서 무료 발급 (`AIza...` 로 시작)
2. 앱에서 아무 모드나 열고 **우측 상단 열쇠 버튼** 클릭
3. 입력칸에 붙여넣기 — 저장 버튼은 없다. 입력하는 즉시 저장된다

키는 이 브라우저의 `localStorage`(`face-studio:gemini-api-key`)에만 저장된다.
소스, 커밋, 빌드 결과 어디에도 들어가지 않는다. 공용 PC에서는 키 패널의 휴지통 버튼으로 지우고 나온다.

> 키를 환경변수(`VITE_*`)로 넣지 말 것. Vite는 그 값을 빌드 결과에 그대로 박아넣기 때문에
> 빌드물을 공개 배포하면 키가 노출된다. 그래서 이 앱은 화면에서만 키를 받는다.

업로드한 이미지와 생성 결과는 메모리에만 있다. 새로고침하면 사라진다.

## 모드

| 모드 | 보내는 것 | 성격 |
|---|---|---|
| Image Gen | 프롬프트 + 참조 이미지 0~3장 | 새로 생성 |
| Single Swap | 편집 지시 + 대상 사진 1장 + 참조 얼굴 0~1장 | 편집 |
| Multi Swap | 편집 지시 + 단체 사진 1장 + 참조 얼굴 0~4장 | 편집 |

세 모드 모두 같은 엔드포인트를 호출한다. 차이는 프롬프트와 이미지 개수뿐이다.

편집 모드는 지시를 직접 입력한다. 프리셋 칩(포즈 · 배경 · 옷 · 스타일 · 표정 · 얼굴)을 누르면
입력란이 예문으로 채워지고, 이어서 고쳐 쓰면 된다.

**대상 사진과 편집 지시만 있으면 실행된다.** 참조 얼굴은 얼굴을 바꿀 때만 필요하다.

### 잘 되는 작업

Gemini가 안정적으로 처리하는 것은 대체로 한 인물의 사진을 수정하는 작업이다 —
포즈 변경, 배경 교체, 의상 색 변경, 스타일 변환, 표정 조정.

**두 사람의 얼굴을 바꾸는 작업은 성공률이 낮다.** 안전 정책으로 거부되는 경우가 많은데,
이 앱은 그것을 실패가 아니라 예상된 분기로 처리한다. 거부되면 사유와 함께
모델이 보낸 텍스트를 그대로 보여준다. 우회를 위한 프롬프트 변형을 자동으로 시도하지 않는다.

## 구조

```
src/
├─ App.tsx               화면 전환, API 키 상태
├─ state.ts              모드별 입력 상태 (홈에 갔다 와도 유지)
├─ constants.ts          비율, 프리셋, 화면 제목
├─ lib/
│  ├─ prompt.ts          ★ 프롬프트 레이어. 결과 품질의 대부분이 여기서 결정된다
│  ├─ gemini.ts          callGemini 단일 호출 함수, 거부 판별, 오류 문구
│  ├─ run.ts             세 모드 공용 실행 흐름
│  ├─ image.ts           업로드 검사(jpg/png/webp, 10MB), data URL 변환
│  └─ keyStore.ts        API 키 저장
├─ components/           Card, ImageDrop, Chip, Toggle, ResultPanel 등
└─ screens/              Home, SingleSwap, MultiSwap, ImageGen

public/
├─ manifest.webmanifest  홈 화면 설치 정보
├─ sw.js                 앱 껍데기 캐시. Gemini 호출은 건드리지 않는다
└─ icon-*.png            scripts/make-icons.mjs 가 만든다
```

### 프롬프트 레이어

`src/lib/prompt.ts` 는 UI 코드와 섞지 않는다. 결과가 마음에 안 들면 이 파일만 본다.

- 한글 입력은 `gemini-2.5-flash` 로 영어 변환한 뒤 보낸다. 변환 실패 시 원문으로 진행하고 그 사실을 알린다
- 화질 수식어(조명·초점·디테일)를 기본으로 덧붙인다
- 비율이 Original이 아니면 구도 힌트를 넣는다
- 편집에서는 보존 대상(얼굴·정체성·피부톤·헤어스타일·배경·조명)을 명시한다.
  이걸 빼면 얼굴이 다른 사람으로 바뀌어 나온다. 편집 계열에서 가장 흔한 실패 원인이다.
  단 "지시가 명시적으로 요구하지 않는 한" 이라는 단서를 달아 얼굴 교체 지시와 충돌하지 않게 했다

결과 카드의 **"보낸 프롬프트 보기"** 를 열면 실제로 나간 문장을 확인할 수 있다.

### 모델명

`src/lib/gemini.ts` 상단 상수. 자주 바뀐다.

```ts
export const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';
```

404가 나면 이 값부터 확인한다. 앱도 404일 때 "모델명을 확인하세요" 라고 안내한다.

## 오류 처리

- 타임아웃 60초
- 429는 "무료 한도 초과" 로 구분해 안내
- 실패해도 입력한 프롬프트와 이미지는 지우지 않는다

## 기술 스택

Vite · React · TypeScript · Tailwind CSS · lucide-react. 상태는 `useState` 만 쓴다. 서버 없음.

## 개인용

인증, 결제, 호출 제한, 약관은 없다. 혼자 쓰는 것을 전제로 만들었다.
