(()=>{'use strict';
const qs=s=>document.querySelector(s);
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
class AWEMediaCall{
 constructor(){this.pc=null;this.local=null;this.remote=null;this.role=null;this.kind='voice';this.pendingCandidates=[];this.onstate=()=>{};this.ontrack=()=>{};this.onended=()=>{};this._closed=false}
 iceServers(){
  const custom=window.AWE_ICE_SERVERS;
  if(Array.isArray(custom)&&custom.length)return custom;
  return [{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}];
 }
 async start(kind='voice',initiator=true){
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Media capture is not supported by this browser');
  this.kind=kind;this.role=initiator?'offer':'answer';this._closed=false;
  this.pc=new RTCPeerConnection({iceServers:this.iceServers(),bundlePolicy:'max-bundle'});
  this.pc.onconnectionstatechange=()=>{this.onstate(this.pc.connectionState);if(this.pc.connectionState==='failed')this.onstate('failed — retry required');if(this.pc.connectionState==='closed')this.onended()};
  this.pc.oniceconnectionstatechange=()=>this.onstate('ICE: '+this.pc.iceConnectionState);
  this.pc.ontrack=e=>{const stream=e.streams?.[0];if(stream){this.remote=stream;const v=qs('#remote-video');if(v){v.srcObject=stream;v.muted=false;v.playsInline=true;v.play?.().catch(()=>{})}this.ontrack(stream)}};
  const constraints=kind==='video'?{audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:{width:{ideal:1280,max:1920},height:{ideal:720,max:1080},frameRate:{ideal:24,max:30}}}:{audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false};
  this.local=await navigator.mediaDevices.getUserMedia(constraints);
  this.local.getTracks().forEach(t=>this.pc.addTrack(t,this.local));
  const lv=qs('#local-video');if(lv){lv.srcObject=this.local;lv.muted=true;lv.playsInline=true;lv.play?.().catch(()=>{})}
  if(initiator){const offer=await this.pc.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:kind==='video'});await this.pc.setLocalDescription(offer);await this.waitIce();return this.code('offer',this.pc.localDescription)}
  return null;
 }
 async answer(code){const x=this.decode(code);if(x.type!=='offer')throw Error('Expected call offer');if(!this.pc)await this.start('video',false);await this.pc.setRemoteDescription(x.sdp);const a=await this.pc.createAnswer();await this.pc.setLocalDescription(a);await this.waitIce();return this.code('answer',this.pc.localDescription)}
 async accept(code){const x=this.decode(code);if(x.type!=='answer')throw Error('Expected call answer');if(!this.pc)throw Error('Call peer is not initialized');await this.pc.setRemoteDescription(x.sdp);return true}
 waitIce(){return new Promise(resolve=>{if(!this.pc||this.pc.iceGatheringState==='complete')return resolve();let done=false;const finish=()=>{if(done)return;done=true;this.pc?.removeEventListener('icegatheringstatechange',finish);resolve()};this.pc.addEventListener('icegatheringstatechange',()=>{if(this.pc?.iceGatheringState==='complete')finish()});setTimeout(finish,7000)})}
 code(type,sdp){return btoa(unescape(encodeURIComponent(JSON.stringify({v:2,type,sdp,kind:this.kind}))))}
 decode(v){return JSON.parse(decodeURIComponent(escape(atob(v))))}
 mute(v=true){this.local?.getAudioTracks().forEach(t=>t.enabled=!v);return !v}
 camera(v=true){this.local?.getVideoTracks().forEach(t=>t.enabled=!v);return !v}
 async devices(){if(!navigator.mediaDevices?.enumerateDevices)return [];return (await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audioinput'||d.kind==='audiooutput'||d.kind==='videoinput')}
 async setInput(deviceId){const old=this.local?.getAudioTracks?.()[0];const s=await navigator.mediaDevices.getUserMedia({audio:{deviceId:{exact:deviceId},echoCancellation:true,noiseSuppression:true},video:false});const t=s.getAudioTracks()[0];const sender=this.pc?.getSenders().find(x=>x.track?.kind==='audio');if(sender)await sender.replaceTrack(t);old?.stop();if(this.local){this.local.removeTrack(old);this.local.addTrack(t)}return t}
 async setCamera(deviceId){const old=this.local?.getVideoTracks?.()[0];const s=await navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:deviceId},width:{ideal:1280},height:{ideal:720},frameRate:{ideal:24}},audio:false});const t=s.getVideoTracks()[0];const sender=this.pc?.getSenders().find(x=>x.track?.kind==='video');if(sender)await sender.replaceTrack(t);old?.stop();if(this.local){this.local.removeTrack(old);this.local.addTrack(t)}const lv=qs('#local-video');if(lv)lv.srcObject=this.local;return t}
 async screen(){if(!navigator.mediaDevices?.getDisplayMedia)throw Error('Screen sharing is not supported');const s=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:15,max:30}},audio:false});const t=s.getVideoTracks()[0];const sender=this.pc?.getSenders().find(x=>x.track?.kind==='video');if(sender)await sender.replaceTrack(t);t.onended=()=>{const cam=this.local?.getVideoTracks()[0];if(sender&&cam)sender.replaceTrack(cam).catch(()=>{});this.onstate('camera restored')};return s}
 async recover(){if(!this.pc||this._closed)return false;if(!['failed','disconnected'].includes(this.pc.connectionState)&&!['failed','disconnected'].includes(this.pc.iceConnectionState))return true;try{await this.pc.restartIce?.();const offer=await this.pc.createOffer({iceRestart:true});await this.pc.setLocalDescription(offer);await this.waitIce();this.onstate('ICE restart ready');return this.code('offer',this.pc.localDescription)}catch(e){this.onstate('reconnect failed');return false}}
 async waitConnected(timeout=12000){const pc=this.pc;if(!pc)return false;const end=Date.now()+timeout;while(Date.now()<end){if(pc.connectionState==='connected')return true;if(['failed','closed'].includes(pc.connectionState))return false;await wait(100)}return pc.connectionState==='connected'}
 close(){this._closed=true;this.local?.getTracks().forEach(t=>t.stop());this.pc?.getSenders().forEach(s=>{try{s.replaceTrack(null)}catch{}});this.pc?.close();this.local=null;this.remote=null;this.pc=null;this.onended()}
}
window.AWEMediaCall=AWEMediaCall;
})();
