import { useEffect, useState } from 'react';
import AppHeader from './components/AppHeader';
import { SCREEN_TITLES } from './constants';
import { clearApiKey, loadApiKey, saveApiKey } from './lib/keyStore';
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
  const [apiKey, setApiKeyState] = useState(loadApiKey);
  const [keyOpen, setKeyOpen] = useState(false);

  const [single, setSingle] = useState<SingleState>(initialSingle);
  const [multi, setMulti] = useState<MultiState>(initialMulti);
  const [gen, setGen] = useState<GenState>(initialGen);

  const changeKey = (next: string) => {
    setApiKeyState(next);
    saveApiKey(next);
  };

  const removeKey = () => {
    setApiKeyState('');
    clearApiKey();
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
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div className="min-h-screen w-full bg-bg">
      <div className="mx-auto max-w-app px-5 py-6 pb-16">
        {screen !== 'home' && (
          <AppHeader subtitle={SCREEN_TITLES[screen]} onBack={() => goTo('home')} />
        )}

        {screen === 'home' && (
          <Home
            go={goTo}
            apiKey={apiKey}
            onChangeKey={changeKey}
            onClearKey={removeKey}
            keyOpen={keyOpen}
            onToggleKey={() => setKeyOpen((v) => !v)}
          />
        )}
        {screen === 'single' && (
          <SingleSwap
            state={single}
            onChange={(next) => setSingle((s) => ({ ...s, ...next }))}
            apiKey={apiKey}
          />
        )}
        {screen === 'multi' && (
          <MultiSwap
            state={multi}
            onChange={(next) => setMulti((s) => ({ ...s, ...next }))}
            apiKey={apiKey}
          />
        )}
        {screen === 'gen' && (
          <ImageGen
            state={gen}
            onChange={(next) => setGen((s) => ({ ...s, ...next }))}
            apiKey={apiKey}
          />
        )}
      </div>
    </div>
  );
}
