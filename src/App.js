import './App.css';
import './styles/layout-desktop.css';
import './styles/layout-mobile.css';
import AppRoutes from './routes/AppRoutes';
import './styles/design-system.css';

function App() {
  const isRedesignedExperience = (process.env.REACT_APP_ABTEST || '').trim().toLowerCase() === 'b';

  if (!isRedesignedExperience) {
    return <AppRoutes />;
  }

  return (
    <div className="app-shell--b apex-theme">
      <AppRoutes />
    </div>
  );
}

export default App;
