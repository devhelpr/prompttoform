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
    // Add triggerDeploy parameter to the current URL for post-authentication restoration
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('triggerDeploy', 'true');

    const redirectUrl = `https://form-generator-worker.maikel-f16.workers.dev/netlify/auth-prompttoform?state=${encodeURIComponent(
      currentUrl.toString()
    )}`;

    window.location.href = redirectUrl;
  }
};
