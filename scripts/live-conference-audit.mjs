const base='https://www.iticket.info';
const eventId='e7000000-0000-4000-8000-000000000001';
const results=[];
let attendeeToken;
let speakerToken;
async function request(path,token,body,method){
  const response=await fetch(base+path,{method:method??(body?'POST':'GET'),headers:{...(token?{authorization:`Bearer ${token}`} :{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});
  let data;try{data=await response.json();}catch{data={};}
  return {status:response.status,data};
}
for(const credential of [{username:'Demo Attendee',eventCode:'DEMO2026',role:'attendee'},{username:'Lina Horizon',eventCode:'LINA2026',role:'speaker'},{username:'Omar Nova',eventCode:'OMAR2026',role:'speaker'}]){
 const login=await request('/api/private-events/access',null,{eventId,...credential});
 results.push({check:`${credential.role} login`,status:login.status,pass:login.status===200,expiresAt:login.data.expiresAt});
 if(login.status!==200)continue;
 const token=login.data.accessToken;
 if(credential.role==='attendee')attendeeToken=token;else if(credential.username==='Lina Horizon')speakerToken=token;
 const path=credential.role==='speaker'?'/api/private-events/speaker':'/api/private-events/mobile';
 const portal=await request(path,token);
 results.push({check:`${credential.username} portal data`,status:portal.status,pass:portal.status===200&&portal.data.sessions?.length>0,sessions:portal.data.sessions?.length,keys:Object.keys(portal.data)});
 if(credential.role==='attendee'){
   results.push({check:'attendee response omits speaker credentials',pass:!JSON.stringify(portal.data).includes('speakerAccessCode')});
   const forbidden=await request('/api/private-events/speaker',token);
   results.push({check:'attendee cannot read speaker portal',status:forbidden.status,pass:forbidden.status===401});
 }
}
if(process.env.LIVE_QA_WRITE==='1'&&attendeeToken&&speakerToken){
 const question=await request('/api/private-events/questions',attendeeToken,{eventId,sessionId:'e7100000-0000-4000-8000-000000000002',body:`[Live QA ${new Date().toISOString()}] Demo test: can the assigned speaker receive and answer this question?`});
 const id=question.data.question?.id;
 results.push({check:'attendee submits named demo question',status:question.status,pass:question.status===201&&!!id});
 if(id){
   const speakerData=await request('/api/private-events/speaker',speakerToken);
   results.push({check:'assigned speaker receives demo question',pass:speakerData.data.questions?.some(q=>q.id===id&&q.attendeeName==='Demo Attendee')===true});
   const answer=await request('/api/private-events/speaker',speakerToken,{questionId:id,status:'answered'},'PATCH');
   results.push({check:'speaker marks own-session demo question answered',status:answer.status,pass:answer.status===200});
 }
}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
if(results.some(result=>!result.pass))process.exitCode=1;
