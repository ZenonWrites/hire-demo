import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { Btn, C, Card, Chips, Field, Screen, Stars, Stat, T, TabBar, fmt } from '../ui';

export default function WorkerApp({ profile, onProfile, onLogout }) {
  const [tab, setTab] = useState('requests');
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(profile);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      setBookings(await api('/bookings'));
      setStats(await api('/stats'));
    } catch (e) { Alert.alert('Error', e.message); }
    setBusy(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (id, status) => {
    try { await api(`/bookings/${id}`, 'PATCH', { status }); load(); } catch (e) { Alert.alert('Error', e.message); }
  };

  const save = async () => {
    try { onProfile(await api('/me', 'PUT', form)); Alert.alert('Saved', 'Profile updated.'); load(); } catch (e) { Alert.alert('Error', e.message); }
  };

  const requests = bookings.filter((b) => b.status === 'pending');
  const jobs = bookings.filter((b) => ['accepted', 'in_progress'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'completed');

  const Tabs = () => <TabBar tabs={[['requests', 'Requests'], ['jobs', 'Jobs'], ['earnings', 'Earnings'], ['profile', 'Profile']]} active={tab} onChange={setTab} />;

  if (tab === 'requests') {
    return (
      <Screen title="Job requests" subtitle={`${requests.length} waiting for your response`}>
        <FlatList
          data={requests} keyExtractor={(b) => String(b.id)} refreshing={busy} onRefresh={load}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: C.muted }}>No new requests right now</Text>}
          renderItem={({ item: b }) => (
            <Card>
              <Text style={T.title}>{b.customer.name}</Text>
              <Text style={T.muted}>{b.customer.location} · {b.address}</Text>
              <Text style={T.line}>{b.booking_type === 'hourly' ? `${b.hours} hours` : `${b.days} day(s)`} · {b.booking_type}{b.repeat_daily ? ' · repeats daily' : ''}</Text>
              <Text style={T.line}>{b.scheduled_at ? `Scheduled: ${fmt(b.scheduled_at)}` : 'Book now — as soon as possible'}</Text>
              <Text style={[T.line, { fontWeight: '800' }]}>SAR {b.price} · {b.payment_method}</Text>
              <View style={{ flexDirection: 'row' }}>
                <Btn title="Accept" onPress={() => act(b.id, 'accepted')} />
                <Btn kind="danger" title="Decline" onPress={() => act(b.id, 'rejected')} />
              </View>
            </Card>
          )}
        />
        <Tabs />
      </Screen>
    );
  }

  if (tab === 'jobs') {
    return (
      <Screen title="My jobs" subtitle={`${jobs.length} active`}>
        <FlatList
          data={jobs} keyExtractor={(b) => String(b.id)} refreshing={busy} onRefresh={load}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: C.muted }}>No accepted jobs yet</Text>}
          renderItem={({ item: b }) => (
            <Card>
              <Text style={T.title}>{b.customer.name}</Text>
              <Text style={T.muted}>{b.address}</Text>
              <Text style={T.line}>{b.booking_type === 'hourly' ? `${b.hours} hours` : `${b.days} day(s)`} · SAR {b.price} · {b.payment_method}</Text>
              {b.checked_in_at && <Text style={T.line}>Checked in: {fmt(b.checked_in_at)}</Text>}
              {b.status === 'accepted' && <Btn title="Check in & start job" onPress={() => act(b.id, 'in_progress')} />}
              {b.status === 'in_progress' && <Btn title="Check out & complete job" onPress={() => act(b.id, 'completed')} />}
            </Card>
          )}
        />
        <Tabs />
      </Screen>
    );
  }

  if (tab === 'earnings') {
    return (
      <Screen title="Earnings" subtitle="Completed jobs and payouts">
        <FlatList
          data={completed} keyExtractor={(b) => String(b.id)} refreshing={busy} onRefresh={load}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginTop: 12 }}>
              <Stat label="Total earned" value={`SAR ${stats.earnings ?? 0}`} />
              <Stat label="Jobs done" value={stats.jobs_completed ?? 0} />
              <Stat label="Rating" value={stats.rating_avg ?? 0} />
            </View>
          }
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: C.muted }}>No completed jobs yet</Text>}
          renderItem={({ item: b }) => (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={T.title}>{b.customer.name}</Text>
                <Text style={{ fontWeight: '800', color: C.primary }}>SAR {b.price}</Text>
              </View>
              <Text style={T.muted}>{fmt(b.checked_out_at || b.created_at)} · {b.payment_method}</Text>
              {b.checked_in_at && b.checked_out_at && (
                <Text style={T.line}>
                  On site: {fmt(b.checked_in_at)} → {fmt(b.checked_out_at)}
                </Text>
              )}
              {b.rating ? <View style={{ marginTop: 6 }}><Stars value={b.rating} />{!!b.review && <Text style={T.line}>"{b.review}"</Text>}</View> : <Text style={T.line}>Not yet rated</Text>}
            </Card>
          )}
        />
        <Tabs />
      </Screen>
    );
  }

  // ---- PROFILE TAB ----
  return (
    <Screen title="My profile" subtitle={`${profile.category} · ★ ${profile.rating_avg} (${profile.rating_count})`}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
        <Card>
          <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600' }}>Available for new jobs</Text>
          <Chips options={['On', 'Off']} value={form.available ? 'On' : 'Off'} onChange={(v) => setForm({ ...form, available: v === 'On' })} />
          <Field label="Full name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <Field label="Skills (comma separated)" value={form.skills} onChangeText={(v) => setForm({ ...form, skills: v })} />
          <Field label="Experience (years)" value={String(form.experience_years ?? '')} onChangeText={(v) => setForm({ ...form, experience_years: v })} keyboardType="numeric" />
          <Field label="Hourly rate (SAR)" value={String(form.hourly_rate ?? '')} onChangeText={(v) => setForm({ ...form, hourly_rate: v })} keyboardType="numeric" />
          <Field label="Daily rate (SAR, 8-10 hr day)" value={String(form.daily_rate ?? '')} onChangeText={(v) => setForm({ ...form, daily_rate: v })} keyboardType="numeric" />
          <Field label="City" value={form.location} onChangeText={(v) => setForm({ ...form, location: v })} />
          <Field label="Bio" value={form.bio} onChangeText={(v) => setForm({ ...form, bio: v })} />
          <Btn title="Save profile" onPress={save} />
          <Btn kind="ghost" title="Log out" onPress={onLogout} />
        </Card>
      </ScrollView>
      <Tabs />
    </Screen>
  );
}
