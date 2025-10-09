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
        '✅ Netlify authentication successful, deployment will be triggered'
      );
      // Set a flag to trigger deployment after the page loads
      localStorage.setItem('netlify_trigger_deploy', 'true');
      localStorage.removeItem('netlify_pending_deploy');
    }
  }

  // Handle state parameter to redirect back to the original location
  if (stateParam) {
    try {
      // The state parameter contains the original URL where the user was before authentication
      const originalUrl = decodeURIComponent(stateParam);
      console.log('Redirecting back to original URL:', originalUrl);

      // Clean up URL parameters to avoid infinite redirects
      const cleanUrl = originalUrl.split('?')[0];

      // Use a small delay to ensure the token is processed
      setTimeout(() => {
        window.location.href = cleanUrl;
      }, 100);
    } catch (error) {
      console.error('Error processing state parameter:', error);
    }
  }
};

export const setNetlifySiteId = (siteId: string) => {
  netlifySiteId = siteId;
  document.cookie = `netlify_site_id=${siteId}; path=/; max-age=31536000; secure; samesite=strict`;
};
