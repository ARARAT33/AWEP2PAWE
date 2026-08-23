(()=>{'use strict';
const KEY='AWEP2PAWE_STATE_V11';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=m=>{const e=document.querySelector('#toast');if(e){e.textContent=m;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2200)}};
const uid=()=>{const s=load();return s.uid||''};
function state(){const s=load();s.groups=Array.isArray(s.groups)?s.groups:[];s.channels=Array.isArray(s.channels)?s.channels:[];return s}
function persist(s){save(s);if(window.__aweSocialRefresh)window.__aweSocialRefresh()}
function validUid(v){return /^AWE-[A-Z0-9]{20}$/.test(String(v||'').trim().toUpperCase())}
function id(prefix){return prefix+'-'+crypto.randomUUID().replaceAll('-','').slice(0,24).toUpperCase()}
function createGroup(){const s=state(),name=prompt('Group name');if(!name?.trim())return;const g={id:id('GRP'),name:name.trim(),owner:uid(),members:[uid()],admins:[uid()],messages:[],createdAt:Date.now()};s.groups.unshift(g);persist(s);toast('Group created locally')}
function createChannel(){const s=state(),name=prompt('Channel name');if(!name?.trim())return;const privateMode=confirm('Make this channel private?');const c={id:id('CH'),name:name.trim(),owner:uid(),members:[uid()],admins:[uid()],private:privateMode,posts:[],createdAt:Date.now()};s.channels.unshift(c);persist(s);toast('Channel created locally')}
function invite(kind,key){const s=state(),uidValue=prompt('Invite AWE UID');if(!validUid(uidValue))return toast('Invalid AWE UID');const idv=uidValue.trim().toUpperCase();const item=(kind==='group'?s.groups:s.channels).find(x=>x.id===key);if(!item||item.owner!==uid())return toast('Only the owner can invite');if(!item.members.includes(idv))item.members.push(idv);item.invites=item.invites||[];if(!item.invites.includes(idv))item.invites.push(idv);persist(s);if(window.__aweSendControl)window.__aweSendControl({kind:'social-invite',socialType:kind,id:key,invitee:idv,resource:item});toast('Invitation queued for direct P2P delivery')}
function renderSocial(){const s=state();const gl=document.querySelector('#channel-list');if(gl){gl.innerHTML=s.groups.map(g=>`<article class="info-card"><strong>👥 ${esc(g.name)}</strong><small>${g.members.length} member(s) · ${esc(g.id)}</small><div><button class="ghost" data-social-invite="group:${esc(g.id)}">Invite</button><button class="ghost" data-social-open="group:${esc(g.id)}">Open</button></div></article>`).concat(s.channels.map(c=>`<article class="info-card"><strong>📢 ${esc(c.name)}</strong><small>${c.private?'Private':'Public'} · ${c.members.length} member(s) · ${esc(c.id)}</small><div><button class="ghost" data-social-invite="channel:${esc(c.id)}">Invite</button><button class="ghost" data-social-post="${esc(c.id)}">Post</button></div></article>`)).join('')||'<div class="empty-card">No groups or channels on this device.</div>'}}
function post(channelId){const s=state(),c=s.channels.find(x=>x.id===channelId);if(!c||c.owner!==uid())return toast('Only the channel admin can publish');const text=prompt('Channel post');if(!text?.trim())return;c.posts.push({id:crypto.randomUUID(),author:uid(),text:text.trim(),ts:Date.now()});persist(s);if(window.__aweSendControl)window.__aweSendControl({kind:'channel-post',channelId,text:text.trim(),ts:Date.now()});toast('Post saved and queued for direct P2P sync')}
function bind(){document.querySelector('#create-channel')?.addEventListener('click',createChannel);document.querySelector('#channel-list')?.addEventListener('click',e=>{const inv=e.target.closest('[data-social-invite]');if(inv){const [k,i]=inv.dataset.socialInvite.split(':');invite(k,i);return}const p=e.target.closest('[data-social-post]');if(p)post(p.dataset.socialPost);const o=e.target.closest('[data-social-open]');if(o){const s=state(),g=s.groups.find(x=>x.id===o.dataset.socialOpen);if(g)toast(`${g.name}: ${g.members.length} member(s)`)} });
 document.addEventListener('awe:social-refresh',renderSocial);window.__aweSocialRefresh=renderSocial;renderSocial();
}
window.AWESocial={createGroup,createChannel,render:renderSocial,invite};
addEventListener('DOMContentLoaded',()=>setTimeout(bind,300));
})();
