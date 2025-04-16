import { Layout } from './components/templates/Layout'
import { OCIFGenerator } from './components/molecules/OCIFGenerator'

function App() {
  return (
    <Layout>
      <div className="space-y-8">
        <OCIFGenerator />
      </div>
    </Layout>
  )
}

export default App
