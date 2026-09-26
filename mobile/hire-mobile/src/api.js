import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

let token = null;

export const setToken = async (t) => {
  token = t;
  if (t) await AsyncStorage.setItem('token', t);
  else await AsyncStorage.removeItem('token');
};

export const loadToken = async () => {
  token = await AsyncStorage.getItem('token');
  return token;
};

export async function api(path, method = 'GET', body, auth = true) {
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(auth && token ? { Authorization: `Token ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('Cannot reach the server. Check API_URL in src/config.js and that the backend is running.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || 'Request failed');
  return data;
}
