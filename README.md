# Face Studio

얼굴 편집과 이미지 생성을 한 화면에서 다루는 개인용 웹앱.
서버 없이 브라우저에서 fal.ai를 직접 호출한다.

**배포 주소 — https://msiris.github.io/fstudio/**

## 휴대폰에 설치하기

홈 화면에 설치하면 주소창 없이 앱처럼 뜬다.

**Android Chrome** — 위 주소를 열고 우측 상단 ⋮ → **앱 설치** (또는 홈 화면에 추가)
**iOS Safari** — 위 주소를 열고 공유 버튼 → **홈 화면에 추가**

설치 후 첫 실행 때 API 키를 한 번 넣어두면 계속 유지된다.
인터넷 없이도 화면은 뜨지만, 이미지 생성은 API 호출이라 연결이 필요하다.

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

## 동작 방식

```
입력 → 프롬프트 레이어에서 범위 잠금·화질·구도 지시를 덧붙임
     → fal.ai 선택 모델 호출
     → 결과 data URI
```

한글로 써도 된다. 프롬프트 레이어가 "이 지시는 한국어다"라고 모델에 알려준다.
영어로 쓰면 더 정확하게 나오는 경우가 많다.

## 비용

**이미지 생성은 유료다.** fal.ai는 선불 크레딧을 충전해 쓰는 pay-per-use 방식이다.
모델마다 단가가 다르니 [fal.ai/pricing](https://fal.ai/pricing) 에서 확인한다.

> Gemini API의 이미지 생성 모델(Nano Banana, Imagen, Veo)은 Free Tier가 "Not available" 이다.
> 그래서 이미지 쪽을 fal.ai로 옮겼다. Nano Banana 자체는 fal 경유로 계속 쓸 수 있다.

## API 키

**키는 하나다.** [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys) 에서
**ADMIN 스코프**로 발급한다. ADMIN은 API 스코프를 포함하므로 이 키 하나로
이미지 생성과 잔액 조회가 모두 된다.

홈 화면 **우측 상단 열쇠 버튼**을 누르면 입력칸이 나온다. 저장 버튼은 없고 입력하는 즉시 저장된다.
한 번 넣으면 세 모드가 모두 그 키를 쓴다. 모드 화면에는 키 입력이 없다.

키는 이 브라우저의 `localStorage`(`face-studio:fal-api-key`)에만 저장된다.
소스, 커밋, 빌드 결과 어디에도 들어가지 않는다. 공용 PC에서는 휴지통 버튼으로 지우고 나온다.

> 키를 환경변수(`VITE_*`)로 넣지 말 것. Vite는 그 값을 빌드 결과에 그대로 박아넣기 때문에
> 빌드물을 공개 배포하면 키가 노출된다. 그래서 이 앱은 화면에서만 키를 받는다.
>
> ADMIN 키는 배포와 앱 관리 권한까지 가진다. 그 권한을 브라우저에 두는 것이 이 앱의 전제다.
> 개인 기기에서만 쓰고, 크레딧은 소액만 충전해두는 편이 안전하다.

### 크레딧 잔액

홈 화면 우측 상단에 남은 크레딧이 숫자로 뜬다. 누르면 다시 조회한다.

```
GET https://api.fal.ai/v1/account/billing?expand=credits
Authorization: Key {FAL_KEY}
```

```json
{ "username": "my-team", "credits": { "current_balance": 24.5, "currency": "USD" } }
```

`current_balance` 가 남은 크레딧이고 단위는 달러다. 이 엔드포인트는 **ADMIN 스코프만 받는다.**
API 스코프 키로 부르면 401이 돌아오고, 그 사정을 키 패널에서 알려준다.

[`src/lib/falAccount.ts`](src/lib/falAccount.ts) 는 위 구조를 먼저 보고, 어긋나면
`balance` / `remaining` 같은 이름의 숫자를 찾아 들어간다. 그래도 못 찾으면 응답 원문을 펼쳐 보여준다.

업로드한 이미지와 생성 결과는 메모리에만 있다. 새로고침하면 사라진다.

## 모드

| 모드 | 보내는 것 | 성격 |
|---|---|---|
| Image Gen | 프롬프트 + 참조 이미지 0~3장 | 새로 생성 |
| Single Swap | 편집 지시 + 대상 사진 1장 + 참조 얼굴 0~1장 | 편집 |
| Multi Swap | 편집 지시 + 단체 사진 1장 + 참조 얼굴 0~4장 | 편집 |

### 모델 고르기

모드마다 화면에서 모델을 바꿀 수 있다. 첫 항목이 기본값이다.

| 모드 | 고를 수 있는 모델 |
|---|---|
| Image Gen | **Seedream 4** · Nano Banana · FLUX schnell |
| Single / Multi Swap | **Seedream 4 Edit** · Nano Banana Edit |

Image Gen에서 참조 이미지를 넣으면 Seedream과 Nano Banana는 편집 엔드포인트로 자동 전환된다.
FLUX schnell은 참조를 받지 않으며, 참조가 올라와 있으면 화면이 그 사실을 알린다.

모델 목록은 [`src/lib/falModels.ts`](src/lib/falModels.ts) 한 곳에 있다.
항목 하나를 추가하면 화면에 칩이 생긴다. 호출부는 손댈 필요가 없다.

편집 모드는 지시를 직접 입력한다. 프리셋 칩(포즈 · 배경 · 옷 · 스타일 · 표정 · 얼굴)을 누르면
입력란이 예문으로 채워지고, 이어서 고쳐 쓰면 된다.

**대상 사진과 편집 지시만 있으면 실행된다.** 참조 얼굴은 얼굴을 바꿀 때만 필요하다.

### 지시한 것만 변경

세 모드 모두 **지시한 것만 변경** 토글이 있고 기본값은 켜짐이다
(Image Gen은 참조 이미지를 넣었을 때만 나타난다).

켜면 프롬프트에 두 문단이 들어간다.

- `SCOPE_LOCK` — 작업의 성격을 국소 편집으로 못박고, **지시가 말하지 않은 것**을 전부 잠근다.
  얼굴·머리·체형·포즈·손 위치·언급 안 된 의상·소품·배경·조명·카메라 각도·구도·색감을 하나씩 센다.
  무엇을 바꿀지는 지시가 정하므로 어떤 지시와도 충돌하지 않는다.
  지시가 여러 개를 말하면 그 전부를 바꾸고, 그 이상은 건드리지 않는다
- `FACE_LOCK` — 얼굴은 가장 잘 망가지고 가장 먼저 눈에 띄어서 한 번 더 못박는다.
  단 "얼굴을 바꿔달라"는 지시는 예외라서 얼굴 교체 작업과 충돌하지 않는다

잠긴 상태에서는 화질 문구도 바뀐다. 일반 화질 수식어("자연스러운 조명")는 재조명을 유도해
잠금과 싸우므로, 원본의 입자·선명도·색감·조명에 맞추라는 문구(`QUALITY_MATCH`)로 교체한다.
비율 구도 힌트도 빠진다. 구도를 다시 잡으라고 하면 전체가 다시 그려진다.

토글을 끄면 모델이 전체를 다시 해석해도 되는 느슨한 문구로 내려간다.

### 안전 필터

모델이 결과를 막으면 앱이 그 사실과 모델이 보낸 텍스트를 그대로 보여준다.
우회를 위한 프롬프트 변형을 자동으로 시도하지 않는다.

## 구조

```
src/
├─ App.tsx               화면 전환, API 키 상태
├─ state.ts              모드별 입력 상태 (홈에 갔다 와도 유지)
├─ constants.ts          비율, 프리셋, 화면 제목
├─ lib/
│  ├─ prompt.ts          ★ 프롬프트 레이어. 결과 품질의 대부분이 여기서 결정된다
│  ├─ falModels.ts       ★ 모델 레지스트리. 모델을 추가하려면 여기만 고친다
│  ├─ fal.ts             callFal 단일 호출 함수, 오류 문구
│  ├─ falAccount.ts      크레딧 잔액 조회 (ADMIN 스코프 필요)
│  ├─ run.ts             세 모드 공용 실행 흐름
│  ├─ image.ts           업로드 검사(jpg/png/webp, 10MB), data URL 변환
│  └─ keyStore.ts        API 키 저장
├─ components/           Card, ImageDrop, Chip, ModelPicker, CreditBadge 등
├─ hooks/                useCredits — 잔액 조회 상태
└─ screens/              Home, SingleSwap, MultiSwap, ImageGen

public/
├─ manifest.webmanifest  홈 화면 설치 정보
├─ sw.js                 앱 껍데기 캐시. API 호출은 건드리지 않는다
└─ icon-*.png            scripts/make-icons.mjs 가 만든다
```

### 프롬프트 레이어

`src/lib/prompt.ts` 는 UI 코드와 섞지 않는다. 결과가 마음에 안 들면 이 파일만 본다.

- 한글이 섞여 있으면 "이 지시는 한국어다"라고 모델에 알린다
- 화질 수식어(조명·초점·디테일)를 기본으로 덧붙인다
- 비율이 Original이 아니면 구도 힌트를 넣는다
- 범위 잠금이 켜지면 `SCOPE_LOCK` + `FACE_LOCK` 문단을 넣는다. 뭉뚱그리면 모델이 알아서 해석하므로
  유지할 항목을 하나씩 센다. 짧게 "원본을 유지하라"고만 쓰면 미화를 유지의 범주로 본다
- 잠긴 상태에서는 화질 문구를 `QUALITY_MATCH`로 바꾸고 비율 힌트를 뺀다. 둘 다 재생성을 유도한다
- 참조 이미지가 붙고 범위 잠금이 켜지면, 생성 프롬프트도 "새로 만들라"가 아니라
  "첫 장을 바탕으로 고치라"로 성격이 바뀐다. 실제 호출도 편집 엔드포인트로 나가므로 방향을 맞춘다

결과 카드의 **"보낸 프롬프트 보기"** 를 열면 실제로 나간 문장을 확인할 수 있다.

### 모델 ID

[`src/lib/falModels.ts`](src/lib/falModels.ts) 안의 상수다. fal 엔드포인트 ID는 바뀔 수 있다.

```ts
const SEEDREAM_T2I  = 'fal-ai/bytedance/seedream/v4/text-to-image';
const SEEDREAM_EDIT = 'fal-ai/bytedance/seedream/v4/edit';
const NANO_T2I      = 'fal-ai/nano-banana';
const NANO_EDIT     = 'fal-ai/nano-banana/edit';
const FLUX_SCHNELL  = 'fal-ai/flux/schnell';
```

404가 나면 ID를, 422가 나면 `resolve`의 입력 스키마를 모델 페이지와 맞춘다.
앱이 어느 엔드포인트를 불렀는지 오류 문구에 찍어준다.

## 오류 처리

- 타임아웃 60초
- 401·402(크레딧 부족)·404(모델 ID)·422(스키마)·429를 각각 구분해 안내한다
- 모든 오류에 fal이 보낸 원문을 함께 보여준다. 원인은 대개 원문에만 있다
- 실패해도 입력한 프롬프트와 이미지는 지우지 않는다

## 기술 스택

Vite · React · TypeScript · Tailwind CSS · lucide-react. 상태는 `useState` 만 쓴다. 서버 없음.

## 개인용

인증, 결제, 호출 제한, 약관은 없다. 혼자 쓰는 것을 전제로 만들었다.
