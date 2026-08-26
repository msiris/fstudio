import { useState } from 'react';
import AppHeader from './components/AppHeader';
import ApiKeyPanel from './components/ApiKeyPanel';
import { SCREEN_TITLES } from './constants';
import {
  clearApiKey,
  loadApiKeys,
  saveApiKey,
  type ApiKeys,
  type KeyName,
} from './lib/keyStore';
import Home from './screens/Home';
import ImageGen from './screens/ImageGen';
import MultiSwap from './screens/MultiSwap';
import SingleSwap from './screens/SingleSwap';
import {
  initialGen,
  initialMulti,
  initialSingle,
  type GenState,
  type MultiState,
  type SingleState,
} from './state';
import type { Screen } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  // 키는 이 브라우저의 localStorage에 남는다.
  // 저장소·빌드 결과에는 들어가지 않으므로 공개 저장소로 올려도 무방하다.
  const [keys, setKeys] = useState<ApiKeys>(loadApiKeys);
  const [keyOpen, setKeyOpen] = useState(false);

  const [single, setSingle] = useState<SingleState>(initialSingle);
  const [multi, setMulti] = useState<MultiState>(initialMulti);
  const [gen, setGen] = useState<GenState>(initialGen);

  const changeKey = (name: KeyName, next: string) => {
    setKeys((k) => ({ ...k, [name]: next }));
    saveApiKey(name, next);
  };

  const removeKey = (name: KeyName) => {
    setKeys((k) => ({ ...k, [name]: '' }));
    clearApiKey(name);
  };

  return (
    <div className="min-h-screen w-full bg-bg">
      <div className="mx-auto max-w-app px-5 py-6 pb-16">
        {screen !== 'home' && (
          <>
            <AppHeader
              subtitle={SCREEN_TITLES[screen]}
              // 이미지를 만들려면 fal 키가 있어야 한다. Gemini 키는 없어도 동작한다.
              hasKey={Boolean(keys.fal)}
              keyOpen={keyOpen}
              onBack={() => setScreen('home')}
              onToggleKey={() => setKeyOpen((v) => !v)}
            />
            {keyOpen && (
              <div className="mb-4">
                <ApiKeyPanel keys={keys} onChange={changeKey} onClear={removeKey} />
              </div>
            )}
          </>
        )}

        {screen === 'home' && <Home go={setScreen} />}
        {screen === 'single' && (
          <SingleSwap
            state={single}
            onChange={(next) => setSingle((s) => ({ ...s, ...next }))}
            keys={keys}
          />
        )}
        {screen === 'multi' && (
          <MultiSwap
            state={multi}
            onChange={(next) => setMulti((s) => ({ ...s, ...next }))}
            keys={keys}
          />
        )}
        {screen === 'gen' && (
          <ImageGen
            state={gen}
            onChange={(next) => setGen((s) => ({ ...s, ...next }))}
            keys={keys}
          />
        )}
      </div>
    </div>
  );
}
