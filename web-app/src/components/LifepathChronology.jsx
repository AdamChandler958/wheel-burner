import React from "react";

export default function LifepathChronology({ engine }) {
    const {
        totalYears,
        totalResources,
        finalMentalPool,
        finalPhysicalPool,
        character
    } = engine;
    return (
        <div style={{ 
                    background: 'transparent', 
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '20px', 
                    borderRadius: '8px',
                    marginTop: '30px'
                  }}>
                <h2>{character.name || "Unnamed Concept"}</h2>
                <p><strong>Total Age:</strong> {totalYears} years | <strong>Resource Pool:</strong> {totalResources} rps | <strong>Mental Pool:</strong> {finalMentalPool} | <strong>Physical Pool:</strong> {finalPhysicalPool} </p>
                <hr></hr>
                
                <h3>Chosen Lifepaths Chronology</h3>
                  {character.chosenLifepaths.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>
                      No lifepaths selected yet. Use the configuration selectors above to burn paths.
                    </p>
                  ) : (
                    <ol style={{ paddingLeft: '20px' }}>
                      {character.chosenLifepaths.map((lp, index) => {
                        
                        const formattedStock = lp.stock.charAt(0).toUpperCase() + lp.stock.slice(1);
        
                        const cleanSetting = lp.setting.replace('_setting', '');
                        const formattedSetting = cleanSetting.charAt(0).toUpperCase() + cleanSetting.slice(1);
        
                        return (
                          <li key={index} style={{ marginBottom: '10px' }}>
                            <strong>{lp.name}</strong> 
                            <span style={{ color: '#888', fontSize: '14px' }}> 
                              {' '}({formattedStock} — {formattedSetting}) | Time: {lp.time} yrs
                            </span>
                            <button 
                              onClick={() => removeLifepath(index)}
                              style={{ 
                                marginLeft: '15px', 
                                color: '#ff4d4d', 
                                border: 'none', 
                                background: 'none', 
                                cursor: 'pointer', 
                                fontSize: '12px' 
                              }}
                            >
                              [Remove]
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  )}
              </div>
    );
}