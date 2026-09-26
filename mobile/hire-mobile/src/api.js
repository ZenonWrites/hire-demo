import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL_PRIMARY , API_URL_SECONDARY } from './config';

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

export async function api(path, method = 'GET', body) {
  let res;
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Token ${token}` } : {}) };
  const reqBody = body ? JSON.stringify(body) : undefined;

  try {
    // Try the primary URL first
    res = await fetch(API_URL + path, { method, headers, body: reqBody });
  } catch (e) {
    try {
      // If primary fails, immediately try the backup URL
      const { SECONDARY_API_URL } = require('./config'); 
      res = await fetch(SECONDARY_API_URL + path, { method, headers, body: reqBody });
    } catch (err) {
      throw new Error('Cannot reach any server. Check your connection.');
    }
  }
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || 'Request failed');
  return data;
}

