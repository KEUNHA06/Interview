// Cloudflare Worker: AI API key는 Worker Secret에만 저장합니다.
// Deploy: wrangler deploy
// Secret: npx wrangler secret put OPENAI_API_KEY
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
const json = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers: {...cors, "Content-Type":"application/json; charset=utf-8"}
});
const system = `당신은 한국 공공기관 3급 승진면접 전문 면접관이자 코치다.
반드시 사용자가 제공한 기술서의 사실만 근거로 질문하고 평가한다. 기술서에 없는 실적, 수치, 역할, 성과를 만들어내지 않는다.
사용자의 답변에서 실제 경험과 근거를 끌어내며, 모호하면 구체적 사례·본인 역할·판단 근거·결과를 묻는다.
질문 관점: 기술서 집중 탐구와 3급 관리자 역량(조직관리, 소통·조정, 의사결정, 구성원 성장, 업무체계화, 성과관리)을 연결한다.
한 번에 질문은 하나만 한다. 한국어로 간결하고 실제 면접관처럼 질문한다.
출력은 요청된 JSON 형식만 반환한다.`;
async function callAI(env, messages, schemaHint) {
  if (!env.OPENAI_API_KEY) throw new Error("Worker에 OPENAI_API_KEY Secret이 설정되지 않았습니다.");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{"Authorization":`Bearer ${env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      model: env.MODEL || "gpt-4o-mini",
      temperature:0.7,
      response_format:{type:"json_object"},
      messages:[{role:"system",content:system+"\n"+schemaHint},...messages]
    })
  });
  const data=await r.json();
  if(!r.ok) throw new Error(data.error?.message || `AI API 오류 ${r.status}`);
  const content=data.choices?.[0]?.message?.content;
  if(!content) throw new Error("AI 응답이 비어 있습니다.");
  return JSON.parse(content);
}
export default {
 async fetch(request, env) {
  if(request.method==="OPTIONS") return new Response(null,{headers:cors});
  if(request.method!=="POST") return json({error:"POST 요청만 지원합니다."},405);
  try {
   const body=await request.json();
   if(body.action==="health") return json({message:"보안 서버 연결 성공"});
   if(body.action==="start"){
    const doc=String(body.document||"").slice(0,18000);
    if(doc.length<40) return json({error:"기술서가 너무 짧습니다."},400);
    const result=await callAI(env,[{role:"user",content:
`다음 기술서를 분석해 첫 면접 질문 하나를 생성하라.
질문 모드: ${body.mode||"combined"}
질문 강도: ${body.difficulty||"normal"}
기술서:
${doc}
JSON 형식: {"question":"질문 하나","focus":"질문 의도"}`}],
`JSON schema keys: question(string), focus(string).`);
    return json({question:result.question,focus:result.focus});
   }
   if(body.action==="evaluate"){
    const doc=String(body.document||"").slice(0,18000);
    const question=String(body.question||"").slice(0,3000);
    const answer=String(body.answer||"").slice(0,6000);
    const result=await callAI(env,[{role:"user",content:
`기술서:
${doc}
면접 질문:
${question}
지원자 답변:
${answer}
질문 모드: ${body.mode||"combined"}
질문 강도: ${body.difficulty||"normal"}
답변을 평가하고, 다음에 이어질 질문 하나를 생성하라. 답변에 없는 사실을 보충해 만들지 말고, 모범답안은 사용자의 실제 경험을 바탕으로 구성 방향만 제시하라.
점수는 각 1~5점이며 점수 근거를 피드백에 반영하라.
JSON 형식:
{"feedback":{"summary":"총평","strengths":["강점"],"improvements":["보완점"],"sampleAnswer":"실제 사실을 추가하지 않는 답변 구성 제안","scores":{"factuality":1,"ownership":1,"logic":1,"leadership":1,"persuasiveness":1,"clarity":1}},"nextQuestion":"다음 질문 하나"}`}],
`Return JSON with feedback object (summary, strengths array, improvements array, sampleAnswer, scores object with factuality, ownership, logic, leadership, persuasiveness, clarity integers 1-5) and nextQuestion string.`);
    return json(result);
   }
   return json({error:"지원하지 않는 요청입니다."},400);
  } catch(e) { return json({error:e.message||"서버 내부 오류"},500); }
 }
};