/* Geometry is dependency-free and shared by the browser and Node tests. */
(function (root) {
'use strict';
function bounds(mask,w,h) {
 let x0=w,y0=h,x1=-1,y1=-1;
 for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(mask[y*w+x]) {x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 return x1<0?null:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};
}
function foreground(rgba,w,h,mode,tolerance=30,alpha=128,bg=[255,255,255]) {
 const mask=new Uint8Array(w*h);
 for(let i=0;i<mask.length;i++)mask[i]=rgba[i*4+3]>=alpha?1:0;
 if(mode==='solid') {
  const seen=new Uint8Array(w*h), queue=new Int32Array(w*h);let head=0,tail=0;
  const add=i=>{if(seen[i])return;seen[i]=1;const j=i*4;
   if(!mask[i]||Math.max(Math.abs(rgba[j]-bg[0]),Math.abs(rgba[j+1]-bg[1]),Math.abs(rgba[j+2]-bg[2]))<=tolerance){mask[i]=0;queue[tail++]=i;}};
  for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
  while(head<tail){const i=queue[head++],x=i%w,y=(i/w)|0;if(x)add(i-1);if(x<w-1)add(i+1);if(y)add(i-w);if(y<h-1)add(i+w);}
 }
 return mask;
}
// Exact squared Euclidean distance transform (lower envelope of parabolas).
function distance(mask,w,h,target) {
 const out=new Float64Array(w*h), n=Math.max(w,h), f=new Float64Array(n),d=new Float64Array(n),v=new Int32Array(n),z=new Float64Array(n+1);
 function edt(len){let k=0;v[0]=0;z[0]=-Infinity;z[1]=Infinity;
  for(let q=1;q<len;q++){let s;do{s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]);if(s<=z[k])k--;else break;}while(k>=0);k++;v[k]=q;z[k]=s;z[k+1]=Infinity;}
  k=0;for(let q=0;q<len;q++){while(z[k+1]<q)k++;d[q]=(q-v[k])**2+f[v[k]];}}
 for(let x=0;x<w;x++){for(let y=0;y<h;y++)f[y]=mask[y*w+x]===target?0:1e12;edt(h);for(let y=0;y<h;y++)out[y*w+x]=d[y];}
 for(let y=0;y<h;y++){for(let x=0;x<w;x++)f[x]=out[y*w+x];edt(w);for(let x=0;x<w;x++)out[y*w+x]=d[x];}return out;
}
function offset(mask,w,h,r){if(Math.abs(r)<0.01)return mask.slice();const dist=distance(mask,w,h,r>0?1:0),out=new Uint8Array(mask.length);for(let i=0;i<out.length;i++)out[i]=r>0?+(dist[i]<=r*r):+(mask[i]&&dist[i]>r*r);return out;}
function area(p){let a=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];a+=p[i][0]*q[1]-q[0]*p[i][1];}return a/2;}
function simplifyOpen(p,e){if(p.length<3)return p;const keep=new Uint8Array(p.length);keep[0]=keep[p.length-1]=1;const stack=[[0,p.length-1]];
 while(stack.length){const [a,b]=stack.pop(),[x,y]=p[a],dx=p[b][0]-x,dy=p[b][1]-y,l=dx*dx+dy*dy;let best=e*e,at=-1;
 for(let i=a+1;i<b;i++){const t=l?Math.max(0,Math.min(1,((p[i][0]-x)*dx+(p[i][1]-y)*dy)/l)):0;const dist=(p[i][0]-x-t*dx)**2+(p[i][1]-y-t*dy)**2;if(dist>best){best=dist;at=i;}}
 if(at>=0){keep[at]=1;stack.push([a,at],[at,b]);}}return p.filter((_,i)=>keep[i]);}
function simplify(p,e){if(p.length<5||e<=0)return p;let far=1,best=0;for(let i=1;i<p.length;i++){const d=(p[i][0]-p[0][0])**2+(p[i][1]-p[0][1])**2;if(d>best){best=d;far=i;}}const a=simplifyOpen(p.slice(0,far+1),e),b=simplifyOpen([...p.slice(far),p[0]],e);const result=[...a.slice(0,-1),...b.slice(0,-1)];return result.length>=3?result:p;}
function trace(mask,w,h,{holes=false,minArea=4,tolerance=0.8}={}) {
 const stride=w+1, edges=new Map();const add=(x,y,nx,ny)=>{const key=y*stride+x;let list=edges.get(key);if(!list)edges.set(key,list=[]);list.push(ny*stride+nx);};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x]){if(!y||!mask[(y-1)*w+x])add(x,y,x+1,y);if(x===w-1||!mask[y*w+x+1])add(x+1,y,x+1,y+1);if(y===h-1||!mask[(y+1)*w+x])add(x+1,y+1,x,y+1);if(!x||!mask[y*w+x-1])add(x,y+1,x,y);}
 const paths=[];while(edges.size){const start=edges.keys().next().value;let cur=start,prev=null;const p=[];
 do{p.push([cur%stride,Math.floor(cur/stride)]);const list=edges.get(cur);if(!list)throw Error('Open contour detected');let idx=0;
 // At a diagonal touch take a right turn, keeping each pixel island separate.
 if(list.length>1&&prev!==null){const dx=cur%stride-prev%stride,dy=Math.floor(cur/stride)-Math.floor(prev/stride);idx=list.findIndex(n=>dx*(Math.floor(n/stride)-Math.floor(cur/stride))-dy*(n%stride-cur%stride)>0);if(idx<0)idx=0;}
 const next=list.splice(idx,1)[0];if(!list.length)edges.delete(cur);prev=cur;cur=next;
 }while(cur!==start);
 const a=area(p);if((holes?Math.abs(a):a)>=minArea)paths.push(simplify(p,tolerance));}
 return paths.sort((a,b)=>Math.abs(area(b))-Math.abs(area(a)));
}
function pathBounds(paths){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const p of paths)for(const [x,y]of p){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}return{x:x0,y:y0,w:x1-x0,h:y1-y0};}
const api={bounds,foreground,distance,offset,area,simplify,trace,pathBounds};if(typeof module!=='undefined')module.exports=api;else root.StickerGeometry=api;
})(typeof window!=='undefined'?window:this);
