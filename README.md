# Face Studio

얼굴 편집과 이미지 생성을 한 화면에서 다루는 개인용 웹앱.
서버 없이 브라우저에서 fal.ai를 직접 호출한다. 한글 프롬프트는 Gemini로 영어로 옮긴 뒤 보낸다.

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
한글 입력 → Gemini 2.5 Flash 로 영어 변환 (무료)
         → 프롬프트 레이어에서 화질·구도·보존 지시 덧붙임
         → fal.ai 선택 모델 호출 (유료)
         → 결과 data URI
```

영어로 입력하면 변환 단계를 건너뛴다. Gemini 키가 없으면 한국어를 그대로 보내고 그 사실을 알린다.

## 비용

**이미지 생성은 유료다.** fal.ai는 선불 크레딧을 충전해 쓰는 pay-per-use 방식이다.
모델마다 단가가 다르니 [fal.ai/pricing](https://fal.ai/pricing) 에서 확인한다.

한글→영어 변환에 쓰는 `gemini-2.5-flash` 는 무료 티어로 처리돼 비용이 붙지 않는다.

> Gemini API의 이미지 생성 모델(Nano Banana, Imagen, Veo)은 Free Tier가 "Not available" 이다.
> 그래서 이미지 쪽을 fal.ai로 옮겼다. Nano Banana 자체는 fal 경유로 계속 쓸 수 있다.

## API 키

키는 두 개다. 앱에서 아무 모드나 열고 **우측 상단 열쇠 버튼** 을 누르면 입력칸이 나온다.
저장 버튼은 없다. 입력하는 즉시 저장된다.

| 키 | 용도 | 필수 | 발급 |
|---|---|---|---|
| fal.ai | 이미지 생성·편집 | **필수** | [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys) |
| Google AI Studio | 한글→영어 변환 | 선택 | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

fal 키는 크레딧을 충전해야 호출된다. Gemini 키는 없어도 동작하지만 한국어 프롬프트 품질이 떨어진다.

두 키 모두 이 브라우저의 `localStorage`에만 저장된다
(`face-studio:fal-api-key`, `face-studio:gemini-api-key`).
소스, 커밋, 빌드 결과 어디에도 들어가지 않는다. 공용 PC에서는 키 패널의 휴지통 버튼으로 지우고 나온다.

> 키를 환경변수(`VITE_*`)로 넣지 말 것. Vite는 그 값을 빌드 결과에 그대로 박아넣기 때문에
> 빌드물을 공개 배포하면 키가 노출된다. 그래서 이 앱은 화면에서만 키를 받는다.
>
> fal 공식 문서는 브라우저에 `FAL_KEY` 노출을 금지하고 프록시를 권한다. 공개 서비스 기준의 경고이고,
> 이 앱은 키가 본인 브라우저에만 있는 개인용이다. 다만 fal 키는 충전한 크레딧에 직접 접근하는
> 자격증명이므로 소액만 충전해두는 편이 안전하다.

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
│  ├─ gemini.ts          한글→영어 변환 전용
│  ├─ run.ts             세 모드 공용 실행 흐름
│  ├─ image.ts           업로드 검사(jpg/png/webp, 10MB), data URL 변환
│  └─ keyStore.ts        API 키 두 개 저장
├─ components/           Card, ImageDrop, Chip, ModelPicker, ResultPanel 등
└─ screens/              Home, SingleSwap, MultiSwap, ImageGen

public/
├─ manifest.webmanifest  홈 화면 설치 정보
├─ sw.js                 앱 껍데기 캐시. API 호출은 건드리지 않는다
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
