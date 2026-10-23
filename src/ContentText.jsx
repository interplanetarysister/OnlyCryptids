import React, {useState} from 'react';
import {internalContentLink,contentHash} from './content-links';
import {publicSocialLink,externalShareUrl} from '../base44/functions/cryptid-api/social-links.js';

export function ContentText({text=''}) {
 const pattern=/(https?:\/\/[^\s<>]+|#(?:post|thread|community)=[A-Za-z0-9_.%-]+|@c\/[a-z0-9_]{3,30}|@[A-Za-z0-9_-]{3,30}|#[A-Za-z][A-Za-z0-9_]{0,39})/gi;
 const parts=String(text).split(pattern);
 return <>{parts.map((part,i)=>{
   const trimmed=part.replace(/[.,;!?)]*$/,'');
   const tail=part.slice(trimmed.length);
   if(/^#[A-Za-z][A-Za-z0-9_]{0,39}$/.test(trimmed)){
     return <React.Fragment key={i}><a className="content-link" href={'#tag='+encodeURIComponent(trimmed.slice(1).toLowerCase())}>{trimmed}</a>{tail}</React.Fragment>;
   }
   if(/^@c\/[a-z0-9_]{3,30}$/i.test(trimmed)){
     return <React.Fragment key={i}><a className="content-link" href={'#community-handle='+encodeURIComponent(trimmed.slice(3).toLowerCase())}>{trimmed}</a>{tail}</React.Fragment>;
   }
   if(/^@[A-Za-z0-9_-]{3,30}$/.test(trimmed)){
     return <React.Fragment key={i}><a className="content-link" href={'#member='+encodeURIComponent(trimmed.slice(1).toLowerCase())}>{trimmed}</a>{tail}</React.Fragment>;
   }
   const internal=internalContentLink(trimmed,location.origin);
   if(internal)return <React.Fragment key={i}><a className="content-link" href={internal}>{trimmed}</a>{tail}</React.Fragment>;
   const external=publicSocialLink(trimmed);
   if(external)return <React.Fragment key={i}><a className="content-link" href={external} target="_blank" rel="noopener noreferrer nofollow ugc">{trimmed} ↗</a>{tail}</React.Fragment>;
   return <React.Fragment key={i}>{part}</React.Fragment>;
 })}</>;
}

// Render a local social card. Instagram's personal-account API cannot post on
// users' behalf, so give the user a real picture to share using their own app.
function makeImage(title, link) {
 const canvas=document.createElement('canvas');
 canvas.width=1080;canvas.height=1350;
 const ctx=canvas.getContext('2d');
 if(!ctx)throw new Error('Image sharing is unavailable on this device.');
 const gradient=ctx.createLinearGradient(0,0,1080,1350);
 gradient.addColorStop(0,'#111c17');gradient.addColorStop(1,'#344c36');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1350);
 ctx.strokeStyle='#a9ce8b';ctx.lineWidth=5;ctx.strokeRect(66,65,948,1220);
 ctx.fillStyle='#b9d9a3';ctx.font='bold 58px sans-serif';ctx.fillText('ONLY CRYPTIDS',110,185);
 ctx.font='32px sans-serif';ctx.fillText('FOLLOW THE UNEXPLAINED',112,243);
 ctx.fillStyle='#f0f5ea';ctx.font='bold 69px sans-serif';
 let line='',y=460,count=0;const words=String(title||'Cryptid story').split(/\s+/);
 for(const word of words) {
   const next=line?line+' '+word:word;
   if(ctx.measureText(next).width>845&&line){ctx.fillText(line,110,y);y+=91;line=word;count++;}
   else line=next;
   if(count>=6)break;
 }
 if(line&&count<7)ctx.fillText(line,110,y);
 ctx.fillStyle='#c6d8bf';ctx.font='30px sans-serif';ctx.fillText('Read the full story at Only Cryptids',110,1120);
 ctx.font='24px sans-serif';ctx.fillText(link.slice(0,68),110,1175);
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not prepare the image.')),'image/png'));
}
export function ShareContent({kind,id,title='A story from Only Cryptids'}) {
 const [status,setStatus]=useState('');
 const link=()=>new URL(contentHash(kind,id),window.location.href).href;
 const shareLink=async()=>{
   const url=link();
   if(typeof navigator.share==='function')try{await navigator.share({title,url});setStatus('Share menu opened.');return;}catch(e){if(e?.name==='AbortError')return;}
   try{await navigator.clipboard.writeText(url);setStatus('Link copied. Paste it into your social app.');}
   catch{setStatus('Copy this link: '+url);}
 };
 const shareImage=async()=>{
   setStatus('');
   try {
     const blob=await makeImage(title,link());
     const file=new File([blob],'only-cryptids-story.png',{type:'image/png'});
     if(navigator.canShare?.({files:[file]})&&navigator.share){
       try{await navigator.share({files:[file],title,text:link()});setStatus('Image shared using your device.');return;}
       catch(e){if(e?.name==='AbortError')return;}
     }
     const url=URL.createObjectURL(blob),anchor=document.createElement('a');
     anchor.href=url;anchor.download='only-cryptids-story.png';anchor.click();
     setTimeout(()=>URL.revokeObjectURL(url),1000);
     setStatus('Image saved. Attach it to an Instagram or Facebook post yourself.');
   }catch(e){setStatus(e.message||'Could not generate a share image.');}
 };
 return <div>
   <div className="form-row" aria-label="Share this content">
     <a className="secondary" href={link()} target="_blank" rel="noopener noreferrer">Open shareable link</a>
     <a className="secondary" href={externalShareUrl('facebook',title,link())} target="_blank" rel="noopener noreferrer">Share on Facebook</a>
     <a className="secondary" href={externalShareUrl('reddit',title,link())} target="_blank" rel="noopener noreferrer">Share on Reddit</a>
     <a className="secondary" href={externalShareUrl('x',title,link())} target="_blank" rel="noopener noreferrer">Share on X</a>
     <button type="button" className="secondary" onClick={shareLink}>Share link to YouTube, forums or another app</button>
     <button type="button" className="secondary" onClick={shareImage}>Share picture to Instagram or another app</button>
   </div>
   {status&&<p className="muted" role="status">{status}</p>}
 </div>;
}
