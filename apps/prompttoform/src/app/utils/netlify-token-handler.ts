export let netlifyAccessToken = '';
export let netlifySiteId = '';

export const netlifyTokenHandler = () => {
  const siteId = document.cookie
    .split('; ')
    .find((row) => row.startsWith('netlify_site_id='))
    ?.split('=')[1];
  if (siteId) {
    netlifySiteId = siteId;
  }

  const accessToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('netlify_access_token='))
    ?.split('=')[1];
  if (accessToken) {
    netlifyAccessToken = accessToken;
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('access_token');
    if (tokenFromUrl) {
      netlifyAccessToken = tokenFromUrl;
      document.cookie = `netlify_access_token=${tokenFromUrl}; path=/; max-age=31536000; secure; samesite=strict`;
    }
  }
  console.log('Netlify Access Token:', netlifyAccessToken);
};

export const handleNetlifyRedirect = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const stateParam = urlParams.get('state');
  const accessToken = urlParams.get('access_token');

  console.log('Netlify redirect detected:', {
    stateParam,
    accessToken: !!accessToken,
  });

  // Process the token if present
  if (accessToken) {
    netlifyTokenHandler();

    // Check if we need to trigger deployment after authentication
    const pendingDeploy = localStorage.getItem('netlify_pending_deploy');
    if (pendingDeploy === 'true') {
      console.log(
        '✅ Netlify authentication successful, switching to editor view'
      );
      // Set a flag to trigger view transition and deployment after the page loads
      localStorage.setItem('netlify_trigger_editor', 'true');
      localStorage.removeItem('netlify_pending_deploy');
    }
  }
};

export const setNetlifySiteId = (siteId: string) => {
  netlifySiteId = siteId;
  document.cookie = `netlify_site_id=${siteId}; path=/; max-age=31536000; secure; samesite=strict`;
};
