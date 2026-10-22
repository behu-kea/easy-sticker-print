(function(root){
'use strict';
const pt=72/25.4, enc=s=>new TextEncoder().encode(s),num=n=>Number(n.toFixed(5)).toString();
function concat(chunks){const out=new Uint8Array(chunks.reduce((s,c)=>s+c.length,0));let i=0;for(const c of chunks){out.set(c,i);i+=c.length;}return out;}
function setup(job){const {widthMM,heightMM,paths,strokeMM}=job;if(!paths.length||![widthMM,heightMM,strokeMM].every(x=>Number.isFinite(x)&&x>0))throw Error('Invalid export dimensions or empty cut path');return{w:widthMM*pt,h:heightMM*pt,stroke:strokeMM*pt};}
function pdf(job){const {w,h,stroke}=setup(job),objects=[];const add=o=>{objects.push(typeof o==='string'?enc(o):o);return objects.length;};const stream=(dict,data)=>concat([enc(`<< ${dict} /Length ${data.length} >>\nstream\n`),data,enc('\nendstream')]);
 add('<< /Type /Catalog /Pages 2 0 R >>');add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(w)} ${num(h)}] /Resources << /XObject << /Artwork 4 0 R >> /ColorSpace << /Cut [/Separation /CutContour /DeviceCMYK 5 0 R] >> /ExtGState << /Overprint << /Type /ExtGState /OP true /op true /OPM 1 >> >> >> /Contents 6 0 R >>`);
 add(stream(`/Type /XObject /Subtype /Image /Width ${job.imageWidth} /Height ${job.imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,job.jpeg));
 add('<< /FunctionType 2 /Domain [0 1] /C0 [0 0 0 0] /C1 [0 1 0 0] /N 1 >>');
 const r=job.imageRect;let content=`q ${num(r.w*pt)} 0 0 ${num(r.h*pt)} ${num(r.x*pt)} ${num(h-(r.y+r.h)*pt)} cm /Artwork Do Q\nq /Overprint gs /Cut CS 1 SCN ${num(stroke)} w 1 J 1 j\n`;
 for(const p of job.paths){p.forEach(([x,y],i)=>{content+=`${num(x*pt)} ${num(h-y*pt)} ${i?'l':'m'}\n`;});content+='h S\n';}content+='Q\n';add(stream('',enc(content)));
 const chunks=[enc('%PDF-1.4\n%Sticker Studio\n')], offsets=[0];let len=chunks[0].length;
 objects.forEach((o,i)=>{offsets.push(len);const chunk=concat([enc(`${i+1} 0 obj\n`),o,enc('\nendobj\n')]);chunks.push(chunk);len+=chunk.length;});const xref=len;
 chunks.push(enc(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));return concat(chunks);
}
function eps(job){const {w,h,stroke}=setup(job),r=job.imageRect;let s=`%!PS-Adobe-3.0 EPSF-3.0\n%%Creator: Sticker Studio\n%%Title: Sticker with CutContour\n%%BoundingBox: 0 0 ${Math.ceil(w)} ${Math.ceil(h)}\n%%HiResBoundingBox: 0 0 ${num(w)} ${num(h)}\n%%LanguageLevel: 3\n%%DocumentProcessColors: Cyan Magenta Yellow Black\n%%DocumentCustomColors: (CutContour)\n%%CMYKCustomColor: 0 1 0 0 (CutContour)\n%%Pages: 1\n%%EndComments\n%%Page: 1 1\ngsave\n${num(r.x*pt)} ${num(h-(r.y+r.h)*pt)} translate\n${num(r.w*pt)} ${num(r.h*pt)} scale\n/DeviceRGB setcolorspace\n<< /ImageType 1 /Width ${job.imageWidth} /Height ${job.imageHeight} /BitsPerComponent 8 /Decode [0 1 0 1 0 1] /ImageMatrix [${job.imageWidth} 0 0 -${job.imageHeight} 0 ${job.imageHeight}] /DataSource currentfile /ASCIIHexDecode filter /DCTDecode filter >> image\n`;
 let hex='';for(const b of job.jpeg)hex+=b.toString(16).padStart(2,'0');s+=hex.match(/.{1,120}/g).join('\n')+'\n>\ngrestore\ngsave\n[/Separation /CutContour /DeviceCMYK { 0 exch 0 0 }] setcolorspace\n1 setcolor\ntrue setoverprint\n'+num(stroke)+' setlinewidth\n1 setlinejoin 1 setlinecap\n';
 for(const p of job.paths){s+='newpath\n';p.forEach(([x,y],i)=>s+=`${num(x*pt)} ${num(h-y*pt)} ${i?'lineto':'moveto'}\n`);s+='closepath stroke\n';}return enc(s+'grestore\nshowpage\n%%EOF\n');}
const api={pdf,eps};if(typeof module!=='undefined')module.exports=api;else root.StickerExport=api;
})(typeof window!=='undefined'?window:this);
