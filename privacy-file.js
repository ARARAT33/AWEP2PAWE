(()=>{'use strict';
// Local file privacy layer. Images are passed through unchanged. Other files get
// filesystem metadata minimized (basename only, fresh File object, current metadata
// fields not copied). Audio/video are re-recorded when the browser can do so, which
// removes common container-level metadata such as GPS/creation tags.
const input=()=>document.querySelector('#file-input');
const baseName=n=>String(n||'file').replace(/\\/g,'/').split('/').pop().replace(/[\u0000-\u001f]/g,'').slice(0,180)||'file';
const fresh=(f,blob,name,type)=>new File([blob],name,{type:type||f.type||'application/octet-stream',lastModified:Date.now()});
async function remuxMedia(f){
  if(!('MediaRecorder'in window)||!URL.createObjectURL)return null;
  const kind=f.type.startsWith('video/')?'video':'audio';
  const el=document.createElement(kind);el.muted=true;el.playsInline=true;el.src=URL.createObjectURL(f);
  await new Promise((res,rej)=>{el.onloadedmetadata=()=>res();el.onerror=()=>rej(Error('decode'))});
  const stream=el.captureStream?.();if(!stream)return null;
  const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','audio/webm;codecs=opus','audio/webm'].find(x=>MediaRecorder.isTypeSupported(x)&&((kind==='video'&&x.startsWith('video/'))||(kind==='audio'&&x.startsWith('audio/'))));
  if(!mime)return null;
  const chunks=[];const rec=new MediaRecorder(stream,{mimeType:mime});
  const done=new Promise((res,rej)=>{rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);rec.onerror=()=>rej(rec.error||Error('record'));rec.onstop=()=>res(new Blob(chunks,{type:mime}))});
  await el.play();rec.start(100);await new Promise(res=>setTimeout(res,Math.min(15000,Math.max(250,el.duration*1000||1000))));rec.stop();const out=await done;stream.getTracks().forEach(t=>t.stop());el.pause();URL.revokeObjectURL(el.src);return out;
}
async function sanitize(f){
  const name=baseName(f.name);
  if(f.type.startsWith('image/'))return f; // Explicitly do not modify images.
  try{if(f.type.startsWith('audio/')||f.type.startsWith('video/')){const b=await remuxMedia(f);if(b)return fresh(f,b,name,b.type)}}catch{}
  // Generic formats are not rewritten byte-for-byte: only filesystem/File metadata
  // is minimized. Embedded application-specific metadata cannot be safely removed
  // without a format-specific parser and is therefore never claimed to be stripped.
  return fresh(f,f,name,f.type);
}
let busy=false;
function install(){const el=input();if(!el||el.__privacyBound)return;el.__privacyBound=true;el.addEventListener('change',async e=>{if(busy)return;const files=[...el.files];if(!files.length)return;e.stopImmediatePropagation();busy=true;try{const out=[];for(const f of files)out.push(await sanitize(f));const dt=new DataTransfer();out.forEach(f=>dt.items.add(f));el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true}))}finally{busy=false}},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
