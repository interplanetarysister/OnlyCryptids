import {createClient} from '@base44/sdk';
const id=import.meta.env.VITE_BASE44_APP_ID;
export const configured=Boolean(id);
export const client=id?createClient({appId:id}):null;
export async function api(action,payload={}){
 if(!client)throw new Error('The preview is not connected to Base44 yet. Sign-in and publishing will be available after setup.');
 try{const result=await client.functions.invoke('cryptid-api',{action,...payload});const value=result.data??result;if(value.error)throw new Error(value.error);return value;}
 catch(error){throw new Error(error.response?.data?.error||error.message||'Unable to complete that action. Please try again.');}
}
