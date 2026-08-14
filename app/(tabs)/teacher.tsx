import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import QRCode from 'react-native-qrcode-svg';

import AppButton from '@/components/AppButton';
import PickerField from '@/components/PickerField';
import { COLORS } from '@/constants/colors';
import { createEvent } from '@/lib/database';

const isAndroid = Platform.OS === 'android';

function toLocalISO(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

function formatDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TeacherScreen() {
  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000)
  );
  const [editTarget, setEditTarget] = useState<'start' | 'end' | null>(null);
  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');
  const [payload, setPayload] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const openPicker = (target: 'start' | 'end') => {
    setEditTarget(target);
    setEditingPart('date');
  };

  const onPickerChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (!selected) {
      // User dismissed the picker — keep the old value
      setEditTarget(null);
      return;
    }

    if (isAndroid) {
      // Android: date first, then time
      if (editingPart === 'date') {
        const current = editTarget === 'start' ? startDate : endDate;
        const updated = new Date(
          selected.getFullYear(),
          selected.getMonth(),
          selected.getDate(),
          current.getHours(),
          current.getMinutes()
        );
        if (editTarget === 'start') {
          setStartDate(updated);
        } else {
          setEndDate(updated);
        }
        setEditingPart('time');
      } else {
        const current = editTarget === 'start' ? startDate : endDate;
        const updated = new Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate(),
          selected.getHours(),
          selected.getMinutes()
        );
        if (editTarget === 'start') {
          setStartDate(updated);
        } else {
          setEndDate(updated);
        }
        setEditTarget(null);
      }
    } else {
      // iOS: datetime in one spinner
      if (editTarget === 'start') {
        setStartDate(selected);
      } else {
        setEndDate(selected);
      }
      setEditTarget(null);
    }
  };

  const handleCreateEvent = () => {
    const event = {
      eventId: eventId.trim(),
      title: title.trim(),
      start: toLocalISO(startDate),
      end: toLocalISO(endDate),
    };

    if (!event.eventId || !event.title) {
      setMessage('All fields are required.');
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      setMessage('Start time must be before end time.');
      return;
    }

    createEvent(event).then(() => {
      setMessage('Event saved! Scan the QR with the Scan tab to test it.');
      setPayload(
        JSON.stringify({
          v: 1,
          event: event.eventId,
          title: event.title,
          start: event.start,
          end: event.end,
        })
      );
      // Clear the fields so the next event gets a fresh, unique code
      setTitle('');
      setEventId('');
    });
  };

  const setEndOffset = (minutes: number) => {
    setEndDate(new Date(startDate.getTime() + minutes * 60 * 1000));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Create Event QR</Text>
      <Text style={styles.subtitle}>
        Fill in the event details, then scan the generated QR with the Scan tab.
      </Text>

      <Text style={styles.label}>Event Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Founders Day Assembly"
        placeholderTextColor={COLORS.textSecondary}
      />

      <Text style={styles.label}>Event Code</Text>
      <TextInput
        style={styles.input}
        value={eventId}
        onChangeText={setEventId}
        placeholder="e.g. EVT-2026-0002"
        placeholderTextColor={COLORS.textSecondary}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Start</Text>
      <PickerField
        value={formatDateTime(startDate)}
        icon="sunny-outline"
        onPress={() => openPicker('start')}
      />

      <Text style={styles.label}>Ends</Text>
      <PickerField
        value={formatDateTime(endDate)}
        icon="moon-outline"
        onPress={() => openPicker('end')}
      />

      <View style={styles.chipRow}>
        <Text style={styles.chipLabel}>Quick add:</Text>
        <PressableChip label="+30 min" onPress={() => setEndOffset(30)} />
        <PressableChip label="+1 hour" onPress={() => setEndOffset(60)} />
        <PressableChip label="+2 hours" onPress={() => setEndOffset(120)} />
      </View>

      {editTarget && (
        <DateTimePicker
          value={editTarget === 'start' ? startDate : endDate}
          mode={isAndroid ? editingPart : 'datetime'}
          display={isAndroid ? 'default' : 'spinner'}
          onChange={onPickerChange}
        />
      )}

      {message && <Text style={styles.message}>{message}</Text>}

      <AppButton
        theme="primary"
        title="Create Event"
        icon="add-circle-outline"
        onPress={handleCreateEvent}
      />

      {payload && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>
            Scan this QR code with the Scan tab:
          </Text>
          <View style={styles.qrBox}>
            <QRCode value={payload} size={200} />
          </View>
          <Text style={styles.payloadText}>{payload}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function PressableChip({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.chip}
      onPress={onPress}
      android_ripple={{ color: COLORS.surface }}
    >
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  chipLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  message: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 12,
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  payloadText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
