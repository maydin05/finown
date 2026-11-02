import {familyAuth} from './authClient';
export async function familyRequest(path,body) {
  const auth=await familyAuth();
  const {data:{session}}=await auth.getSession();
  const response=await fetch(`/family-api${path}`,{method:body===undefined?'GET':'POST',credentials:'omit',headers:{...(session?.access_token?{Authorization:`Bearer ${session.access_token}`} : {}),...(body===undefined?{}:{'Content-Type':'application/json','X-Finown-Request':'1'})},body:body===undefined?undefined:JSON.stringify(body)});
  let data;
  try {data=await response.json();} catch {throw Object.assign(new Error('Aile bütçesi hizmetine ulaşılamadı. Biraz sonra tekrar dene.'),{status:response.status});}
  if(!response.ok)throw Object.assign(new Error(data.error || 'Hizmete ulaşılamadı.'),{userMessage:data.error,status:response.status});
  return data;
}
export function serverFamilyRepository(id) {
 let state,sequence=0,applied=0;
 const apply=(result,ticket)=>{if(ticket>=applied && (!state || result.version>=state.version)){state=result;applied=ticket;}return state;};
 return {
  async load(){const ticket=++sequence;return apply(await familyRequest(`/budgets/${id}`),ticket);},
  async dispatch(_actor,command,_environment,operationId=crypto.randomUUID()) {
   const ticket=++sequence;return apply(await familyRequest(`/budgets/${id}/command`,{operationId,command,environmentVersion:state?._server.environmentVersion}),ticket);
  },
  // Every poll goes through fresh server membership authorization. Losing access clears the view.
  subscribe(listener){const timer=setInterval(listener,3000);return ()=>clearInterval(timer);},
 };
}
