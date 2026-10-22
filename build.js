// Produce a portable HTML file that works offline without a web server.
const fs=require('node:fs'),path=require('node:path');
let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+fs.readFileSync(path.join(__dirname,'style.css'),'utf8')+'</style>');
for(const name of ['geometry.js','exporters.js','app.js'])html=html.replace(`<script defer src="${name}"></script>`,()=>'<script defer>'+fs.readFileSync(path.join(__dirname,name),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');
// Inline scripts execute immediately, so place them after the application DOM.
const scripts=[];html=html.replace(/<script defer>[\s\S]*?<\/script>/g,s=>{scripts.push(s.replace('<script defer>','<script>'));return '';});html=html.replace('</body>',()=>scripts.join('\n')+'\n</body>');
html=html.replace('href="./index.html"','href="#"');
fs.mkdirSync(path.join(__dirname,'dist'),{recursive:true});fs.writeFileSync(path.join(__dirname,'dist','Sticker Studio.html'),html);console.log('Created dist/Sticker Studio.html');

// GitHub Pages serves index.html from the deployment directory.
fs.writeFileSync(path.join(__dirname,'dist','index.html'),html);
fs.writeFileSync(path.join(__dirname,'dist','.nojekyll'),'');
