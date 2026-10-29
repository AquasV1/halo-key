/* Public verification key only. Keys can be issued only by the Halo service. */
(function(root) {
  "use strict";
  const endpoint="https://halo-key-service.gsrisun19.chatgpt.site";
  const publicKey="BEa1NrpU4_YadzMinL5jxG4lroeC50ka_Fs47Wg294cUrfx7JOl2rSW2L3L7lPMmz_JPnS5TkCndwyCqrJZG3oE";
  const lifetime=86400;
  let verificationKey,session;
  const decode=value=>{
    if(!/^[A-Za-z0-9_-]+$/.test(value))throw Error("encoding");
    const bytes=Uint8Array.from(atob(value.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
    if(encode(bytes)!==value)throw Error("encoding");return bytes;
  };
  function encode(bytes){let text="";for(const byte of bytes)text+=String.fromCharCode(byte);return btoa(text).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
  async function inspect(token,now=Math.floor(Date.now()/1000)) {
    try {
      if(typeof token!=="string" || token.length>512)return null;
      const match=/^HALO2\.([A-Za-z0-9_-]{1,350})\.([A-Za-z0-9_-]{86})$/.exec(token.trim());if(!match)return null;
      const signature=decode(match[2]);if(signature.length!==64)return null;
      verificationKey ||= await crypto.subtle.importKey("raw",decode(publicKey),{name:"ECDSA",namedCurve:"P-256"},false,["verify"]);
      if(!await crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},verificationKey,signature,new TextEncoder().encode("HALO2."+match[1])))return null;
      const claims=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(decode(match[1])));
      if(claims.v!==2 || claims.iss!=="halo-key-service" || claims.aud!=="halo-executor" || !/^[A-Za-z0-9_-]{22,64}$/.test(claims.jti)
        || !Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp) || claims.iat<1700000000 || claims.exp>4102444800
        || claims.iat>now+300 || claims.exp-claims.iat!==lifetime)return null;
      return {issuedAt:claims.iat,expiresAt:claims.exp,expired:now>=claims.exp};
    } catch {return null;}
  }
  function browserSession() {
    if(session)return session;
    try {const value=localStorage.getItem("halo.session.v2");if(/^[A-Za-z0-9_-]{43}$/.test(value||""))session=value;}catch{}
    if(!session){session=encode(crypto.getRandomValues(new Uint8Array(32)));try{localStorage.setItem("halo.session.v2",session);}catch{}}
    return session;
  }
  async function request(path,input,signal) {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    const cancel=()=>controller.abort();signal?.addEventListener("abort",cancel,{once:true});
    try {
      const response=await fetch(endpoint+path,{method:"POST",mode:"cors",credentials:"omit",redirect:"error",headers:{"Content-Type":"application/json","X-Halo-Session":browserSession()},body:JSON.stringify(input),signal:controller.signal});
      const data=await response.json();
      if(!response.ok){const error=new Error(typeof data.error==="string"?data.error.slice(0,220):"The service could not complete this request.");error.status=response.status;throw error;}
      return data;
    } catch(error) {
      if(signal?.aborted)throw new DOMException("Challenge changed","AbortError");
      if(error.status)throw error;
      throw new Error("Couldn’t reach the key service. Check your connection and try again.");
    } finally {clearTimeout(timer);signal?.removeEventListener("abort",cancel);}
  }
  async function challenge(kind,level,signal) {
    const data=await request("/api/challenge",{kind,level},signal);
    if(!/^[A-Za-z0-9_-]{32}$/.test(data.id) || data.kind!==kind || typeof data.prompt!=="string" || data.prompt.length>1000 || typeof data.label!=="string"
      || (kind==="puzzle" && (!Array.isArray(data.initial) || data.initial.length!==16 || data.initial.some(n=>n!==0&&n!==1))))throw new Error("The service returned an invalid challenge.");
    return data;
  }
  async function redeem(id,answer,moves) {
    const data=await request("/api/redeem",{id,answer,moves});
    const grant=await inspect(data.token);
    if(!grant || grant.expired || grant.expiresAt!==data.expiresAt)throw new Error("The service returned an invalid or expired key. Check your device clock.");
    return {token:data.token,grant};
  }
  const api={inspect,challenge,redeem,lifetime,endpoint};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.HaloAccess=api;
})(typeof window!=="undefined"?window:globalThis);
