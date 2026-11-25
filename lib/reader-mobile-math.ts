// Presentation only. The source manuscript is integrity-checked before this transform.
const css = `
.hi-math-phone{display:none}
@media(max-width:760px){
 .hi-math-desktop{display:none}
 .hi-math-phone{display:flex;flex-direction:column;align-items:center;gap:.18em;max-width:100%;min-width:0;white-space:normal;overflow-wrap:anywhere;text-align:center;font:inherit;font-family:system-ui,sans-serif;font-size:.96em;line-height:1.4}
 .hi-math-phone>span{display:block;max-width:100%;min-width:0}
 .hi-math-frac{display:inline-grid;max-width:100%;vertical-align:middle;margin-inline:.1em;text-align:center}
 .hi-math-frac>span{display:block;padding-inline:.1em}
 .hi-math-frac>span:first-child{border-bottom:1px solid currentColor}
 .formula,.math-inline-scroll{min-width:0;max-width:100%;overflow:visible}
 .formula code{white-space:normal;overflow-wrap:anywhere}
 .math-inline-scroll{display:block;margin:.25em 0 .5em}
 .math-inline-scroll .hi-math-phone{text-align:left;align-items:flex-start}
 .math-scroll-note{display:none!important}
 html{scroll-padding-top:78px}
 .chapter,[id^="cap-"]{scroll-margin-top:12px}
 .topbar .brand{flex:1;min-width:0;line-height:1.1}
 .topbar .brand>span:not(.brand-mark){min-width:0}
 .topbar .brand b{white-space:normal;overflow-wrap:anywhere}
 .topbar .reader-tools{flex:0 0 auto}
}
`;

const clean = (s: string) => s.replace(/\u00a0/g," ").replace(/\s+/g," ").trim();
const operatorSpacing = (s: string) => clean(s.replace(/\s*([+×=])\s*/g," $1 "));
const escapeHtml = (s: string) => s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
const tokens = /<mfrac><mrow>([\s\S]*?)<\/mrow><mrow>([\s\S]*?)<\/mrow><\/mfrac>|<mtext>([^<]*)<\/mtext>/g;
const onlyText = /^(?:<mtext>[^<]*<\/mtext>)+$/;

function equationLayout(math: string) {
 const row=math.match(/^<math\b[^>]*><mrow>([\s\S]+)<\/mrow><\/math>$/i)?.[1];
 if (!row) return null;
 const parts=[...row.matchAll(tokens)];
 if (!parts.length || parts.map(x=>x[0]).join("")!==row) return null;
 let flat="", alt="", i=0;
 const fracs=new Map<string,string>();
 const decode=(s:string)=>operatorSpacing(s.replaceAll("<mtext>","").replaceAll("</mtext>",""));
 for(const [,num,den,plain] of parts){
  if(plain!==undefined){flat+=plain;alt+=plain;continue}
  if(!num || !den || !onlyText.test(num) || !onlyText.test(den)) return null;
  const top=decode(num),bottom=decode(den),mark="\u000b"+(i++)+"\u000b";
  fracs.set(mark,`<span class="hi-math-frac"><span>${escapeHtml(top)}</span><span>${escapeHtml(bottom)}</span></span>`);
  flat+=mark;
  alt+=` ${top}, dividido por ${bottom} `;
 }
 // Private placeholders survive normalization; only the local fraction markup is inserted.
 const lines=flat.split("=").map((x,n)=>{
  let html=escapeHtml(operatorSpacing(x.replace(/\u000b(\d+)\u000b/g,"$1")));
  html=html.replace(/(\d+)/g,(_,k)=>fracs.get("\u000b"+k+"\u000b")??"");
  return (n?"= ":"")+html;
 });
 return {lines,label:i?clean(alt.replaceAll("="," igual a ")):null};
}

export function applyVolumeOneMobileMath(html:string) {
 const matched=html.match(/<math\b[\s\S]*?<\/math>/gi);
 if (matched?.length!==7 || !html.includes("</style>")) return html;
 const layouts=matched.map(equationLayout);
 if(layouts.some(x=>!x)) return html;
 let i=0;
 return html.replace(/<math\b[\s\S]*?<\/math>/gi,math=>{
  const {lines,label}=layouts[i++]!;
  const attrs=label?` role="img" aria-label="${escapeHtml(label)}"`:"";
  const innerAttrs=label?' aria-hidden="true"':"";
  const phone=lines.map(x=>`<span${innerAttrs}>${x}</span>`).join("");
  return `<span class="hi-math-desktop">${math}</span><span class="hi-math-phone"${attrs}>${phone}</span>`;
 }).replace("</style>",css+"\n</style>");
}
