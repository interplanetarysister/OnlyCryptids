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


/** An explicit owner-only batch. Each item passes the same server-side account
 * and post-ownership checks as the single-post publish path. */
export function BulkMetaPublisher({ posts = [] }) {
  const { accounts, busy: checking, error: connectionError, refresh } = useMetaAccounts();
  const [selection, setSelection] = useState([]);
  const [platform, setPlatform] = useState('facebook');
  const [pageId, setPageId] = useState('');
  const [approved, setApproved] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const eligible = posts.filter(p => p?.id && p.status === 'published');
  const selectedPosts = eligible.filter(p => selection.includes(p.id));
  const ready = Boolean(accounts?.[platform]?.publish_ready);
  const pageOptions = accounts?.facebook?.pages || [];
  const toggle = (id) => {
    setResults([]);
    setApproved(false);
    setSelection(previous => previous.includes(id) ? previous.filter(value => value !== id)
      : previous.length < 10 ? [...previous, id] : previous);
  };
  const publishSelected = async () => {
    if (running || checking || !ready || !approved || !selectedPosts.length) return;
    if (selectedPosts.length > 10) return;
    if (platform === 'facebook' && !pageOptions.some(p => p.id === pageId)) return;
    if (!window.confirm('Publish ' + selectedPosts.length + ' selected post(s) to this ' +
      (platform === 'facebook' ? 'Facebook Page' : 'Instagram professional account') +
      '? Only provider-confirmed items will count as published.')) return;
    setRunning(true);
    setResults([]);
    const report = [];
    for (const post of selectedPosts) {
      try {
        const response = await api('meta-publish', {
          platform, post_id: post.id, page_id: pageId, rights_confirmed: true,
        });
        const outcome = response?.success === true && response?.status === 'published'
          ? 'Published' : response?.status === 'processing' ? 'Still processing'
          : response?.status === 'uncertain' ? 'Uncertain; check provider'
          : 'Not published';
        report.push({ id: post.id, title: post.title, outcome, message: response?.message || '' });
      } catch (error) {
        report.push({ id: post.id, title: post.title, outcome: 'Not confirmed', message: error?.message || 'Check the provider.' });
      }
      setResults([...report]);
    }
    setRunning(false);
    setApproved(false);
  };
  return <section className="panel" aria-label="Bulk social publishing">
    <h3>Bulk actions: publish your posts</h3>
    <p>Select up to 10 of your published posts and one connected destination. Nothing is sent until you confirm. Each item is checked separately, and failed posts are not marked successful.</p>
    {connectionError && <p role="alert" className="error">{connectionError}</p>}
    {eligible.length === 0 && <p className="muted">Publish your first post to use bulk actions.</p>}
    {eligible.length > 0 && <>
      <div className="form-row">
        <button type="button" className="secondary" disabled={running} onClick={() => {setSelection(eligible.slice(0,10).map(p => p.id));setApproved(false);setResults([]);}}>Select first 10</button>
        <button type="button" className="secondary" disabled={running} onClick={() => {setSelection([]);setApproved(false);setResults([]);}}>Clear selection</button>
      </div>
      <div className="bulk-post-list" style={{maxHeight:240,overflowY:'auto'}}>
        {eligible.map(post => <label key={post.id} className="check">
          <input type="checkbox" checked={selection.includes(post.id)} disabled={running || (!selection.includes(post.id) && selection.length >= 10)}
            onChange={() => toggle(post.id)}/><span>{post.title || 'Untitled post'}</span>
        </label>)}
      </div>
      <p className="muted">{selection.length} of 10 posts selected</p>
      <label>Destination
        <select value={platform} disabled={running} onChange={e => {setPlatform(e.target.value);setPageId('');setApproved(false);setResults([]);}}>
          <option value="facebook">Facebook Page</option><option value="instagram">Instagram professional account</option>
        </select>
      </label>
      {platform === 'facebook' && ready && <label>Page
        <select value={pageId} disabled={running} onChange={e => {setPageId(e.target.value);setApproved(false);}}>
          <option value="">Select one of your authorized Pages</option>
          {pageOptions.map(page => <option key={page.id} value={page.id}>{page.name}</option>)}
        </select>
      </label>}
      {!ready && <p className="muted">This destination is not ready for direct publishing. Connect and verify it in Settings. Bulk publishing remains disabled until then.</p>}
      {platform === 'instagram' && <p className="muted">Each selected post must have a public image attached. Text-only posts will be reported as not published.</p>}
      <label className="check"><input type="checkbox" disabled={running} checked={approved} onChange={e => setApproved(e.target.checked)}/>
        I have permission to share every selected post and its attached media, and authorize this batch.
      </label>
      <button type="button" className="primary" disabled={running || checking || !ready || !approved || !selection.length || (platform === 'facebook' && !pageId)}
        onClick={publishSelected}>{running ? 'Publishing selected posts…' : 'Publish '+selection.length+' selected post(s)'}</button>
      <button type="button" className="text-button" disabled={running || checking} onClick={refresh}>Check connection</button>
    </>}
    {results.length > 0 && <div role="status" aria-live="polite">
      <strong>Batch results: {results.filter(r => r.outcome === 'Published').length} confirmed, {results.length - results.filter(r => r.outcome === 'Published').length} not confirmed or pending</strong>
      <ul>{results.map(r => <li key={r.id}>{r.title}: {r.outcome}{r.message ? ' — '+r.message : ''}</li>)}</ul>
    </div>}
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
