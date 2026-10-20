// Read-only production route checks and intentionally invalid auth requests.
const base = 'https://www.iticket.info';
const event = 'e07a0430-d216-4a5f-8ca7-2e65c77793db';
const checks = [
  ...['/', '/search', '/private-event', '/account/login', '/privacy-policy', '/terms-of-service', '/contact', '/events', '/dashboard', '/dashboard/private-events', '/checkin', '/staff-access', '/e/demo-events-co/bahrain-demo-event'].map(path => ({path, expected:200})),
  ...['/api/events/discover?limit=8','/api/private-events/list',`/api/events/${event}/seating`].map(path=>({path,expected:200})),
  // Seats.io provisioning supports POST only; GET must not provision anything.
  {path:`/api/seatsio/events/${event}`,expected:405},
  ...['/api/account/summary','/api/dashboard/messages','/api/mobile/v1/visitor/me/home','/api/mobile/v1/visitor/me/ticket','/api/private-events/speaker-questions'].map(path=>({path,expected:401})),
  {path:'/api/orders',method:'POST',body:{},expected:401},
  {path:`/api/checkin/events/${event}/scan`,method:'POST',body:{barcode:'QA-INVALID-NO-TICKET'},expected:401},
  {path:'/api/private-events/access',method:'POST',body:{username:'Invalid QA User',eventCode:'BADQA000',eventId:'e7000000-0000-4000-8000-000000000001'},expected:401},
  {path:'/api/promotions/validate',method:'POST',body:{companySlug:'demo-events-co',eventSlug:'bahrain-demo-event',code:'QA-NOT-A-PROMO',ticketCount:1},expected:404},
];
const results = [];
for (let i=0;i<checks.length;i+=4) {
  const batch=await Promise.all(checks.slice(i,i+4).map(async c=>{
    const started=Date.now();
    try {
      const response=await fetch(base+c.path,{method:c.method??'GET',headers:c.body?{'content-type':'application/json'}:{},body:c.body?JSON.stringify(c.body):undefined,signal:AbortSignal.timeout(25000)});
      const raw=await response.text();
      let detail;
      try {const b=JSON.parse(raw);detail=b.error??{events:b.events?.length,conferences:b.conferences?.length,hasPlan:'plan' in b};}catch{detail=raw.includes('Application error')?'Application error':undefined;}
      return {path:c.path,status:response.status,expected:c.expected,pass:response.status===c.expected,ms:Date.now()-started,redirect:new URL(response.url).pathname,detail};
    }catch(e){return {path:c.path,pass:false,error:e.message};}
  }));
  results.push(...batch);
}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),passed:results.filter(r=>r.pass).length,total:results.length,results},null,2));
