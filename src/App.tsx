import { useEffect, useState } from 'react';
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

  /**
   * 모드로 들어갈 때 히스토리 항목을 하나 쌓는다.
   * 이게 없으면 휴대폰 뒤로가기가 곧바로 앱을 닫아버린다.
   * URL은 바꾸지 않는다. GitHub Pages에서 없는 경로로 새로고침되는 일을 막기 위해서다.
   */
  const goTo = (next: Screen) => {
    if (next === screen) return;
    if (next === 'home') {
      // 직접 상태를 되돌리지 않는다. 뒤로가기와 같은 경로를 타야 히스토리가 어긋나지 않는다.
      window.history.back();
      return;
    }
    window.history.pushState({ screen: next }, '');
    setScreen(next);
  };

  // 뒤로가기(하드웨어 버튼 포함)로 모드에서 홈으로 돌아온다.
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const state = event.state as { screen?: Screen } | null;
      setScreen(state?.screen ?? 'home');
      setKeyOpen(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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
              onBack={() => goTo('home')}
              onToggleKey={() => setKeyOpen((v) => !v)}
            />
            {keyOpen && (
              <div className="mb-4">
                <ApiKeyPanel keys={keys} onChange={changeKey} onClear={removeKey} />
              </div>
            )}
          </>
        )}

        {screen === 'home' && <Home go={goTo} />}
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
