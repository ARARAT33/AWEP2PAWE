(()=>{'use strict';
/* UI safety net: keeps the static app interactive if an optional runtime module fails. */
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const toast=m=>{const e=q('#toast');if(!e)return;e.textContent=m;e.classList.add('show');clearTimeout(window.__uiToast);window.__uiToast=setTimeout(()=>e.classList.remove('show'),2200)};
const stateKey='AWEP2PAWE_STATE_V11';
const read=()=>{try{return JSON.parse(localStorage.getItem(stateKey)||'{}')}catch{return {}}};
const write=s=>localStorage.setItem(stateKey,JSON.stringify(s));
const validUid=v=>/^AWE-[A-Z0-9]{8,}$/.test(String(v||'').trim().toUpperCase());
function view(name){qa('.view').forEach(v=>v.classList.toggle('active-view',v.id==='view-'+name));qa('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
function copy(v){if(!v)return;Promise.resolve(navigator.clipboard?.writeText(v)).then(()=>toast('Copied')).catch(()=>{prompt('Copy',v)})}
function ensureUid(){const s=read();if(s.uid){q('#identity-id')&&(q('#identity-id').textContent=s.uid);q('#settings-id')&&(q('#settings-id').textContent=s.uid);return s.uid}return ''}
function openUid(){const uid=prompt('Enter AWE UID');if(!uid)return;const v=uid.trim().toUpperCase();if(!validUid(v)){toast('Invalid AWE UID');return}const s=read();s.chats=Array.isArray(s.chats)?s.chats:[];let c=s.chats.find(x=>x.peer===v);if(!c){c={id:crypto.randomUUID(),peer:v,name:v,type:'direct',messages:[],unread:0,last:'New conversation',updated:Date.now()};s.chats.unshift(c);s.contacts=Array.isArray(s.contacts)?s.contacts:[];if(!s.contacts.some(x=>x.uid===v))s.contacts.unshift({uid:v,name:v});write(s)}view('chats');setTimeout(()=>{const row=q(`[data-chat="${CSS.escape(c.id)}"]`);row?.click();},0);toast('Chat opened locally')}
function bind(){
 qa('[data-view]').forEach(b=>{if(b.dataset.uiRecovery)return;b.dataset.uiRecovery='1';b.addEventListener('click',()=>view(b.dataset.view))});
 q('#copy-uid')?.addEventListener('click',()=>copy(ensureUid()));q('#copy-uid-2')?.addEventListener('click',()=>copy(ensureUid()));
 q('#new-chat')?.addEventListener('click',openUid);q('#new-chat-2')?.addEventListener('click',openUid);
 q('#back-chats')?.addEventListener('click',()=>{q('#conversation-content')?.classList.add('hidden');q('#conversation-empty')?.classList.remove('hidden')});
 q('#theme-light')?.addEventListener('click',()=>{document.body.className='light';const s=read();s.theme='light';write(s)});q('#theme-dark')?.addEventListener('click',()=>{document.body.className='dark';const s=read();s.theme='dark';write(s)});
 q('#global-search')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();q('#search-go')?.click()}});
 q('#search-go')?.addEventListener('click',()=>{const x=q('#global-search')?.value.trim();if(!x)return;if(validUid(x)){openUid();return}const s=read(),r=(s.resources||[]).find(v=>v.id?.toLowerCase()===x.toLowerCase());if(r){view('resources');toast('Resource found')}else toast('ID not found on this device')});
 q('#id-close')?.addEventListener('click',()=>q('#id-dialog')?.close());q('#id-copy')?.addEventListener('click',()=>copy(q('#id-value')?.value));
 q('#signal-close')?.addEventListener('click',()=>q('#signal-dialog')?.close());
 q('#chat-menu-close')?.addEventListener('click',()=>q('#chat-menu-dialog')?.close());
 q('#call-close')?.addEventListener('click',()=>q('#call-overlay')?.classList.add('hidden'));q('#call-hangup')?.addEventListener('click',()=>q('#call-overlay')?.classList.add('hidden'));
 ensureUid();
}
addEventListener('DOMContentLoaded',()=>setTimeout(bind,0),{once:true});
})();
