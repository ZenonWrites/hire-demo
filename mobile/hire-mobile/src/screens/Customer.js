import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../api';
import { Badge, Btn, C, Card, Chips, Field, Screen, Stars, Steps, T, TabBar, fmt } from '../ui';

const ICONS = {
  Electrician: '⚡', Plumber: '🔧', Carpenter: '🪚', 'AC Technician': '❄️', Painter: '🎨',
  Mason: '🧱', 'General Helper': '🧰', Driver: '🚗', Cleaner: '🧹',
};

const EMPTY_FORM = { booking_type: 'hourly', hours: '2', days: '1', when: 'now', address: '', payment_method: 'cash', repeat_daily: false };

export default function CustomerApp({ profile, onProfile, onLogout }) {
  const [tab, setTab] = useState('home');
  const [cats, setCats] = useState([]);
  const [category, setCategory] = useState(null);
  const [workerList, setWorkerList] = useState([]);
  const [booking, setBooking] = useState(null); // worker selected for booking form
  const [form, setForm] = useState(EMPTY_FORM);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [busy, setBusy] = useState(false);
  const [rateFor, setRateFor] = useState(null);
  const [starPick, setStarPick] = useState(5);
  const [review, setReview] = useState('');
  const [profForm, setProfForm] = useState(profile);

  useEffect(() => { api('/categories', 'GET', null, false).then(setCats).catch(() => {}); }, []);

  const loadBookings = useCallback(async () => {
    setBusy(true);
    try {
      setBookings(await api('/bookings'));
      setStats(await api('/stats'));
    } catch (e) { Alert.alert('Error', e.message); }
    setBusy(false);
  }, []);
  useEffect(() => { if (tab === 'bookings' || tab === 'home') loadBookings(); }, [tab, loadBookings]);

  const openCategory = async (c) => {
    setCategory(c);
    try { setWorkerList(await api(`/workers?category=${encodeURIComponent(c)}`)); } catch (e) { Alert.alert('Error', e.message); }
  };

  const startBooking = (w) => { setBooking(w); setForm(EMPTY_FORM); };

  const price = booking
    ? form.booking_type === 'hourly' ? Number(form.hours || 0) * booking.hourly_rate
      : form.booking_type === 'emergency' ? Math.round(Math.max(Number(form.hours || 0), 2) * booking.hourly_rate * 1.5)
      : Number(form.days || 0) * booking.daily_rate
    : 0;

  const confirmBooking = async () => {
    try {
      await api('/bookings', 'POST', {
        worker_id: booking.id, booking_type: form.booking_type,
        hours: Number(form.hours || 0), days: Number(form.days || 0),
        scheduled_at: form.when === 'later' && form.scheduled_at ? form.scheduled_at : null,
        address: form.address || profile.location, payment_method: form.payment_method,
        repeat_daily: form.repeat_daily,
      });
      Alert.alert('Booking sent', `Request sent to ${booking.name}. You'll be notified once they accept.`);
      setBooking(null); setCategory(null); setTab('bookings'); loadBookings();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const cancel = async (id) => {
    try { await api(`/bookings/${id}`, 'PATCH', { status: 'cancelled' }); loadBookings(); } catch (e) { Alert.alert('Error', e.message); }
  };

  const submitRating = async () => {
    try {
      await api(`/bookings/${rateFor.id}/rate`, 'POST', { rating: starPick, review });
      setRateFor(null); setReview(''); setStarPick(5); loadBookings();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const saveProfile = async () => {
    try { onProfile(await api('/me', 'PUT', profForm)); Alert.alert('Saved', 'Profile updated.'); } catch (e) { Alert.alert('Error', e.message); }
  };

  const schedTimes = () => [1, 2, 3].map((d) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(9, 0, 0, 0); return x; });

  const Tabs = () => <TabBar tabs={[['home', 'Home'], ['bookings', 'Bookings'], ['profile', 'Profile']]} active={tab} onChange={(t) => { setTab(t); setCategory(null); setBooking(null); }} />;

  // ---- HOME TAB ----
  if (tab === 'home' && booking) {
    return (
      <Screen title={`Book ${booking.name}`} subtitle={`${booking.category} · SAR ${booking.hourly_rate}/hr · SAR ${booking.daily_rate}/day`}>
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
          <Card>
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600' }}>Booking type</Text>
            <Chips options={['hourly', 'daily', 'multi_day', 'emergency']} value={form.booking_type} onChange={(v) => setForm({ ...form, booking_type: v })} />
            {form.booking_type === 'hourly' || form.booking_type === 'emergency' ? (
              <Field label="Hours" value={form.hours} onChangeText={(v) => setForm({ ...form, hours: v })} keyboardType="numeric" />
            ) : (
              <Field label={form.booking_type === 'daily' ? 'Days (1)' : 'Days (up to 30)'} value={form.days} onChangeText={(v) => setForm({ ...form, days: v })} keyboardType="numeric" />
            )}
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600' }}>When</Text>
            <Chips options={['now', 'later']} value={form.when} onChange={(v) => setForm({ ...form, when: v })} />
            {form.when === 'later' && (
              <View style={{ marginBottom: 10 }}>
                {schedTimes().map((d) => (
                  <TouchableOpacity key={d.toISOString()} onPress={() => setForm({ ...form, scheduled_at: d.toISOString() })}
                    style={{ padding: 10, borderWidth: 1, borderColor: form.scheduled_at === d.toISOString() ? C.primary : C.line, borderRadius: 10, marginTop: 6 }}>
                    <Text style={{ color: form.scheduled_at === d.toISOString() ? C.primary : C.dark, fontWeight: '600' }}>{fmt(d)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600' }}>Repeat every day</Text>
            <Chips options={['Off', 'On']} value={form.repeat_daily ? 'On' : 'Off'} onChange={(v) => setForm({ ...form, repeat_daily: v === 'On' })} />
            <Field label="Address" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} placeholder={profile.location} />
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600' }}>Payment method</Text>
            <Chips options={['cash', 'mada', 'apple_pay', 'card', 'wallet']} value={form.payment_method} onChange={(v) => setForm({ ...form, payment_method: v })} />
            <View style={{ backgroundColor: '#FBEEE2', borderRadius: 10, padding: 12, marginTop: 8 }}>
              <Text style={{ fontWeight: '800', color: C.dark }}>Estimated total: SAR {price}</Text>
              {form.booking_type === 'emergency' && <Text style={{ color: C.muted, fontSize: 12 }}>Includes emergency surcharge (1.5×), 2 hour minimum</Text>}
            </View>
            <Btn title="Confirm booking" onPress={confirmBooking} />
            <Btn kind="ghost" title="Back" onPress={() => setBooking(null)} />
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  if (tab === 'home' && category) {
    return (
      <Screen title={category} subtitle="Workers near you">
        <FlatList
          data={workerList} keyExtractor={(w) => String(w.id)}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={<Btn kind="ghost" title="← All categories" onPress={() => { setCategory(null); setWorkerList([]); }} style={{ marginHorizontal: 16 }} />}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: C.muted }}>No workers in this category yet</Text>}
          renderItem={({ item: w }) => (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={T.title}>{w.name}{w.verified ? ' ✔' : ''}</Text>
                  <Text style={T.muted}>{w.experience_years} yrs · {w.skills}</Text>
                </View>
                <Text style={{ color: w.available ? C.green : C.muted, fontWeight: '700', fontSize: 12 }}>
                  {w.available ? `ETA ${w.eta_minutes} min` : 'Unavailable'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <Stars value={w.rating_avg} />
                <Text style={{ color: C.muted, marginLeft: 6 }}>({w.rating_count})</Text>
              </View>
              <Text style={T.line}>SAR {w.hourly_rate}/hr · SAR {w.daily_rate}/day</Text>
              <Btn title="Book" disabled={!w.available} onPress={() => startBooking(w)} />
            </Card>
          )}
        />
        <Tabs />
      </Screen>
    );
  }

  if (tab === 'home') {
    return (
      <Screen title="What do you need done?" subtitle={`Hello, ${profile.name || 'there'}`}>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 8 }}>
            {cats.map((c) => (
              <TouchableOpacity key={c} onPress={() => openCategory(c)} style={{ width: '46%', margin: '2%' }}>
                <Card style={{ alignItems: 'center', marginHorizontal: 0 }}>
                  <Text style={{ fontSize: 30 }}>{ICONS[c] || '🛠️'}</Text>
                  <Text style={{ fontWeight: '700', color: C.dark, marginTop: 6, textAlign: 'center' }}>{c}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
          {bookings.some((b) => ['pending', 'accepted', 'in_progress'].includes(b.status)) && (
            <>
              <Text style={{ marginHorizontal: 20, marginTop: 16, fontWeight: '800', color: C.dark }}>Active booking</Text>
              {bookings.filter((b) => ['pending', 'accepted', 'in_progress'].includes(b.status)).slice(0, 1).map((b) => (
                <Card key={b.id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={T.title}>{b.worker.name} · {b.category}</Text>
                    <Badge status={b.status} />
                  </View>
                  <Steps status={b.status} />
                </Card>
              ))}
            </>
          )}
        </ScrollView>
        <Tabs />
      </Screen>
    );
  }

  // ---- BOOKINGS TAB ----
  if (tab === 'bookings') {
    return (
      <Screen title="My bookings" subtitle={`${stats.active ?? 0} active · ${stats.completed ?? 0} completed`}>
        <FlatList
          data={bookings} keyExtractor={(b) => String(b.id)} refreshing={busy} onRefresh={loadBookings}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: C.muted }}>No bookings yet — head to Home to book a worker</Text>}
          renderItem={({ item: b }) => (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={T.title}>{b.worker.name}</Text>
                  <Text style={T.muted}>{b.category} · {b.booking_type} · SAR {b.price}</Text>
                </View>
                <Badge status={b.status} />
              </View>
              <Steps status={b.status} />
              {b.scheduled_at && <Text style={T.line}>Scheduled: {fmt(b.scheduled_at)}</Text>}
              {b.checked_in_at && <Text style={T.line}>Started: {fmt(b.checked_in_at)}</Text>}
              {b.checked_out_at && <Text style={T.line}>Finished: {fmt(b.checked_out_at)}</Text>}
              <Text style={T.line}>Payment: {b.payment_method}</Text>
              {b.status === 'pending' && <Btn kind="danger" title="Cancel request" onPress={() => cancel(b.id)} />}
              {b.status === 'completed' && !b.rating && <Btn title="Rate this job" onPress={() => setRateFor(b)} />}
              {b.status === 'completed' && b.rating && (
                <View style={{ marginTop: 8 }}>
                  <Stars value={b.rating} />
                  {!!b.review && <Text style={T.line}>"{b.review}"</Text>}
                </View>
              )}
            </Card>
          )}
        />
        {rateFor && (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, backgroundColor: '#0008', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
              <Text style={T.title}>Rate {rateFor.worker.name}</Text>
              <View style={{ flexDirection: 'row', marginVertical: 10 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setStarPick(n)}>
                    <Text style={{ fontSize: 28, marginRight: 6 }}>{n <= starPick ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Field label="Review (optional)" value={review} onChangeText={setReview} placeholder="How did it go?" />
              <Btn title="Submit rating" onPress={submitRating} />
              <Btn kind="ghost" title="Cancel" onPress={() => setRateFor(null)} />
            </View>
          </View>
        )}
        <Tabs />
      </Screen>
    );
  }

  // ---- PROFILE TAB ----
  return (
    <Screen title="My profile">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
        <Card>
          <Field label="Full name" value={profForm.name} onChangeText={(v) => setProfForm({ ...profForm, name: v })} />
          <Field label="Location / city" value={profForm.location} onChangeText={(v) => setProfForm({ ...profForm, location: v })} />
          <Btn title="Save profile" onPress={saveProfile} />
          <Btn kind="ghost" title="Log out" onPress={onLogout} />
        </Card>
      </ScrollView>
      <Tabs />
    </Screen>
  );
}
