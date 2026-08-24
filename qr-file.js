(()=>{'use strict';
const isImage=f=>f instanceof Blob&&(!f.type||/^image\/(png|jpeg|webp|gif|bmp)$/i.test(f.type));
const waitImage=src=>new Promise((resolve,reject)=>{const img=new Image();img.decoding='async';img.onload=()=>{if(img.naturalWidth>0&&img.naturalHeight>0)resolve(img);else reject(Error('The selected image has no readable dimensions.'));};img.onerror=()=>reject(Error('Could not load the selected QR image.'));img.src=src;});
window.AWEQRImageDecoder={
  async scan(file){
    if(!isImage(file))throw Error('Choose a PNG, JPG, WEBP, GIF, or BMP QR image.');
    if(!window.QrScanner?.scanImage)throw Error('Local QR image decoder unavailable.');
    const url=URL.createObjectURL(file);
    try{
      const img=await waitImage(url);
      const r=await window.QrScanner.scanImage(img,{returnDetailedScanResult:true,alsoTryWithoutScanRegion:true});
      const raw=typeof r==='string'?r:r?.data;
      if(!raw||!String(raw).trim())throw Error('No QR code found in the selected image.');
      return String(raw).trim();
    }finally{URL.revokeObjectURL(url)}
  }
};
const wire=()=>{
  const input=document.querySelector('#qr-image');
  if(!input||input.__aweWired)return;
  input.__aweWired=true;
  const open=e=>{e?.preventDefault();input.value='';input.click()};
  for(const id of ['choose-top','choose'])document.getElementById(id)?.addEventListener('click',open,{capture:true});
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