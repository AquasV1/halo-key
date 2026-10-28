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
const kind=document.getElementById("challenge-kind");
const grid=document.getElementById("puzzle-grid");
let puzzleBoard=[],puzzleMoves=0;
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
  const isPuzzle=kind.value==="puzzle";
  problem = isPuzzle ? HaloPuzzle.make() : HaloChallenge.make(level.value);
  document.getElementById("math-level-options").hidden=isPuzzle;
  document.getElementById("math-fields").hidden=isPuzzle;
  document.getElementById("puzzle-panel").hidden=!isPuzzle;
  if(isPuzzle) {
    puzzleBoard=problem.initial.slice();puzzleMoves=0;grid.replaceChildren();
    puzzleBoard.forEach((_,index)=>{const tile=document.createElement("button");tile.type="button";tile.dataset.index=String(index);grid.append(tile);});
    updatePuzzle();
  }
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
  description.textContent = "Choose a light puzzle or a math problem. Your key lasts 24 hours from the moment you earn it.";
  nextProblem();
  feedback.textContent = message;
}
function tick() {
  if (!grant) return;
  const remaining = Math.max(0, grant.expiresAt - Math.floor(Date.now()/1000));
  if (!remaining) {
    store(null);
    clearTimeout(resetTimer);
    showChallenge("Your key expired. Solve a new challenge to get another 24 hours.");
    return;
  }
  const hours = Math.floor(remaining/3600), minutes = Math.floor(remaining%3600/60), seconds = remaining%60;
  document.getElementById("key-countdown").textContent = [hours,minutes,seconds].map(n=>String(n).padStart(2,"0")).join(":");
  document.getElementById("expiry-progress").value = remaining;
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
function updatePuzzle() {
  [...grid.children].forEach((tile,index)=>{
    tile.classList.toggle("lit",Boolean(puzzleBoard[index]));
    tile.setAttribute("aria-pressed",puzzleBoard[index]?"true":"false");
    tile.setAttribute("aria-label",`Row ${Math.floor(index/4)+1}, column ${index%4+1}: ${puzzleBoard[index]?"on":"off"}`);
    tile.disabled=issuing;
  });
  const left=puzzleBoard.filter(Boolean).length;
  document.getElementById("puzzle-status").textContent=left ? `${left} lights on · ${puzzleMoves} moves` : "Solved. Claim your key below.";
}
grid.addEventListener("click",event=>{
  const tile=event.target.closest("button[data-index]");if(!tile || issuing || grant)return;
  puzzleBoard=HaloPuzzle.toggle(puzzleBoard,Number(tile.dataset.index));puzzleMoves++;updatePuzzle();feedback.textContent="";
});
grid.addEventListener("keydown",event=>{
  const tile=event.target.closest("button[data-index]");if(!tile)return;
  const index=Number(tile.dataset.index),row=Math.floor(index/4),col=index%4;
  const offsets={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
  if(!offsets[event.key])return;event.preventDefault();const [dy,dx]=offsets[event.key];
  const y=Math.max(0,Math.min(3,row+dy)),x=Math.max(0,Math.min(3,col+dx));grid.children[y*4+x].focus();
});
document.getElementById("reset-puzzle").addEventListener("click",()=>{if(issuing || grant)return;puzzleBoard=problem.initial.slice();puzzleMoves=0;updatePuzzle();feedback.textContent="";});
kind.addEventListener("change",nextProblem);
level.addEventListener("change", nextProblem);
document.getElementById("new-problem").addEventListener("click", () => { nextProblem(); if(kind.value==="math")answer.focus();else grid.firstElementChild?.focus(); });
answer.addEventListener("input",()=>{ answer.removeAttribute("aria-invalid"); feedback.textContent=""; });
document.getElementById("challenge-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (issuing || !problem || grant) return;
  if(kind.value==="puzzle" && !HaloPuzzle.solved(puzzleBoard)) {
    feedback.textContent="There are still lights on. Turn them all off, then claim your key.";return;
  }
  if (kind.value==="math" && !HaloChallenge.correct(problem, answer.value)) {
    answer.setAttribute("aria-invalid","true");
    feedback.textContent=HaloChallenge.parseAnswer(answer.value) === null
      ? "Enter a number or a fraction, such as 7/3."
      : "That answer doesn’t match. Try the problem again.";
    answer.focus(); return;
  }
  issuing=true; submit.disabled=true; level.disabled=true; kind.disabled=true; if(kind.value==="puzzle")updatePuzzle();
  feedback.textContent="Correct. Preparing your key…";
  try {
    const value=await HaloAccess.issue();
    const info=await HaloAccess.inspect(value);
    if (!info || info.expired) throw new Error("clock");
    showKey(value, info, store(value));
  } catch {
    feedback.textContent="Couldn’t create a key. Check that this page uses HTTPS and try again.";
  } finally { issuing=false; submit.disabled=false; level.disabled=false; kind.disabled=false; if(kind.value==="puzzle")updatePuzzle(); }
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
      showChallenge(info?.expired ? "Your previous key expired. Solve a new challenge for 24 more hours." : "");
    }
  } catch { showChallenge("Couldn’t read saved access. You can still solve a new challenge."); }
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
