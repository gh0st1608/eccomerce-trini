import { AppProviders } from './presentation/providers/AppProviders'
import { AppRouter } from './presentation/routes/AppRouter'

function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}

export default App
