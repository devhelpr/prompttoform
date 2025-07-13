import { Layout } from './components/templates/Layout';
import { FormGenerator } from './components/molecules/FormGenerator';
import { netlifyTokenHandler } from './utils/netlify-token-handler';

netlifyTokenHandler();

function App() {
  return (
    <Layout>
      <div className="space-y-8">
        <FormGenerator />
      </div>
    </Layout>
  );
}

export default App;
