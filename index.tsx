import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- Animated Solar System Background Component ---
const SolarSystemBackground = ({ isAnimating }) => {
  const starCount = 100;
  const stars = useMemo(() => {
    return Array.from({ length: starCount }).map((_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 2 + 1}px`,
        animationDuration: `${Math.random() * 2 + 1.5}s`,
        animationDelay: `${Math.random() * 3}s`,
    }));
  }, []);

  const styles = {
    backgroundContainer: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      overflow: 'hidden',
      background: 'radial-gradient(ellipse at center, #1b2735 0%, #090a0f 100%)',
    },
    star: {
        position: 'absolute' as const,
        backgroundColor: '#ffffff',
        borderRadius: '50%',
        animationName: 'twinkle',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        boxShadow: '0 0 4px #fff, 0 0 6px #fff',
    },
    planetIcon: {
        position: 'absolute' as const,
        top: '30px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.7)',
    },
    earthIcon: {
        left: '30px',
        background: 'radial-gradient(circle at 30% 30%, #a2c2e8, #4a76b8, #1a3b73)',
    },
    marsIcon: {
        right: '30px',
        background: 'radial-gradient(circle at 70% 70%, #ff8a73, #c7452c, #8c2d1e)',
    },
    rocket: {
        position: 'absolute' as const,
        top: '55px',
        left: '80px',
        width: '10px',
        height: '25px',
        opacity: isAnimating ? 1 : 0,
        transform: 'rotate(10deg)',
        animation: isAnimating ? 'fly-to-mars 2s ease-in-out forwards' : 'none',
        transition: 'opacity 0.2s linear',
    },
    rocketBody: {
      width: '100%',
      height: '100%',
      backgroundColor: '#e0e0e0',
      borderRadius: '50% 50% 5px 5px',
      boxShadow: '0 0 6px #fff',
    },
    rocketFlame: {
        position: 'absolute' as const,
        bottom: '-18px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '0',
        height: '0',
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: '18px solid #ff4500',
        filter: 'blur(4px)',
        animationName: isAnimating ? 'flame-flicker' : 'none',
        animationDuration: '0.1s',
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
    }
  };

  const keyframes = `
    @keyframes fly-to-mars {
      from {
        transform: translateX(0) rotate(10deg);
      }
      to {
        transform: translateX(calc(100vw - 200px)) rotate(10deg);
      }
    }
    @keyframes flame-flicker {
      from { 
        border-top-color: #ff4500; 
        transform: translateX(-50%) scaleY(1);
        opacity: 1;
      }
      to { 
        border-top-color: #ffd700;
        transform: translateX(-50%) scaleY(1.3);
        opacity: 0.8;
      }
    }
    @keyframes twinkle {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
    }
  `;

  return (
    <div style={styles.backgroundContainer}>
      <style>{keyframes}</style>
      
      {stars.map(star => (
        <div
            key={star.id}
            style={{
                ...styles.star,
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                animationDuration: star.animationDuration,
                animationDelay: star.animationDelay,
            }}
        />
      ))}

      <div style={{ ...styles.planetIcon, ...styles.earthIcon }} aria-label="Earth"></div>
      <div style={{ ...styles.planetIcon, ...styles.marsIcon }} aria-label="Mars"></div>

      <div style={styles.rocket}>
          <div style={styles.rocketBody}></div>
          <div style={styles.rocketFlame}></div>
      </div>
    </div>
  );
};


const App = () => {
  // State management for the application
  const [trashType, setTrashType] = useState('Plastic');
  const [customTrash, setCustomTrash] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  // Function to call the Gemini API
  const getRecyclingSuggestion = async () => {
    setIsLoading(true);
    setError('');
    setSuggestion(null);

    const itemToProcess = trashType === 'Other' ? customTrash : trashType;

    if (!itemToProcess) {
        setError('Please specify a trash item.');
        setIsLoading(false);
        return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Provide an innovative recycling method and a potential reuse for this type of space trash on a Mars colony: ${itemToProcess}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recyclingMethod: {
                type: Type.STRING,
                description: "A concise, step-by-step recycling or reprocessing method suitable for a Martian environment."
              },
              reusePotential: {
                type: Type.STRING,
                description: "A creative and practical idea for reusing the processed material on Mars."
              }
            },
            required: ["recyclingMethod", "reusePotential"]
          },
          systemInstruction: "You are an AI assistant for astronauts on Mars specializing in waste management and resource optimization. Your suggestions must be scientifically plausible and practical for a space colony.",
        },
      });
      
      const parsedResponse = JSON.parse(response.text);
      setSuggestion(parsedResponse);

    } catch (err) {
      console.error("Error fetching suggestion:", err);
      setError("Failed to get suggestion. The AI might be busy calibrating its Martian dust filters. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- STYLES ---
  const styles = {
    appWrapper: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
    },
    container: {
      maxWidth: '700px',
      width: '100%',
      padding: '30px',
      fontFamily: "'Orbitron', sans-serif",
      textAlign: 'center' as const,
      border: '1px solid rgba(0, 195, 255, 0.6)',
      borderRadius: '15px',
      backgroundColor: 'rgba(10, 25, 47, 0.75)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 0 25px rgba(0, 195, 255, 0.5)',
      position: 'relative' as const,
      zIndex: 1,
    },
    header: {
      color: '#00ffc3',
      textShadow: '0 0 10px #00ffc3',
      animation: 'textGlow 1.5s infinite alternate',
    },
    subtitle: {
        color: '#e0e0e0',
        fontFamily: "'Roboto', sans-serif",
        fontWeight: 300,
        marginBottom: '30px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '20px',
        alignItems: 'center',
        marginBottom: '30px',
    },
    select: {
        padding: '10px',
        width: '80%',
        backgroundColor: '#0a192f',
        color: '#e0e0e0',
        border: '1px solid #00c3ff',
        borderRadius: '5px',
        fontFamily: "'Orbitron', sans-serif",
    },
    input: {
        padding: '10px',
        width: 'calc(80% - 22px)',
        backgroundColor: '#0a192f',
        color: '#e0e0e0',
        border: '1px solid #00c3ff',
        borderRadius: '5px',
        fontFamily: "'Roboto', sans-serif",
    },
    button: {
        padding: '12px 25px',
        backgroundColor: 'transparent',
        color: '#00ffc3',
        border: '2px solid #00ffc3',
        borderRadius: '5px',
        cursor: 'pointer',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '1rem',
        transition: 'all 0.3s ease',
        boxShadow: '0 0 10px rgba(0, 255, 195, 0.3)',
        outline: 'none',
    },
    buttonHover: {
        backgroundColor: '#00ffc3',
        color: '#0a0a1a',
        boxShadow: '0 0 25px rgba(0, 255, 195, 0.8), 0 0 10px rgba(0, 255, 195, 0.5) inset',
        transform: 'scale(1.05)',
    },
    resultCard: {
        marginTop: '20px',
        padding: '20px',
        border: '1px solid #00c3ff',
        borderRadius: '10px',
        backgroundColor: 'rgba(10, 25, 47, 0.9)',
        textAlign: 'left' as const,
        animation: 'fadeIn 0.5s ease-in-out',
    },
    resultTitle: {
        color: '#00ffc3',
        borderBottom: '1px solid #00c3ff',
        paddingBottom: '10px',
        marginBottom: '15px',
    },
    resultText: {
        fontFamily: "'Roboto', sans-serif",
        lineHeight: '1.6',
        color: '#e0e0e0',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
        gap: '15px',
        margin: '20px 0',
    },
    spinner: {
        border: '4px solid rgba(0, 195, 255, 0.2)',
        borderLeftColor: '#00ffc3',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'formSpinner 1s linear infinite',
    },
    loadingText: {
        color: '#00c3ff',
    },
    errorText: {
        color: '#ff4d4d',
        fontFamily: "'Roboto', sans-serif",
    },
    keyframes: `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes textGlow {
            from { text-shadow: 0 0 10px #00ffc3, 0 0 15px #00ffc3; }
            to { text-shadow: 0 0 15px #00c3ff, 0 0 20px #00c3ff; }
        }
        @keyframes formSpinner {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `
  };

  return (
    <div style={styles.appWrapper}>
      <style>{styles.keyframes}</style>
      <SolarSystemBackground isAnimating={isLoading} />
      <div style={styles.container}>
        <h1 style={styles.header}>SpaceTrash Hack</h1>
        <p style={styles.subtitle}>Martian Waste Repurposing Initiative</p>
        
        <div style={styles.form}>
          <label htmlFor="trash-type" style={{ alignSelf: 'flex-start', marginLeft: '10%', marginBottom: '-10px', color: '#00c3ff' }}>Select Trash Type:</label>
          <select 
            id="trash-type"
            value={trashType} 
            onChange={(e) => setTrashType(e.target.value)}
            style={styles.select}
            aria-label="Select trash type"
          >
            <option>Plastic</option>
            <option>Metal</option>
            <option>Organic</option>
            <option>Electronic</option>
            <option>Other</option>
          </select>
          
          {trashType === 'Other' && (
            <input 
              type="text"
              value={customTrash}
              onChange={(e) => setCustomTrash(e.target.value)}
              placeholder="e.g., Broken solar panel glass"
              style={styles.input}
              aria-label="Specify other trash type"
            />
          )}
          
          <button 
            onClick={getRecyclingSuggestion}
            disabled={isLoading}
            style={{...styles.button, ...(isButtonHovered ? styles.buttonHover : {})}}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
          >
            {isLoading ? 'ANALYZING...' : 'GET SUGGESTION'}
          </button>
        </div>

        {isLoading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Contacting Mars Orbital AI... Stand by.</p>
          </div>
        )}
        {error && <p style={styles.errorText}>{error}</p>}
        
        {suggestion && (
          <div style={styles.resultCard} role="article" aria-labelledby="suggestion-title">
            <h2 id="suggestion-title" style={styles.resultTitle}>Repurposing Protocol</h2>
            <h3>Recycling Method:</h3>
            <p style={styles.resultText}>{suggestion.recyclingMethod}</p>
            <h3>Reuse Potential:</h3>
            <p style={styles.resultText}>{suggestion.reusePotential}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
