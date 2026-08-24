(()=>{'use strict';
const install=()=>{
  if(typeof window.qrcode!=='function'||window.__aweQrRenderPatched)return false;
  const original=window.qrcode;
  const wrapped=function(type,level){
    const qr=original(type,level);
    if(qr&&typeof qr.createSvgTag==='function'){
      const svg=qr.createSvgTag.bind(qr);
      qr.createDataURL=(cellSize=5,margin=4)=>{
        const text=svg(cellSize,margin,'AWEP2PAWE QR');
        return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(text);
      };
    }
    return qr;
  };
  window.qrcode=wrapped;
  window.__aweQrRenderPatched=true;
  return true;
};
if(!install()){let n=0;const timer=setInterval(()=>{if(install()||++n>100)clearInterval(timer)},50)}
})();
