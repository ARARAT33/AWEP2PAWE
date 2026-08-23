(()=>{'use strict';
const qs=s=>document.querySelector(s);
class AWEMediaCall{
 constructor(){this.pc=null;this.local=null;this.remote=null;this.role=null;this.pendingCandidates=[];this.onstate=()=>{}}
 async start(kind='voice',initiator=true){if(!navigator.mediaDevices?.getUserMedia)throw Error('Media capture is not supported by this browser');this.role=initiator?'offer':'answer';this.pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'},{urls:'stun:stun.l.google.com:19302'}]});this.pc.onconnectionstatechange=()=>this.onstate(this.pc.connectionState);this.pc.ontrack=e=>{const v=qs('#remote-video');if(v){v.srcObject=e.streams[0];v.play?.().catch(()=>{})}};this.local=await navigator.mediaDevices.getUserMedia(kind==='video'?{audio:true,video:true}:{audio:true,video:false});this.local.getTracks().forEach(t=>this.pc.addTrack(t,this.local));const lv=qs('#local-video');if(lv){lv.srcObject=this.local;lv.play?.().catch(()=>{})}if(initiator){const offer=await this.pc.createOffer();await this.pc.setLocalDescription(offer);await this.waitIce();return this.code('offer',this.pc.localDescription)}return null}
 async answer(code){const x=this.decode(code);if(x.type!=='offer')throw Error('Expected call offer');await this.pc.setRemoteDescription(x.sdp);const a=await this.pc.createAnswer();await this.pc.setLocalDescription(a);await this.waitIce();return this.code('answer',this.pc.localDescription)}
 async accept(code){const x=this.decode(code);if(x.type!=='answer')throw Error('Expected call answer');await this.pc.setRemoteDescription(x.sdp)}
 waitIce(){return new Promise(r=>{if(this.pc.iceGatheringState==='complete')return r();const f=()=>{if(this.pc.iceGatheringState==='complete'){this.pc.removeEventListener('icegatheringstatechange',f);r()}};this.pc.addEventListener('icegatheringstatechange',f);setTimeout(r,6000)})}
 code(type,sdp){return btoa(unescape(encodeURIComponent(JSON.stringify({v:1,type,sdp}))))}
 decode(v){return JSON.parse(decodeURIComponent(escape(atob(v))))}
 mute(v=true){this.local?.getAudioTracks().forEach(t=>t.enabled=!v)}
 camera(v=true){this.local?.getVideoTracks().forEach(t=>t.enabled=!v)}
 async screen(){if(!navigator.mediaDevices?.getDisplayMedia)throw Error('Screen sharing is not supported');const s=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});const sender=this.pc?.getSenders().find(x=>x.track?.kind==='video');if(sender)await sender.replaceTrack(s.getVideoTracks()[0]);s.getVideoTracks()[0].onended=()=>{const cam=this.local?.getVideoTracks()[0];if(sender&&cam)sender.replaceTrack(cam)};return s}
 close(){this.local?.getTracks().forEach(t=>t.stop());this.pc?.close();this.local=null;this.pc=null}
}
window.AWEMediaCall=AWEMediaCall;
})();
