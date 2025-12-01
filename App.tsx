import React, { useState, useRef, useEffect } from 'react';
import { AppState, Course } from './types';
import { generatePillars, generateVariations, generateCourse } from './services/geminiService';
import { MentorAvatar } from './components/MentorAvatar';
import { Loading } from './components/Loading';
import { Button } from './components/Button';
import { CourseView } from './components/CourseView';

export default function App() {
  const [state, setState] = useState<AppState>('INITIAL');
  const [topic, setTopic] = useState('');
  const [pillars, setPillars] = useState<string[]>([]);
  const [selectedPillar, setSelectedPillar] = useState('');
  const [variations, setVariations] = useState<string[]>([]);
  const [selectedVariation, setSelectedVariation] = useState('');
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pillarsRef = useRef<HTMLDivElement>(null);
  const variationsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll helper
  useEffect(() => {
    if (state === 'SELECT_PILLAR' && pillarsRef.current) {
      pillarsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (state === 'SELECT_VARIATION' && variationsRef.current) {
      variationsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state]);

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setState('LOADING_PILLARS');
    setError(null);
    try {
      const result = await generatePillars(topic);
      setPillars(result);
      setState('SELECT_PILLAR');
    } catch (err) {
      setError("Hubo un problema conectando con el mentor. Por favor intenta de nuevo.");
      setState('INITIAL');
    }
  };

  const handlePillarSelect = async (pillar: string) => {
    setSelectedPillar(pillar);
    setState('LOADING_VARIATIONS');
    setError(null);
    try {
      const result = await generateVariations(pillar);
      setVariations(result);
      setState('SELECT_VARIATION');
    } catch (err) {
      setError("Error generando variaciones. Intenta seleccionar otro pilar.");
      setState('SELECT_PILLAR');
    }
  };

  const handleVariationSelect = async (variation: string) => {
    setSelectedVariation(variation);
    setState('LOADING_COURSE');
    setError(null);
    try {
      const result = await generateCourse(variation, selectedPillar);
      setCourse(result);
      setState('VIEW_COURSE');
    } catch (err) {
      setError("Error construyendo el curso. Intenta otra vez.");
      setState('SELECT_VARIATION');
    }
  };

  const resetToVariations = () => {
    setCourse(null);
    setState('SELECT_VARIATION');
  };

  const resetAll = () => {
    setTopic('');
    setPillars([]);
    setVariations([]);
    setCourse(null);
    setState('INITIAL');
  };

  // -- RENDER HELPERS --

  const renderMentorBubble = (text: string) => (
    <div className="flex items-start gap-4 max-w-2xl mx-auto mb-8 animate-slide-in-up">
      <div className="flex-shrink-0 hidden md:block">
        <MentorAvatar />
      </div>
      <div className="bg-white p-6 rounded-2xl rounded-tl-none shadow-md border border-slate-100 relative">
        <div className="md:hidden absolute -top-4 -left-2">
            <div className="transform scale-75"><MentorAvatar /></div>
        </div>
        <p className="text-slate-700 text-lg leading-relaxed mt-2 md:mt-0">{text}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetAll}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
            <span className="font-bold text-xl text-slate-800">CursoAPP</span>
          </div>
          {state !== 'INITIAL' && (
            <button onClick={resetAll} className="text-sm text-slate-500 hover:text-indigo-600">
              Empezar de nuevo
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center animate-shake">
            {error}
          </div>
        )}

        {/* STEP 1: INPUT */}
        {state === 'INITIAL' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
            <div className="mb-8 transform scale-125">
               <MentorAvatar />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 text-center mb-6">
              ¿Qué quieres enseñar hoy?
            </h1>
            <p className="text-xl text-slate-600 text-center max-w-2xl mb-10">
              Hola, soy tu mentor experto. Ayudo a convertir tus ideas en estrategias de cursos estructuradas y profesionales. Dime el tema y comenzaremos.
            </p>
            <form onSubmit={handleTopicSubmit} className="w-full max-w-lg relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: Marketing Digital, Cocina Vegana, Python..."
                className="w-full px-6 py-5 text-lg rounded-full border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none shadow-xl transition-all"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!topic.trim()}
                className="absolute right-3 top-3 bottom-3 bg-indigo-600 text-white px-8 rounded-full font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Iniciar
              </button>
            </form>
          </div>
        )}

        {state === 'LOADING_PILLARS' && <Loading message={`Analizando tendencias sobre "${topic}"...`} />}

        {/* STEP 2: PILLARS */}
        {(state === 'SELECT_PILLAR' || state === 'LOADING_VARIATIONS' || state === 'SELECT_VARIATION' || state === 'LOADING_COURSE' || state === 'VIEW_COURSE') && (
            <div className={`space-y-12 ${state === 'VIEW_COURSE' ? 'hidden' : ''}`} ref={pillarsRef}>
                {renderMentorBubble(`¡Excelente elección! Para dominar "${topic}", he identificado estos 10 pilares fundamentales. ¿En cuál te gustaría enfocarte primero?`)}
                
                <div className="grid md:grid-cols-2 gap-4">
                    {pillars.map((pillar, idx) => (
                        <div 
                            key={idx}
                            onClick={() => state === 'SELECT_PILLAR' && handlePillarSelect(pillar)}
                            className={`
                                p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 group relative overflow-hidden
                                ${selectedPillar === pillar 
                                    ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600 ring-offset-2' 
                                    : 'border-white bg-white hover:border-indigo-300 shadow-sm hover:shadow-md'
                                }
                                ${state !== 'SELECT_PILLAR' && selectedPillar !== pillar ? 'opacity-50 pointer-events-none grayscale' : ''}
                            `}
                        >
                            <div className="flex items-center justify-between relative z-10">
                                <span className={`font-semibold text-lg ${selectedPillar === pillar ? 'text-indigo-900' : 'text-slate-700'}`}>
                                    {pillar}
                                </span>
                                {selectedPillar === pillar && (
                                    <span className="bg-indigo-600 text-white p-1 rounded-full">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {state === 'LOADING_VARIATIONS' && <Loading message={`Brainstorming de lecciones para "${selectedPillar}"...`} />}

        {/* STEP 3: VARIATIONS */}
        {(state === 'SELECT_VARIATION' || state === 'LOADING_COURSE' || state === 'VIEW_COURSE') && (
            <div className={`space-y-12 mt-12 pt-12 border-t border-slate-200 ${state === 'VIEW_COURSE' ? 'hidden' : ''}`} ref={variationsRef}>
                {renderMentorBubble(`Perfecto. El pilar "${selectedPillar}" tiene mucho potencial. Aquí tienes 10 enfoques únicos para una lección o mini-curso. Selecciona el que más te inspire.`)}
                
                <div className="grid gap-3">
                    {variations.map((variation, idx) => (
                        <div 
                            key={idx}
                            onClick={() => state === 'SELECT_VARIATION' && handleVariationSelect(variation)}
                            className={`
                                p-5 rounded-lg border transition-all cursor-pointer flex items-center
                                ${selectedVariation === variation
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg transform scale-[1.02]' 
                                    : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-slate-50 text-slate-700'
                                }
                                ${state !== 'SELECT_VARIATION' && selectedVariation !== variation ? 'opacity-40 pointer-events-none' : ''}
                            `}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0 ${selectedVariation === variation ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                {idx + 1}
                            </div>
                            <span className="font-medium text-lg">{variation}</span>
                            {selectedVariation === variation && state === 'LOADING_COURSE' && (
                                <div className="ml-auto animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {state === 'LOADING_COURSE' && <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"><Loading message="Diseñando tu curso completo (contenido, imágenes y quiz)..." /></div>}

        {/* STEP 4: COURSE VIEW */}
        {state === 'VIEW_COURSE' && course && (
             <div className="animate-slide-in-up">
                <CourseView course={course} onBack={resetToVariations} />
             </div>
        )}

      </main>
      
      {/* Styles for simple animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slide-in-up { animation: slideInUp 0.6s ease-out forwards; }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
}
