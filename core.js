(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const DB='awep2pawe', STORE='state';
  let state={uid:'', chats:{}, active:'local', peers:{}, resources:[]};
  let pc=null, dc=null, localStream=null, remoteStream=null;

  const save=()=>localStorage.setItem(DB, JSON.stringify(state));
  const load=()=>{try{const x=JSON.parse(localStorage.getItem(DB));if(x&&typeof x==='object')state={...state,...x};}catch{}};
  const bytesToHex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
  async function makeUID(){
    const old=localStorage.getItem('awe_uid'); if(old) return old;
    const b=crypto.getRandomValues(new Uint8Array(18));
    const id='AWE-'+bytesToHex(b).toUpperCase(); localStorage.setItem('awe_uid',id); return id;
  }
  const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const toast=t=>{let x=$('#toast');if(!x){x=document.createElement('div');x.id='toast';x.className='toast';document.body.append(x)}x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2200)};
  function setView(v){$$('.view').forEach(x=>x.classList.toggle('active-view',x.id==='view-'+v));$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===v));$$('.mobile-nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===v));}
  function renderChats(){const box=$('#chat-items'); if(!box)return; const entries=Object.entries(state.chats); box.innerHTML=entries.length?'':'<div class="empty">No chats yet. Search an AWE UID to start.</div>'; entries.forEach(([id,c])=>{const b=document.createElement('button');b.className='chat-row'+(id===state.active?' selected':'');b.innerHTML=`<span class="avatar purple">${esc((c.name||id)[0]||'A')}</span><span class="chat-meta"><strong>${esc(c.name||id)}</strong><small>${esc((c.messages?.at(-1)?.text)||'P2P chat')}</small></span><time>${c.messages?.length||0}</time>`;b.onclick=()=>openChat(id);box.append(b);});}
  function renderMessages(){const box=$('#messages');if(!box)return;const c=state.chats[state.active];box.innerHTML='<div class="day-divider"><span>Today</span></div>';if(!c||!c.messages?.length){box.insertAdjacentHTML('beforeend','<div class="message incoming"><p>Secure local chat. Connect a peer to send messages.</p><time>local</time></div>');return;}c.messages.forEach(m=>box.insertAdjacentHTML('beforeend',`<div class="message ${m.mine?'outgoing':'incoming'}"><p>${esc(m.text)}</p><time>${new Date(m.t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</time></div>`));box.scrollTop=box.scrollHeight;}
  function openChat(id){state.active=id; if(!state.chats[id])state.chats[id]={name:id,messages:[]}; save();$('#conversation-name').textContent=state.chats[id].name;$('#p2p-status').textContent=dc?.readyState==='open'?'connected':'not connected';renderChats();renderMessages();setView('chats');}
  function addMessage(text,mine=true){if(!state.chats[state.active])state.chats[state.active]={name:state.active,messages:[]};state.chats[state.active].messages.push({text,mine,t:Date.now()});save();renderChats();renderMessages();}
  function send(o){if(dc?.readyState==='open')dc.send(JSON.stringify(o));else toast('Connect to the peer first');}
  function setupDC(ch){dc=ch;dc.onopen=()=>{$('#p2p-status').textContent='connected';toast('P2P connection ready');send({type:'hello',uid:state.uid});};dc.onclose=()=>{$('#p2p-status').textContent='disconnected';};dc.onerror=()=>toast('P2P channel error');dc.onmessage=e=>handleData(e.data);}
  function handleData(raw){try{const m=JSON.parse(raw);if(m.type==='hello'){if(m.uid){openChat(m.uid);state.chats[m.uid].name=m.uid;save();}}else if(m.type==='chat'){if(!state.chats[m.from])state.chats[m.from]={name:m.from,messages:[]};state.active=m.from;state.chats[m.from].messages.push({text:m.text,mine:false,t:m.t||Date.now()});save();renderChats();renderMessages();}else if(m.type==='signal'){return;}else if(m.type==='resource'){toast('Resource received: '+m.id);}}catch{}}
  async function makePeer(offerer){pc=new RTCPeerConnection({iceServers:[]});pc.ondatachannel=e=>setupDC(e.channel);pc.onconnectionstatechange=()=>{$('#p2p-status').textContent=pc.connectionState;};pc.onicecandidate=()=>{}; if(localStream)localStream.getTracks().forEach(t=>pc.addTrack(t,localStream)); if(offerer)setupDC(pc.createDataChannel('awe')); return pc;}
  async function createInvite(){await makePeer(true);const offer=await pc.createOffer();await pc.setLocalDescription(offer);await waitIce();const code=btoa(JSON.stringify(pc.localDescription));$('#signal-code').value=code;$('#signal-title').textContent='Connection code';$('#signal-dialog').showModal();}
  async function waitIce(){await new Promise(r=>setTimeout(r,800));}
  async function acceptInvite(code){try{const d=JSON.parse(atob(code.trim()));await makePeer(false);await pc.setRemoteDescription(d);const ans=await pc.createAnswer();await pc.setLocalDescription(ans);await waitIce();$('#signal-code').value=btoa(JSON.stringify(pc.localDescription));$('#signal-title').textContent='Answer code — send this back';$('#signal-dialog').showModal();toast('Answer created');}catch(e){toast('Invalid connection code');}}
  async function finishInvite(code){try{const d=JSON.parse(atob(code.trim()));await pc.setRemoteDescription(d);$('#signal-dialog').close();toast('Connecting…');}catch{toast('Invalid answer code');}}
  async function hashFile(f){return bytesToHex(await crypto.subtle.digest('SHA-256',await f.arrayBuffer())).slice(0,32);}
  async function createResource(type, files){if(!files?.length){toast('Choose a file or folder first');return;}const f=files[0], id=type.toUpperCase()+'-'+await hashFile(f);state.resources.unshift({id,type,name:f.name,size:f.size,t:Date.now()});save();renderResources();toast(id+' created locally');}
  function renderResources(){const b=$('#resource-list');if(!b)return;b.innerHTML=state.resources.map(r=>`<article class="resource-card ${r.type==='pfid'||r.type==='psid'?'private':'open'}"><span class="resource-icon">${r.type==='sid'||r.type==='psid'?'🌐':'📄'}</span><div><label>${r.type.toUpperCase()}</label><h3>${esc(r.name)}</h3><p>${esc(r.id)}</p></div><button class="ghost copy-id" data-id="${esc(r.id)}">Copy ID</button></article>`).join('')||'<div class="empty">No local resources yet.</div>';$$('.copy-id').forEach(b=>b.onclick=()=>navigator.clipboard?.writeText(b.dataset.id).then(()=>toast('ID copied')));}
  async function startCall(video){if(!navigator.mediaDevices?.getUserMedia){toast('Camera/microphone unavailable');return;}localStream=await navigator.mediaDevices.getUserMedia({audio:true,video});if(!pc)await makePeer(true);localStream.getTracks().forEach(t=>pc.addTrack(t,localStream));if(!dc)toast('Create a P2P connection first');toast(video?'Video call ready':'Voice call ready');}
  async function shareScreen(){if(!navigator.mediaDevices?.getDisplayMedia){toast('Screen sharing is not supported');return;}const s=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});if(!pc)await makePeer(true);s.getTracks().forEach(t=>pc.addTrack(t,s));toast('Screen sharing ready');}
  function bind(){
    $('#message-form')?.addEventListener('submit',e=>{e.preventDefault();const i=$('#message-input'),t=i.value.trim();if(!t)return;addMessage(t,true);send({type:'chat',from:state.uid,text:t,t:Date.now()});i.value='';});
    $('#global-search')?.addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();const id=e.target.value.trim();if(!id)return;if(/^(FID|PFID|SID|PSID)-/i.test(id)){setView('resources');toast('Resource ID detected');}else openChat(id);});
    $('#new-chat')?.addEventListener('click',()=>{const id=prompt('Enter AWE UID');if(id)openChat(id.trim());});
    $('#connect')?.addEventListener('click',createInvite); $('#accept-code')?.addEventListener('click',()=>{const x=prompt('Paste connection code');if(x)acceptInvite(x)});$('#finish-code')?.addEventListener('click',()=>{const x=prompt('Paste answer code');if(x)finishInvite(x)});
    $('#copy-signal')?.addEventListener('click',()=>navigator.clipboard?.writeText($('#signal-code').value).then(()=>toast('Code copied')));
    $('#voice')?.addEventListener('click',()=>startCall(false));$('#video')?.addEventListener('click',()=>startCall(true));$('#screen')?.addEventListener('click',shareScreen);
    $('#pick-file')?.addEventListener('click',()=>$('#file-input')?.click());$('#pick-folder')?.addEventListener('click',()=>$('#folder-input')?.click());
    $('#file-input')?.addEventListener('change',e=>createResource('fid',[...e.target.files]));$('#folder-input')?.addEventListener('change',e=>createResource('sid',[...e.target.files]));
    $('#clear-data')?.addEventListener('click',()=>{if(confirm('Clear local AWEP2PAWE data?')){localStorage.clear();location.reload();}});
    $$('.nav-item').forEach(b=>b.onclick=()=>setView(b.dataset.view));
    $('#theme-light')?.addEventListener('click',()=>{document.body.className='light';localStorage.setItem('theme','light')});$('#theme-dark')?.addEventListener('click',()=>{document.body.className='dark';localStorage.setItem('theme','dark')});
  }
  async function init(){load();state.uid=await makeUID();save();$('#identity-id').textContent=state.uid;$('#uid-chip').textContent='AWE UID: '+state.uid;$('#settings-id').textContent=state.uid;renderChats();renderMessages();renderResources();bind();const th=localStorage.getItem('theme');if(th==='dark')document.body.className='dark';}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
