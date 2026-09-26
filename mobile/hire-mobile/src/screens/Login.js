import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { api, setToken } from '../api';
import { Btn, C, Card, Chips, Field, Screen } from '../ui';

export default function Login({ onLogin }) {
  const [role, setRole] = useState('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cats, setCats] = useState([]);
  const [category, setCategory] = useState('');

  useEffect(() => {
    api('/categories', 'GET', null, false).then((c) => { setCats(c); setCategory(c[0]); }).catch(() => {});
  }, []);

  const submit = async (body) => {
    setBusy(true);
    try {
      const r = await api('/auth/login', 'POST', body);
      await setToken(r.token);
      onLogin(r.profile);
    } catch (e) {
      Alert.alert('Login failed', e.message);
    }
    setBusy(false);
  };

  return (
    <Screen title="Hire A Hand" subtitle="On-demand skilled workers, by the hour or the day">
      <ScrollView keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={{ fontWeight: '800', fontSize: 16, color: C.dark, marginBottom: 8 }}>Sign in with mobile number</Text>
          <Text style={{ color: C.muted, marginBottom: 4 }}>I am a</Text>
          <Chips options={['customer', 'worker']} value={role} onChange={setRole} />
          <Field label={role === 'worker' ? 'Full name (new accounts)' : 'Full name (new accounts)'} value={name} onChangeText={setName} />
          {role === 'worker' && (
            <>
              <Text style={{ color: C.muted, marginBottom: 4 }}>Category (new accounts)</Text>
              <Chips options={cats} value={category} onChange={setCategory} />
            </>
          )}
          <Field label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="05XXXXXXXX" />
          {sent && <Field label="OTP (demo code: 123456)" value={otp} onChangeText={setOtp} keyboardType="number-pad" />}
          {!sent ? (
            <Btn title="Send OTP" onPress={() => (phone.trim().length >= 8 ? setSent(true) : Alert.alert('Enter a valid mobile number'))} />
          ) : (
            <Btn title="Verify & continue" disabled={busy} onPress={() => submit({ phone, otp, role, name, category })} />
          )}
        </Card>
        <Card>
          <Text style={{ fontWeight: '800', color: C.dark }}>Quick demo login</Text>
          <View style={{ flexDirection: 'row' }}>
            <Btn kind="ghost" title="As Customer" onPress={() => submit({ phone: '0511111111', otp: '123456' })} />
            <Btn kind="ghost" title="As Worker" onPress={() => submit({ phone: '0522222221', otp: '123456' })} />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
