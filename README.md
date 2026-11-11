# 나의 AI 면접 트레이너

TXT 기술서를 기반으로 3급 승진면접을 연습하는 개인용 웹앱입니다.

## 구성 파일
- `index.html`: GitHub Pages에 배포할 프론트엔드
- `worker.js`: Cloudflare Worker 백엔드
- `wrangler.toml`: Worker 배포 설정 예시

## 1. GitHub Pages 배포
1. GitHub에서 새 저장소를 만듭니다. 예: `interview-trainer`
2. `index.html`을 저장소 최상위(main)에 업로드합니다.
3. Settings → Pages → Deploy from a branch → `main` / `/(root)` 선택 후 저장합니다.
4. 표시되는 Pages 주소로 접속합니다.

## 2. Cloudflare Worker 배포 (AI 기능에 필요)
API 키를 HTML/JavaScript에 넣지 마세요.

1. Cloudflare 계정에서 Workers & Pages → Create → Worker를 선택합니다.
2. `worker.js` 내용을 Worker 코드 편집기에 붙여넣고 Deploy 합니다.
3. Worker 설정의 Variables and Secrets에서 `OPENAI_API_KEY`를 Secret으로 추가합니다.
4. 필요하면 `MODEL` 환경변수에 계정에서 사용 가능한 모델명을 지정합니다. 기본값은 `gpt-4o-mini`입니다.
5. Worker Settings → Triggers / Domains에서 `workers.dev` 주소를 확인합니다.
6. GitHub Pages 앱의 AI 연결 설정에 Worker 주소를 붙여넣고 저장합니다.

또는 Wrangler CLI:
```bash
npm install -g wrangler
wrangler login
wrangler deploy
npx wrangler secret put OPENAI_API_KEY
```
`wrangler.toml`의 `name`을 고유한 Worker 이름으로 바꿔 사용하세요.

## 3. 사용법
1. TXT 파일을 업로드하거나 기술서를 직접 붙여넣습니다.
2. 면접 방식과 질문 강도를 선택합니다.
3. 새 면접 시작을 누릅니다.
4. AI 전송 미리보기를 확인하고 동의할 때만 확인을 누릅니다.
5. 답변을 텍스트로 입력하거나 음성 입력을 사용합니다.
6. 답변 제출 후 평가를 확인하고 다음 질문으로 진행합니다.

## 개인정보 및 보안
- 기술서, Worker 주소, 면접 기록은 브라우저 localStorage에 저장됩니다.
- AI 요청 시 기술서/답변이 Worker를 거쳐 OpenAI API로 전송됩니다. 전송 전에 브라우저에서 확인창을 띄웁니다.
- Worker Secret은 브라우저에 노출되지 않습니다.
- 현재 Worker는 예시용 CORS `*`를 사용합니다. 개인 테스트 후에는 실제 GitHub Pages 도메인으로 제한하고, 인증/요청 제한(rate limit)을 추가하는 것을 권장합니다.
- Worker URL은 비밀번호가 아닙니다. URL을 아는 누구나 호출할 수 있으므로 공개 배포 전 인증을 추가하세요.
- 실제 직장 내부자료, 개인정보, 비공개 수치 등은 외부 AI 전송 전 반드시 삭제하거나 익명화하세요.
- 브라우저 로컬 저장소는 같은 브라우저/기기에서만 공유됩니다. 사이트 데이터 삭제 시 사라질 수 있습니다.

## 현재 프로토타입의 범위와 한계
- TXT 및 붙여넣기 지원. PDF/DOCX는 지원하지 않습니다.
- 음성 입력은 브라우저의 SpeechRecognition 지원 여부에 따라 달라지며, iOS Safari에서는 제한될 수 있습니다.
- 음성 입력 결과는 답변 칸에 들어가며 제출 전 직접 수정할 수 있습니다.
- 이 버전은 답변 평가 후 다음 질문을 한 번에 생성합니다. 답변을 이어가며 추가 꼬리 질문을 만드는 구조입니다.
- AI 사용에는 별도 API 계정 및 비용이 발생할 수 있습니다.
