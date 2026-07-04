import React from "react";

export default function SkillAllocation({ engine }) {
    const {
        rules,
        character,
        processedLifepathSkills,
        processedGlobalSkills,
        remainingLifepathSkillPoints,
        totalLifepathSkillPoints,
        remainingGeneralPoints,
        totalGeneralPoints,
        skillSearchQuery,
        setSkillSearchQuery,
        selectedSearchSkillKey,
        setSelectedSearchSkillKey,
        searchedSkillsResults,
        adjustSkillPoints,
        availableLifepathSkillsSet
    } = engine;

    return (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              Skills Management
            </h3>

            <div style={{ display: 'flex', gap: '20px', margin: '0 0 20px 0', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', justifyContent: 'center' }}>
              <div>
                <span style={{ color: '#aaa', fontSize: '12px', textTransform: 'uppercase', display: 'block' }}>Lifepath Skill Pool</span>
                <strong style={{ fontSize: '18px'}}>
                  {remainingLifepathSkillPoints} / {totalLifepathSkillPoints} pts
                </strong>
              </div>
              <div style={{ borderLeft: '1px solid #444', paddingLeft: '20px' }}>
                <span style={{ color: '#aaa', fontSize: '12px', textTransform: 'uppercase', display: 'block' }}>General Skill Pool</span>
                <strong style={{ fontSize: '18px'}}>{remainingGeneralPoints} / {totalGeneralPoints} pts</strong>
              </div>
            </div>

            <div style={{ 
              marginBottom: '30px', 
              padding: '15px', 
              backgroundColor: 'rgba(255,255,255,0.01)', 
              border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: '6px' 
            }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#ccc', marginBottom: '8px' }}>
                Open General Skills from Rulebook Registry
              </label>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input 
                    type="text"
                    placeholder="Type to search skills... (e.g., Mending, Sewing)"
                    value={skillSearchQuery}
                    onChange={(e) => {
                      setSkillSearchQuery(e.target.value);
                      setSelectedSearchSkillKey(""); 
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      backgroundColor: '#111', 
                      border: '1px solid #444', 
                      borderRadius: '6px', 
                      color: '#fff', 
                      boxSizing: 'border-box' 
                    }}
                  />

                  {searchedSkillsResults.length > 0 && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0, 
                      right: 0, 
                      backgroundColor: '#151515', 
                      border: '1px solid #333', 
                      borderRadius: '0 0 6px 6px', 
                      maxHeight: '180px', 
                      overflowY: 'auto', 
                      zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                      {searchedSkillsResults.map((sk) => {
                        const isCurrentlySelected = selectedSearchSkillKey === sk.key;
                        return (
                          <div 
                            key={sk.key} 
                            onClick={() => {
                              setSelectedSearchSkillKey(sk.key);
                              setSkillSearchQuery(sk.name); 
                            }}
                            style={{ 
                              padding: '10px 15px', 
                              cursor: 'pointer', 
                              backgroundColor: isCurrentlySelected ? '#0070f3' : 'transparent',
                              color: isCurrentlySelected ? '#fff' : '#aaa',
                              borderBottom: '1px solid #222',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span style={{ fontWeight: 'bold' }}>{sk.name}</span>
                            <span style={{ fontSize: '10px', opacity: 0.6 }}>Roots: {(sk.roots || []).join('/')}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  disabled={!selectedSearchSkillKey || remainingGeneralPoints <= 0}
                  onClick={() => {
                    adjustSkillPoints(selectedSearchSkillKey, 'inc');
                    setSkillSearchQuery("");
                    setSelectedSearchSkillKey("");
                  }}
                  style={{ 
                    padding: '0 20px', 
                    backgroundColor: (selectedSearchSkillKey && remainingGeneralPoints > 0) ? '#0070f3' : '#333', 
                    color: '#000', 
                    fontWeight: 'bold', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: (selectedSearchSkillKey && remainingGeneralPoints > 0) ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Add Skill
                </button>
              </div>

              {selectedSearchSkillKey && remainingGeneralPoints <= 0 && (
                <p style={{ color: '#ff4d4d', fontSize: '12px', margin: '8px 0 0 0' }}>
                  Insufficient General Skill Points to open this skill.
                </p>
              )}
            </div>

            {processedLifepathSkills.length + processedGlobalSkills.length === 0 ? (
              <p style={{ color: '#555', fontStyle: 'italic', fontSize: '14px' }}>
                No skills found in your current lifepath choices.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {[...processedLifepathSkills, ...processedGlobalSkills].map((skill) => {
                  const canMinus = skill.allocatedBonus > 0;
                  const isGeneralChoice = !availableLifepathSkillsSet.has(skill.key);
                  const canPlus = isGeneralChoice 
                    ? remainingGeneralPoints > 0 
                    : remainingLifepathSkillPoints > 0;

                  return (
                    <div 
                      key={skill.key} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px 15px', 
                        backgroundColor: skill.isOpened ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.01)', 
                        borderRadius: '6px',
                        borderLeft: skill.isOpened ? '4px solid #444' : '4px solid #aaa',
                        opacity: skill.isOpened ? 1 : 0.6,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '16px', color: skill.isOpened ? '#fff' : '#aaa' }}>
                          {skill.name}
                        </strong>
                        <span style={{ display: 'block', fontSize: '11px', color: '#555', marginTop: '2px' }}>
                          Roots: {skill.roots} {skill.isAutoOpen && <span style={{ color: '#444', fontStyle: 'italic' }}>(Opened by Lifepath)</span>}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            disabled={!canMinus}
                            onClick={() => adjustSkillPoints(skill.key, 'dec')}
                            style={{ 
                              width: '24px', height: '24px', cursor: canMinus ? 'pointer' : 'not-allowed', 
                              backgroundColor: '#222', color: canMinus ? '#fff' : '#444', border: '1px solid #444', borderRadius: '4px' 
                            }}
                          >
                            -
                          </button>
                          <button 
                            disabled={!canPlus}
                            onClick={() => adjustSkillPoints(skill.key, 'inc')}
                            style={{ 
                              width: '24px', height: '24px', cursor: remainingLifepathSkillPoints > 0 ? 'pointer' : 'not-allowed', 
                              backgroundColor: '#222', color: remainingLifepathSkillPoints > 0 ? '#fff' : '#444', border: '1px solid #444', borderRadius: '4px' 
                            }}
                          >
                            +
                          </button>
                        </div>

                        <div style={{ textAlign: 'center', minWidth: '40px' }}>
                          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#555' }}>
                            {skill.isOpened ? `B${skill.exponent}` : '---'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
    );
}