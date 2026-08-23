(()=>{'use strict';
const iceServers=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}];
const waitIce=pc=>new Promise(resolve=>{if(pc.iceGatheringState==='complete')return resolve();const done=()=>{if(pc.iceGatheringState==='complete'){pc.removeEventListener('icegatheringstatechange',done);resolve()}};pc.addEventListener('icegatheringstatechange',done);setTimeout(resolve,5000)});
const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec=s=>JSON.parse(decodeURIComponent(escape(atob(s))));
class PeerTransport{
 constructor(){this.pc=null;this.dc=null;this.role=null;this.onmessage=null;this.onstate=null;this.onchannel=null}
 create(){this.pc=new RTCPeerConnection({iceServers});this.pc.onconnectionstatechange=()=>this.onstate?.(this.pc.connectionState);this.pc.ondatachannel=e=>{this.dc=e.channel;this.bind()};return this.pc}
 bind(){if(!this.dc)return;this.dc.binaryType='arraybuffer';this.dc.onopen=()=>this.onstate?.('connected');this.dc.onclose=()=>this.onstate?.('closed');this.dc.onerror=e=>this.onstate?.('error');this.dc.onmessage=e=>{try{this.onmessage?.(typeof e.data==='string'?dec(e.data):e.data)}catch{this.onstate?.('invalid-message')}};this.onchannel?.(this.dc)}
 async offer(){this.role='offer';this.create();this.dc=this.pc.createDataChannel('awe-data',{ordered:true});this.bind();const o=await this.pc.createOffer();await this.pc.setLocalDescription(o);await waitIce(this.pc);return enc({type:'offer',sdp:this.pc.localDescription})}
 async answer(code){this.role='answer';if(!this.pc)this.create();const x=dec(code);if(x.type!=='offer')throw Error('Expected offer');await this.pc.setRemoteDescription(x.sdp);const a=await this.pc.createAnswer();await this.pc.setLocalDescription(a);await waitIce(this.pc);return enc({type:'answer',sdp:this.pc.localDescription})}
 async acceptAnswer(code){const x=dec(code);if(x.type!=='answer')throw Error('Expected answer');await this.pc.setRemoteDescription(x.sdp);return true}
 send(o){if(this.dc?.readyState!=='open')throw Error('Peer is not connected');this.dc.send(typeof o==='string'?o:enc(o))}
 close(){this.dc?.close();this.pc?.close();this.dc=null;this.pc=null}
}
window.AWEPeerTransport=PeerTransport;
})();
