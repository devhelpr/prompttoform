import {
  netlifyAccessToken,
  netlifySiteId,
  setNetlifySiteId,
} from './netlify-token-handler';

export const deployWithNetlify = (json: string) => {
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
        zipContents: new Buffer(json).toString('base64'),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Deployment response:', data);
        alert('Deployment successful!');
        if (data.siteId) {
          setNetlifySiteId(data.siteId);
        }
      })
      .catch((error) => {
        console.error('Error during deployment:', error);
        alert('Deployment failed: ' + error.message);
      });
  } else {
    const redirectUrl = `https://form-generator-worker.maikel-f16.workers.dev/netlify/auth-prompttoform?state=${window.location.href}`;

    window.location.href = redirectUrl;
  }
};
