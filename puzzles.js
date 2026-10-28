/* Solvable Lights Out boards. This game is not an anti-bot or licensing boundary. */
(function(root) {
  "use strict";
  function random(limit) {
    const data=new Uint32Array(1), ceiling=Math.floor(4294967296/limit)*limit;
    do { crypto.getRandomValues(data); } while(data[0]>=ceiling);
    return data[0]%limit;
  }
  function toggle(board,index) {
    if(!Array.isArray(board) || board.length!==16 || !Number.isInteger(index) || index<0 || index>=16) throw new Error("Invalid tile");
    const next=board.slice(),row=Math.floor(index/4),col=index%4;
    for(const [dy,dx] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]) {
      const y=row+dy,x=col+dx;if(y>=0 && y<4 && x>=0 && x<4)next[y*4+x]=next[y*4+x]?0:1;
    }
    return next;
  }
  function make(rng=random) {
    let board=Array(16).fill(0);
    const presses=[];
    for(let i=0;i<18;i++) {const index=rng(16);presses.push(index);board=toggle(board,index);}
    if(board.every(n=>n===0))board=toggle(board,5);
    return {kind:"puzzle",label:"LIGHTS OUT",prompt:"Turn off every light.",initial:board};
  }
  const api={make,toggle,solved:board=>Array.isArray(board) && board.length===16 && board.every(n=>n===0)};
  if(typeof module!=="undefined" && module.exports)module.exports=api;else root.HaloPuzzle=api;
})(typeof window!=="undefined"?window:globalThis);
