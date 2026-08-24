(()=>{'use strict';
const loadDecoder=async()=>{if(window.QrScanner?.scanImage)return window.QrScanner;const m=await import('https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner.min.js');const Q=m.default||m.QrScanner||m;if(Q?.scanImage)return Q;throw Error('QR image decoder unavailable')};
const ready=loadDecoder().catch(()=>null);
if(!('BarcodeDetector'in window)){
  window.BarcodeDetector=class{
    constructor(options={}){this.formats=options.formats||['qr_code']}
    async detect(source){
      const Q=await ready||await loadDecoder();
      const result=await Q.scanImage(source,{returnDetailedScanResult:true});
      const raw=typeof result==='string'?result:result?.data;
      return raw?[{rawValue:raw,format:'qr_code'}]:[];
    }
  };
}
})();
