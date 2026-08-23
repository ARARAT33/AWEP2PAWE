(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const toast=t=>{let x=q('#toast');if(!x){x=document.createElement('div');x.id='toast';x.className='toast';document.body.append(x)}x.textContent=t;x.classList.add('show');clearTimeout(window.__awet);window.__awet=setTimeout(()=>x.classList.remove('show'),1800)};
const setView=v=>{qa('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===v));qa('.view').forEach(x=>x.classList.toggle('active-view',x.id==='view-'+v));qa('.mobile-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));};
function init(){
 document.body.classList.remove('dark');document.body.classList.add('light');
 const s=q('#global-search');
 if(s){const run=()=>{const v=s.value.trim();if(!v)return;const low=v.toLowerCase();const resource=/^(fid|pfid|sid|psid)[:_]/.test(low);if(resource){setView('resources');toast('Resource ID detected');return;}const id=v;const list=q('#chat-items');if(list){const row=document.createElement('button');row.className='chat-row selected';row.dataset.chat=id;row.innerHTML=`<span class="avatar blue">${(id[0]||'A').toUpperCase()}</span><span class="chat-meta"><strong>${id}</strong><small>AWE UID • ready for P2P connection</small></span><time>now</time>`;list.prepend(row);row.onclick=()=>{setView('chats');q('#conversation-name').textContent=id};}setView('chats');q('#conversation-name').textContent=id;toast('AWE UID opened');};s.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run()}});q('.search')?.addEventListener('click',()=>s.focus());}
 qa('.nav-item').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
 qa('.theme').forEach(b=>b.addEventListener('click',()=>{const light=b.dataset.theme==='light';document.body.classList.toggle('light',light);document.body.classList.toggle('dark',!light);localStorage.setItem('awe_theme',light?'light':'dark');qa('.theme').forEach(x=>x.classList.toggle('active',x===b));}));
 const pick=q('#pick-file'),file=q('#file-input');pick?.addEventListener('click',()=>file?.click());
 file?.addEventListener('change',()=>{const list=q('#file-list');if(!list)return;list.innerHTML='';[...file.files].forEach(f=>{const row=document.createElement('div');row.className='file-item';row.innerHTML=`<span>📄</span><div><strong>${f.name}</strong><small>${(f.size/1048576).toFixed(2)} MB • local</small></div><button class="ghost" type="button">Create FID</button>`;row.querySelector('button').onclick=async()=>{const h=await crypto.subtle.digest('SHA-256',await f.arrayBuffer()),id='fid_'+[...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,32);navigator.clipboard?.writeText(id);toast('FID created and copied');};list.append(row)});});
 if(!q('.mobile-nav')){const n=document.createElement('nav');n.className='mobile-nav';n.innerHTML='<button data-view="chats">💬<span>Chats</span></button><button data-view="contacts">👥<span>People</span></button><button data-view="resources">◈<span>IDs</span></button><button data-view="calls">☎<span>Calls</span></button><button data-view="settings">⚙<span>Settings</span></button>';document.body.append(n);qa('.mobile-nav button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));}
 setView('chats');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
