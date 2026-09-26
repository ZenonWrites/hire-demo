import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { api, loadToken, setToken } from './src/api';
import { C } from './src/ui';
import Login from './src/screens/Login';
import CustomerApp from './src/screens/Customer';
import WorkerApp from './src/screens/Worker';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (await loadToken()) setProfile(await api('/me'));
      } catch (e) {
        await setToken(null);
      }
      setReady(true);
    })();
  }, []);

  const logout = async () => {
    await setToken(null);
    setProfile(null);
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />

      <SafeAreaView
         style={{
           flex: 1,
           backgroundColor: C.bg,
         }}
         edges={['top', 'bottom', 'left', 'right']}
       >

      {!ready ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: C.bg,
            }}
          >
            <ActivityIndicator
              size="large"
              color={C.primary}
            />
          </View>
                ) : !profile ? (
          <Login onLogin={setProfile} />
        ) : profile.role === 'worker' ? (
          <WorkerApp
            profile={profile}
            onProfile={setProfile}
            onLogout={logout}
          />
        ) : (
          <CustomerApp
            profile={profile}
            onProfile={setProfile}
            onLogout={logout}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
