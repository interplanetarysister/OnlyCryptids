import React, { useEffect, useState } from 'react';
import { api, client } from './api';

// The provider performs OAuth. This app never collects Facebook or Instagram passwords,
// handles provider access tokens in the browser, or shares the app operator's grant.
function useMetaAccounts() {
  const [accounts, setAccounts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = async () => {
    setBusy(true); setError('');
    try { setAccounts(await api('meta-status')); }
    catch (e) { setError(e.message || 'Could not check your social accounts.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { refresh(); }, []);
  return { accounts, busy, error, setError, refresh, setBusy };
}

export default function MetaConnections() {
  const { accounts, busy, error, setError, refresh, setBusy } = useMetaAccounts();
  const connect = async (platform) => {
    const account = accounts?.[platform];
    if (!account?.connector_id) {
      setError('Cryptids must finish setting up this provider before members can link accounts.');
      return;
    }
    setBusy(true); setError('');
    try {
      const address = await client.connectors.connectAppUser(account.connector_id);
      const url = new URL(String(address));
      if (url.protocol !== 'https:' || url.username || url.password)
        throw new Error('The provider did not give us a secure authorization page.');
      window.location.assign(url.href);
    } catch (e) {
      setError(e.message || 'The account authorization could not be started.');
      setBusy(false);
    }
  };
  return <section className="panel" aria-label="Social account connections">
    <h2>Facebook &amp; Instagram connections</h2>
    <p>Use your own account. Connecting for publishing is separate from signing in to Cryptids. Only pages and professional profiles approved by the provider can be published to directly.</p>
    {error && <p className="error" role="alert">{error}</p>}
    {!accounts && <p className="muted">Checking connections…</p>}
    {accounts && ['facebook', 'instagram'].map(platform => {
      const item = accounts[platform] || {};
      const title = platform === 'facebook' ? 'Facebook Pages' : 'Instagram Professional';
      return <div className="manage" key={platform}>
        <div>
          <strong>{title}</strong>
          <small>{item.connected ? item.publish_ready ? 'Account verified; the provider checks publication permission when you post' : 'Account verified; publishing is unavailable'
            : item.configured ? 'Not connected or needs reconnection' : 'Member linking not configured yet'}</small>
          {item.username && <small>@{item.username}</small>}
          {Array.isArray(item.pages) && item.pages.length > 0 && <small>Eligible Pages: {item.pages.map(p => p.name).join(', ')}</small>}
          {item.reason && <small>{item.reason}</small>}
        </div>
        <button type="button" className="secondary" disabled={busy || !item.configured} onClick={() => connect(platform)}>
          {item.connected ? 'Reconnect' : 'Connect'}
        </button>
      </div>;
    })}
    <button type="button" className="text-button" onClick={refresh} disabled={busy}>Check connections</button>
    <p className="muted">Personal Instagram accounts can use your device's share menu instead. A login with Facebook does not authorize publishing to Facebook Pages.</p>
  </section>;
}

export function MetaPublisher({ postId }) {
  const { accounts, busy, error, setError, refresh, setBusy } = useMetaAccounts();
  const [facebookPage, setFacebookPage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notice, setNotice] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const post = async (platform) => {
    if (!rightsConfirmed) { setError('Confirm that you have permission to share the content and media.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api('meta-publish', {
        platform, post_id: postId, page_id: facebookPage, image_url: imageUrl, rights_confirmed: rightsConfirmed,
      });
      if (result.status === 'published' && result.success) setNotice('The provider confirmed publication.');
      else setNotice(result.message || 'The provider has not confirmed publication yet.');
    } catch (e) { setError(e.message || 'The provider did not confirm publication.'); }
    finally { setBusy(false); }
  };
  const pages = accounts?.facebook?.pages || [];
  return <details className="panel">
    <summary>Publish on a connected social account</summary>
    <p>Direct publishing uses the social account you authorized in Settings. It never posts to someone else's account. Posting happens only when you press Publish here.</p>
    {error && <p role="alert" className="error">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    <label className="check"><input type="checkbox" checked={rightsConfirmed} onChange={e => setRightsConfirmed(e.target.checked)}/>I have permission to share this post and any image.</label>
    {accounts?.facebook?.publish_ready
      ? <><label>Facebook Page<select value={facebookPage} onChange={e => setFacebookPage(e.target.value)}>
          <option value="">Choose the Page you manage</option>
          {pages.map(page => <option key={page.id} value={page.id}>{page.name}</option>)}
        </select></label>
        <button type="button" className="secondary" disabled={busy || !facebookPage || !rightsConfirmed} onClick={() => post('facebook')}>Publish this post to Facebook Page</button></>
      : <p className="muted">Facebook Page publishing needs a verified member connection with posting permission.</p>}
    {accounts?.instagram?.publish_ready
      ? <><label>Instagram image URL (optional if your post has a public picture)<input type="url" placeholder="https://example.com/image.jpg" value={imageUrl} onChange={e => setImageUrl(e.target.value)} maxLength={1500}/></label>
        <small>Uses a public image already attached to your post when available; otherwise paste its public HTTPS image URL. Only share media you own or have permission to use.</small>
        <button type="button" className="secondary" disabled={busy || !rightsConfirmed} onClick={() => post('instagram')}>Publish image to Instagram</button></>
      : <p className="muted">Instagram API publishing needs a verified Business or Creator account. You can still use the device's Share image option.</p>}
    <button type="button" className="text-button" disabled={busy} onClick={refresh}>Check connections again</button>
  </details>;
}
