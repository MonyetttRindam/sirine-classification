import { useEffect, useState } from "react";
import Nav from "./components/Nav.jsx";
import Landing from "./screens/Landing.jsx";
import Classify from "./screens/Classify.jsx";
import Dashboard from "./screens/Dashboard.jsx";
import { SEED_HISTORY } from "./data.js";
import { checkHealth } from "./api.js";

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [tab, setTab] = useState("upload");
  const [online, setOnline] = useState(false);
  const [history, setHistory] = useState(SEED_HISTORY);

  useEffect(() => {
    checkHealth().then((h) => setOnline(h.online));
  }, []);

  function go(nextScreen, nextTab) {
    setScreen(nextScreen);
    if (nextTab) setTab(nextTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onClassified(entry) {
    setHistory((h) => [entry, ...h].slice(0, 20));
  }

  return (
    <>
      <Nav screen={screen} go={go} />
      {screen === "landing" && <Landing go={go} />}
      {screen === "classify" && <Classify initialTab={tab} online={online} onClassified={onClassified} />}
      {screen === "dashboard" && <Dashboard history={history} />}
    </>
  );
}
