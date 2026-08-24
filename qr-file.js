(()=>{'use strict';
/* Desktop/local image QR decoder. The legacy qr-scanner build is loaded before this file and
   contains its decoder engine, so no camera and no dynamic import are required for Choose QR. */
const Q=()=>window.QrScanner;
const install=()=>{
  const qr=Q();
  if(!qr?.scanImage)return false;
  if(!('BarcodeDetector'in window)){
    window.BarcodeDetector=class{
      constructor(options={}){this.formats=options.formats||['qr_code']}
      async detect(source){
        const result=await qr.scanImage(source,{returnDetailedScanResult:true,alsoTryWithoutScanRegion:true});
        const raw=typeof result==='string'?result:result?.data;
        return raw?[{rawValue:raw,format:'qr_code'}]:[];
      }
    };
  }
  window.AWEQRImageDecoder={
    async scan(file){
      if(!(file instanceof Blob))throw Error('Invalid QR image');
      const result=await qr.scanImage(file,{returnDetailedScanResult:true,alsoTryWithoutScanRegion:true});
      const raw=typeof result==='string'?result:result?.data;
      if(!raw)throw Error('No QR found');
      return raw;
    }
  };
  return true;
};
if(!install()){
  let n=0;const t=setInterval(()=>{if(install()||++n>100)clearInterval(t)},50);
}
})();