import { Layout } from './components/templates/Layout';
import { FormGenerator } from './components/molecules/FormGenerator';

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
