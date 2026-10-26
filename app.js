"use strict";

async function copyText(element) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(element.textContent.trim());
      return true;
    }
  } catch { /* Keep a selection fallback for browsers that deny clipboard access. */ }
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  try { return document.execCommand("copy"); } catch { return false; }
}

const storageName = "halo.access.v1";
const card = document.getElementById("access-card");
const challengePanel = document.getElementById("challenge-panel");
const keyPanel = document.getElementById("key-panel");
const heading = document.getElementById("access-heading");
const description = document.getElementById("access-description");
const loading = document.getElementById("access-loading");
const level = document.getElementById("challenge-level");
const answer = document.getElementById("math-answer");
const feedback = document.getElementById("challenge-feedback");
const submit = document.getElementById("check-answer");
const key = document.getElementById("access-key");
const copyButton = document.getElementById("copy-key");
const copyLabel = document.getElementById("copy-label");
const copyIcon = document.querySelector("#copy-icon use");
const copyStatus = document.getElementById("copy-status");
let problem, token = null, grant = null, issuing = false, resetTimer;

function store(value) {
  try {
    if (value) localStorage.setItem(storageName, value);
    else localStorage.removeItem(storageName);
    return true;
  } catch { return false; }
}
function nextProblem() {
  if (issuing) return;
  problem = HaloChallenge.make(level.value);
  document.getElementById("problem-topic").textContent = problem.label;
  document.getElementById("math-problem").textContent = problem.prompt;
  answer.value = "";
  answer.removeAttribute("aria-invalid");
  feedback.textContent = "";
}
function showChallenge(message = "") {
  token = grant = null;
  key.textContent = "";
  keyPanel.hidden = true;
  challengePanel.hidden = false;
  heading.textContent = "Earn your access key";
  description.textContent = "Solve one randomized math problem. Your key lasts 24 hours from the moment you earn it.";
  nextProblem();
  feedback.textContent = message;
}
function tick() {
  if (!grant) return;
  const remaining = Math.max(0, grant.expiresAt - Math.floor(Date.now()/1000));
  if (!remaining) {
    store(null);
    clearTimeout(resetTimer);
    showChallenge("Your key expired. Solve a new problem to get another 24 hours.");
    return;
  }
  const hours = Math.floor(remaining/3600), minutes = Math.floor(remaining%3600/60), seconds = remaining%60;
  document.getElementById("key-countdown").textContent = [hours,minutes,seconds].map(n=>String(n).padStart(2,"0")).join(":");
  document.getElementById("expiry-progress").style.width = `${Math.min(100, remaining/HaloAccess.lifetime*100)}%`;
}
function showKey(value, info, remembered) {
  token=value; grant=info;
  key.textContent=token;
  challengePanel.hidden=true; keyPanel.hidden=false;
  heading.textContent="Your key is ready";
  description.textContent="Copy the full key, return to Halo, and select Unlock. Your original expiry stays the same across launches.";
  copyLabel.textContent="Copy key"; copyIcon.setAttribute("href","#icon-copy");
  copyStatus.textContent=remembered ? "Saved in this browser. Paste into Halo to unlock." : "Key ready. Your browser couldn’t save it, so keep a copy.";
  copyStatus.removeAttribute("data-state");
  const date=new Date(info.expiresAt*1000);
  document.getElementById("key-expiry").textContent=`Expires ${date.toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"})}.`;
  tick();
}
level.addEventListener("change", nextProblem);
document.getElementById("new-problem").addEventListener("click", () => { nextProblem(); answer.focus(); });
answer.addEventListener("input",()=>{ answer.removeAttribute("aria-invalid"); feedback.textContent=""; });
document.getElementById("challenge-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (issuing || !problem || grant) return;
  if (!HaloChallenge.correct(problem, answer.value)) {
    answer.setAttribute("aria-invalid","true");
    feedback.textContent=HaloChallenge.parseAnswer(answer.value) === null
      ? "Enter a number or a fraction, such as 7/3."
      : "That answer doesn’t match. Try the problem again.";
    answer.focus(); return;
  }
  issuing=true; submit.disabled=true; level.disabled=true;
  feedback.textContent="Correct. Preparing your key…";
  try {
    const value=await HaloAccess.issue();
    const info=await HaloAccess.inspect(value);
    if (!info || info.expired) throw new Error("clock");
    showKey(value, info, store(value));
  } catch {
    feedback.textContent="Couldn’t create a key. Check that this page uses HTTPS and try again.";
  } finally { issuing=false; submit.disabled=false; level.disabled=false; }
});
copyButton.addEventListener("click", async () => {
  if (!grant || grant.expiresAt <= Math.floor(Date.now()/1000)) { tick(); return; }
  clearTimeout(resetTimer);
  const copied=await copyText(key);
  if (!grant) return;
  copyLabel.textContent=copied ? "Key copied" : "Copy selected key";
  copyIcon.setAttribute("href",copied ? "#icon-check" : "#icon-copy");
  copyStatus.textContent=copied ? "Return to Halo, paste your key, and select Unlock." : "Press ⌘C or Ctrl+C to copy the selected key.";
  copyStatus.dataset.state=copied ? "copied" : "manual";
  resetTimer=setTimeout(()=>{ copyLabel.textContent="Copy key"; copyIcon.setAttribute("href","#icon-copy"); },2200);
});
async function restore() {
  try {
    let saved; try { saved=localStorage.getItem(storageName); } catch { /* App persistence still works. */ }
    const info=saved ? await HaloAccess.inspect(saved) : null;
    if (info && !info.expired) showKey(saved,info,true);
    else {
      if (saved) store(null);
      showChallenge(info?.expired ? "Your previous key expired. Solve a new problem for 24 more hours." : "");
    }
  } catch { showChallenge("Couldn’t read saved access. You can still solve a new problem."); }
  loading.hidden=true;
  card.setAttribute("aria-busy","false");
}
setInterval(tick,1000);
document.addEventListener("visibilitychange",()=>{ if (!document.hidden) tick(); });
// Keep the same key in other open tabs, without issuing or renewing it.
window.addEventListener("storage",event=>{ if (event.key===storageName) restore(); });
restore();

const exampleButton=document.getElementById("copy-example");
exampleButton.addEventListener("click",async()=>{
  const copied=await copyText(document.getElementById("example-code"));
  document.getElementById("example-status").textContent=copied ? "Copied. Paste into Halo, then select Execute." : "Example selected. Press ⌘C or Ctrl+C to copy.";
});
