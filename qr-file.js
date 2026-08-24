(()=>{'use strict';
/* Desktop Choose QR decoder. Camera scanning is intentionally separate. */
const Q=()=>window.QrScanner;
const install=()=>{
  const qr=Q();
  if(!qr?.scanImage)return false;
  window.AWEQRImageDecoder={
    async scan(file){
      if(!(file instanceof Blob)) throw Error('Invalid QR image');
      const result=await qr.scanImage(file,{returnDetailedScanResult:true,alsoTryWithoutScanRegion:true});
      const raw=typeof result==='string'?result:result?.data;
      if(!raw) throw Error('No QR code found in the selected image');
      return String(raw).trim();
    }
  };
  return true;
};
if(!install()){
  let n=0;const t=setInterval(()=>{if(install()||++n>100)clearInterval(t)},50);
}
})();