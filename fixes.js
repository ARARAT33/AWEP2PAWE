/* Small compatibility layer kept separate from the core static runtime. */
window.addEventListener('DOMContentLoaded',()=>{
  const originalMake=window.AWE?.invite;
  window.acceptInvite=async function(packet){
    try{
      const x=JSON.parse(atob(packet));
      if(!x.description)throw new Error('bad packet');
      if(x.reply && window.S?.peer){await window.S.peer.setRemoteDescription(x.description);toast('P2P կապը հաստատվում է');return}
      const pc=new RTCPeerConnection({iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}]});
      window.S.peer=pc;
      pc.onconnectionstatechange=()=>status('Կապ՝ '+pc.connectionState);
      pc.ondatachannel=e=>attach(e.channel);
      await pc.setRemoteDescription(x.description);
      const ans=await pc.createAnswer();await pc.setLocalDescription(ans);await waitIce(pc);
      const out=btoa(JSON.stringify({v:1,uid:window.S.id,reply:true,description:pc.localDescription}));
      const box=document.querySelector('#invite-input');if(box)box.value=out;copy(out);toast('Պատասխանը պատրաստ է․ ուղարկիր այն հրավիրողին');
    }catch(e){toast('Կապի փաթեթը սխալ է')}
  };
});