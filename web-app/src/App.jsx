import React from "react";
import { useCharacterEngine } from "./hooks/useCharacterEngine";
import IdentityHeader from "./components/IdentityHeader";
import LifepathSelector from "./components/LifepathSelector";
import LifepathChronology from "./components/LifepathChronology";
import AttributeSelection from "./components/AttributeSelection";
import SkillAllocation from "./components/SkillAllocation";
import PendingLifepath from "./components/PendingLifepath";

function App() {
  const engine = useCharacterEngine();

  if (engine.loading) {
    return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Loading Master Ruleset Assets...</div>;
  }
  if (!engine.rules || !engine.rules.lifepaths) {
    return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Error: Data compilation missing or malformed.</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ lineHeight: '1.2', marginBottom: '20px' }}>Burning Wheel Character Burner</h1>
      
      <IdentityHeader engine={engine} />
      
      <hr style={{ margin: '20px 0', opacity: 0.2 }} />
      
      <LifepathSelector engine={engine} />

      <hr style={{ margin: '30px 0', opacity: 0.2 }} />

      <LifepathChronology engine={engine} />

      <AttributeSelection engine={engine} />

      <SkillAllocation engine={engine} />

      <PendingLifepath engine={engine} />
    </div>
  );
}

export default App;