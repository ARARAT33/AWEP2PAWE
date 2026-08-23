/* Static runtime compatibility fixes. */
window.addEventListener('DOMContentLoaded',()=>{
  const box=document.querySelector('#invite-input');
  const btn=document.querySelector('#connect-uid');
  if(!box||!btn)return;
  btn.onclick=async()=>{
    const packet=box.value.trim();
    if(!packet){toast('Առաջին կապի փաթեթը պետք է տեղադրել');return}
    try{
      const x=JSON.parse(atob(packet));
      if(x.reply){if(window.acceptAnswer)await window.acceptAnswer(packet);else toast('Պատասխանի մշակումը հասանելի չէ');}
      else if(window.acceptInvite)await window.acceptInvite(packet);
    }catch{toast('Կապի փաթեթը սխալ է')}
  };
});