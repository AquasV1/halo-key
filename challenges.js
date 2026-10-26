(function (root) {
  "use strict";
  const levels = ["prealgebra", "algebra", "algebra2", "precalculus", "calculus"];
  const names = { prealgebra: "Pre-algebra", algebra: "Algebra I", algebra2: "Algebra II", precalculus: "Precalculus", calculus: "Calculus" };
  function secureRandom() { return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296; }
  function make(level = "mixed", random = secureRandom) {
    const int = (a, b) => a + Math.floor(random() * (b - a + 1));
    if (!levels.includes(level)) level = levels[int(0, levels.length - 1)];
    const variant = int(0, 1);
    let prompt, answer;
    if (level === "prealgebra") {
      if (variant === 0) {
        const a = int(11,18), c = int(2,5), q = int(5,13), b = a*a-c*q, d = int(4,9), e = int(3,8), f = int(7,21);
        prompt = `Evaluate (( ${a}² − ${b} ) ÷ ${c}) + (${d} × ${e}) − ${f}.`;
        answer = q + d*e - f;
      } else {
        const a=int(5,17), b=int(2,7), c=int(3,11), d=int(2,6), e=int(9,16), f=int(2,7), g=int(4,13), h=int(2,8);
        prompt = `Evaluate ${a}/${b} + (${c}/${d}) × (${e} − ${f}) − ${g}/${h}.`;
        answer = a/b + c/d*(e-f) - g/h;
      }
    } else if (level === "algebra") {
      if (variant === 0) {
        const a=int(4,9), b=int(2,8), c=int(2,6), d=int(2,7), x=int(-8,12), e=a*(2*x-b)-c*(x+d);
        prompt = `Solve for x: ${a}(2x − ${b}) − ${c}(x + ${d}) = ${e}.`;
        answer = x;
      } else {
        const a=int(2,7), b=int(2,6), c=int(2,8), d=int(2,7), x=int(-6,9), y=int(-6,9);
        prompt = `Find x + y if ${a}x + ${b}y = ${a*x+b*y} and ${c}x − ${d}y = ${c*x-d*y}.`;
        answer = x+y;
      }
    } else if (level === "algebra2") {
      if (variant === 0) {
        const r=int(-9,-2), t=int(2,11), b=-(r+t), c=r*t;
        prompt = `If r and s are the two roots of x² ${b < 0 ? "−" : "+"} ${Math.abs(b)}x − ${Math.abs(c)} = 0, find r² + s².`;
        answer = r*r+t*t;
      } else {
        const a=int(2,9), b=int(2,7);
        prompt = `Solve for x: 2^(x + ${a}) = 8^(x − ${b}).`;
        answer = (a+3*b)/2;
      }
    } else if (level === "precalculus") {
      if (variant === 0) {
        const a=int(2,7), b=int(3,9), c=int(2,4), d=int(1,5), k=int(2,5), g=c*k-d;
        prompt = `Let f(x) = x² + ${a}x + ${b} and g(x) = ${c}x − ${d}. Find f(g(${k})) − f(${k}).`;
        answer = g*g+a*g+b-(k*k+a*k+b);
      } else {
        const a=int(2,7), r=int(2,3), n=int(4,7), b=int(5,19);
        prompt = `A geometric sequence starts at ${a} and has common ratio ${r}. Find the sum of its first ${n} terms, then subtract ${b}.`;
        answer = a*(r**n-1)/(r-1)-b;
      }
    } else {
      if (variant === 0) {
        const a=int(2,6), b=int(2,8), c=int(2,9), d=int(2,9), k=int(1,4);
        prompt = `Let f(x) = ${a}x⁴ + ${b}x³ − ${c}x² + ${d}x. Find f′(${k}).`;
        answer = 4*a*k**3+3*b*k*k-2*c*k+d;
      } else {
        const a=int(2,8), b=int(2,5), c=int(2,9), d=int(2,7);
        prompt = `Evaluate the definite integral from 0 to ${b} of (${a}x² + ${c}x − ${d}) dx.`;
        answer = a*b**3/3+c*b*b/2-d*b;
      }
    }
    return { level, label:names[level], prompt, answer };
  }
  function parseAnswer(input) {
    const parts = String(input).trim().replaceAll("−", "-").split("/");
    if (!parts.length || parts.length > 2) return null;
    const number = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
    if (!parts.every(p => number.test(p.trim()))) return null;
    const values=parts.map(p=>Number(p.trim()));
    if (!values.every(Number.isFinite) || (parts.length === 2 && values[1] === 0)) return null;
    const value = parts.length === 2 ? values[0]/values[1] : values[0];
    return Number.isFinite(value) ? value : null;
  }
  function correct(challenge, input) {
    const value = parseAnswer(input);
    return value !== null && Number.isFinite(challenge.answer) && Math.abs(value - challenge.answer) <= 0.000001;
  }
  const api={ make, parseAnswer, correct, levels };
  if (typeof module !== "undefined" && module.exports) module.exports=api;
  else root.HaloChallenge=api;
})(typeof window !== "undefined" ? window : globalThis);
