import { Layout } from './components/templates/Layout';
import { FormGenerator } from './components/molecules/FormGenerator';
import { netlifyTokenHandler } from './utils/netlify-token-handler';
import { loadFormJsonFromLocalStorage } from './utils/local-storage';

netlifyTokenHandler();
let triggerDeploy = false;

if (
  window.location.search.includes('state') &&
  window.location.search.includes('access_token') &&
  window.location.search.includes('provider')
) {
  triggerDeploy = true;
}

const formJson = loadFormJsonFromLocalStorage();
function App() {
  return (
    <Layout>
      <div className="space-y-8">
        <FormGenerator
          formJson={formJson || ''}
          triggerDeploy={triggerDeploy}
        />
      </div>
    </Layout>
  );
}

export default App;
