(()=>{'use strict';
const okType=f=>f instanceof File&&(!f.type||/^image\/(png|jpeg|webp|gif|bmp)$/i.test(f.type));
const toast=m=>{const t=document.querySelector('#toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(window.__aweQrToast);window.__aweQrToast=setTimeout(()=>t.classList.remove('show'),3000)};
window.AWEQRImageDecoder={async scan(file){
  if(!okType(file))throw Error('Choose a PNG, JPG, WEBP, GIF, or BMP QR image.');
  const scanner=window.QrScanner;
  if(!scanner||typeof scanner.scanImage!=='function')throw Error('Local QR image decoder unavailable.');
  let last;
  // Try the File directly first. This avoids zero-size canvas/image races.
  for(const source of [file]){
    try{
      const result=await scanner.scanImage(source,{returnDetailedScanResult:true,alsoTryWithoutScanRegion:true});
      const raw=typeof result==='string'?result:result?.data;
      if(raw&&String(raw).trim())return String(raw).trim();
    }catch(e){last=e}
  }
  // Fallback: fully decode the file into a real image before scanning.
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((resolve,reject)=>{
      const im=new Image();
      im.onload=()=>im.naturalWidth>0&&im.naturalHeight>0?resolve(im):reject(Error('QR image has no readable dimensions.'));
      im.onerror=()=>reject(Error('Could not decode the selected image file.'));
      im.src=url;
    });
    const result=await scanner.scanImage(img,{returnDetailedScanResult:true,alsoTryWithoutScanRegion:true});
    const raw=typeof result==='string'?result:result?.data;
    if(raw&&String(raw).trim())return String(raw).trim();
  }catch(e){last=e}finally{URL.revokeObjectURL(url)}
  throw Error(last?.message||'No readable QR code was found in the selected image.');
}};
const wire=()=>{
  const input=document.querySelector('#qr-image');if(!input||input.__aweWired)return;input.__aweWired=true;
  const open=e=>{e?.preventDefault();e?.stopImmediatePropagation();input.value='';input.click()};
  for(const id of ['choose-top','choose'])document.getElementById(id)?.addEventListener('click',open,{capture:true});
  input.addEventListener('change',async e=>{
    e.stopImmediatePropagation();const file=e.target.files?.[0];e.target.value='';if(!file)return;
    try{const raw=await window.AWEQRImageDecoder.scan(file);if(typeof window.AWEQRDecoded!=='function')throw Error('AWE runtime is not ready.');await window.AWEQRDecoded(raw)}
    catch(err){console.error('[AWEP2PAWE] Choose QR:',err);toast(err?.message||'Could not read QR image.')}
  },{capture:true});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});else wire();
})();