declare global {
  interface Window {
    flowdesk: {
      ping: () => string;
    };
  }
}

function App() {
  return (
    <div>
      <h1>Flowdesk</h1>
      <p>{window.flowdesk.ping()}</p>
    </div>
  )
}

export default App;