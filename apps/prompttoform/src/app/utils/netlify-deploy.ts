import {
  netlifyAccessToken,
  netlifySiteId,
  setNetlifySiteId,
} from './netlify-token-handler';

export const deployWithNetlify = (
  json: string,
  onSetSiteUrl: (siteUrl: string) => void,
  onSuccess?: () => void,
  onError?: (error: string) => void
) => {
  //const redirectUrl = `https://localhost:8787/netlify/code-flow-canvas`;
  if (netlifyAccessToken) {
    const postUrl =
      'https://form-generator-worker.maikel-f16.workers.dev/netlify/deploy-form-preview';
    fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        netlifyAccessToken: netlifyAccessToken,
        netlifySiteId: netlifySiteId,
        zipContents: json,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Deployment response:', data);
        if (data.siteId) {
          setNetlifySiteId(data.siteId);
        }
        if (data.siteUrl) {
          onSetSiteUrl(data.siteUrl);
        }
        onSuccess?.();
      })
      .catch((error) => {
        console.error('Error during deployment:', error);
        onError?.(error.message);
      });
  } else {
    // Store a flag to trigger deployment after authentication
    localStorage.setItem('netlify_pending_deploy', 'true');
    // Store the current timestamp to ensure we only trigger for recent authentication
    localStorage.setItem('netlify_auth_timestamp', Date.now().toString());

    const redirectUrl = `https://form-generator-worker.maikel-f16.workers.dev/netlify/auth-prompttoform?state=${window.location.href}`;

    window.location.href = redirectUrl;
  }
};
