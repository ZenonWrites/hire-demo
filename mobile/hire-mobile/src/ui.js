import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const C = {
  primary: '#E06B1A', dark: '#241A12', bg: '#F6F4F2', card: '#FFFFFF', muted: '#7A6F65',
  line: '#E8E1D9', danger: '#C0392B', warn: '#C77D00', blue: '#2563EB', green: '#0B6E4F',
};

export const STATUS = {
  pending: { label: 'Pending', color: C.warn },
  accepted: { label: 'Accepted', color: C.blue },
  in_progress: { label: 'In progress', color: '#7C3AED' },
  completed: { label: 'Completed', color: C.green },
  rejected: { label: 'Rejected', color: C.danger },
  cancelled: { label: 'Cancelled', color: C.muted },
};
const FLOW = ['pending', 'accepted', 'in_progress', 'completed'];

export const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

export const Screen = ({ title, subtitle, children }) => (
  <View style={s.screen}>
    <View style={s.header}>
      <Text style={s.h1}>{title}</Text>
      {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
    </View>
    <View style={{ flex: 1 }}>{children}</View>
  </View>
);

export const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;

export const Btn = ({ title, onPress, kind = 'primary', disabled, style }) => {
  const bg = kind === 'primary' ? C.primary : kind === 'danger' ? C.danger : kind === 'dark' ? C.dark : 'transparent';
  const color = kind === 'ghost' ? C.primary : '#fff';
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[s.btn, { backgroundColor: bg, borderWidth: kind === 'ghost' ? 1 : 0, opacity: disabled ? 0.5 : 1 }, style]}
    >
      <Text style={{ color, fontWeight: '700' }}>{title}</Text>
    </TouchableOpacity>
  );
};

export const Field = ({ label, ...props }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput style={s.input} placeholderTextColor="#B0A69B" {...props} />
  </View>
);

export const Chips = ({ options, value, onChange }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
    {options.map((o) => (
      <TouchableOpacity
        key={o}
        onPress={() => onChange(o)}
        style={[s.chip, value === o && { backgroundColor: C.primary, borderColor: C.primary }]}
      >
        <Text style={{ color: value === o ? '#fff' : C.dark, fontWeight: '600' }}>{o}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export const Badge = ({ status }) => {
  const st = STATUS[status] || { label: status, color: C.muted };
  return (
    <View style={[s.badge, { backgroundColor: st.color + '22' }]}>
      <Text style={{ color: st.color, fontWeight: '700', fontSize: 12 }}>{st.label}</Text>
    </View>
  );
};

export const Stars = ({ value }) => (
  <Text style={{ color: '#D9A400', fontWeight: '700' }}>{'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}</Text>
);

export const Steps = ({ status }) => {
  if (status === 'rejected' || status === 'cancelled')
    return <Text style={{ color: C.danger, fontWeight: '600', marginVertical: 6 }}>{status === 'rejected' ? 'Request declined' : 'Booking cancelled'}</Text>;
  const idx = FLOW.indexOf(status);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
      {FLOW.map((k, i) => (
        <React.Fragment key={k}>
          <View style={[s.dot, { backgroundColor: i <= idx ? C.primary : C.line }]} />
          {i < FLOW.length - 1 && <View style={[s.bar, { backgroundColor: i < idx ? C.primary : C.line }]} />}
        </React.Fragment>
      ))}
    </View>
  );
};

export const Stat = ({ label, value }) => (
  <View style={s.stat}>
    <Text style={{ fontSize: 20, fontWeight: '800', color: C.primary }}>{value}</Text>
    <Text style={{ fontSize: 11, color: C.muted }}>{label}</Text>
  </View>
);

export const TabBar = ({ tabs, active, onChange }) => (
  <View style={s.tabbar}>
    {tabs.map(([key, label]) => (
      <TouchableOpacity key={key} style={{ flex: 1, alignItems: 'center', padding: 14 }} onPress={() => onChange(key)}>
        <Text style={{ color: active === key ? C.primary : C.muted, fontWeight: active === key ? '800' : '500' }}>{label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export const T = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '800', color: C.dark },
  muted: { color: C.muted, marginTop: 2 },
  line: { color: '#40352A', marginTop: 6 },
});

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.dark, paddingHorizontal: 20, paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12,
  },
  h1: { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub: { color: '#D8B99C', marginTop: 2 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: C.line },
  btn: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', marginTop: 10, marginRight: 8, borderColor: C.primary },
  label: { color: C.muted, fontSize: 12, marginBottom: 4, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 12, backgroundColor: '#fff', fontSize: 15 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: C.line, marginRight: 8, marginTop: 6, backgroundColor: '#fff' },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  bar: { height: 3, flex: 1 },
  stat: { flex: 1, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, marginHorizontal: 4, borderWidth: 1, borderColor: C.line },
  tabbar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderColor: C.line },
});
