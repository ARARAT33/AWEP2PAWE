(()=>{'use strict';
const isImage=f=>f instanceof Blob&&(!f.type||/^image\/(png|jpeg|webp|gif|bmp)$/i.test(f.type));
window.AWEQRImageDecoder={
  async scan(file){
    if(!isImage(file))throw Error('Choose a PNG, JPG, WEBP, GIF, or BMP QR image.');
    if(!window.QrScanner?.scanImage)throw Error('QR image decoder unavailable.');
    const r=await window.QrScanner.scanImage(file,{returnDetailedScanResult:true,alsoTryWithoutScanRegion:true});
    const raw=typeof r==='string'?r:r?.data;
    if(!raw||!String(raw).trim())throw Error('No QR code found in the selected image.');
    return String(raw).trim();
  }
};
const wire=()=>{
  const input=document.querySelector('#qr-image');
  if(!input||input.__aweWired)return;
  input.__aweWired=true;
  input.addEventListener('change',async e=>{
    const file=e.target.files?.[0];e.target.value='';
    if(!file)return;
    try{
      const raw=await window.AWEQRImageDecoder.scan(file);
      if(typeof window.AWEQRDecoded!=='function')throw Error('AWE runtime is not ready.');
      await window.AWEQRDecoded(raw);
    }catch(err){
      console.error('[AWEP2PAWE] Choose QR:',err);
      const t=document.querySelector('#toast');
      if(t){t.textContent=err?.message||'Could not read QR image';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)}
    }
  });
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});else wire();
})();