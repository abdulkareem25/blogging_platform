import "./App.css";
import Toast from "./components/common/Toast";
import AppRoutes from "./router";

function App() {
  return (
    <>
      <AppRoutes />
      <Toast />
    </>
  );
}

export default App;
