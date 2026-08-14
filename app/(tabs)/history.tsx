import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { STUDENT_ID } from '@/constants/student';
import { type AttendanceRecord, getAttendanceHistory } from '@/lib/database';

export default function HistoryScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const data = await getAttendanceHistory(STUDENT_ID);
    setRecords(data);
    setLoading(false);
  };

  const renderItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.recordCard}>
      <Text style={styles.recordTitle}>{item.eventTitle}</Text>
      <Text style={styles.recordId}>Event: {item.eventId}</Text>
      <Text style={styles.recordTime}>
        Scanned: {new Date(item.scannedAt).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance History</Text>
      <Text style={styles.subtitle}>
        Your past attendance records will appear here.
      </Text>

      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : records.length === 0 ? (
        <Text style={styles.empty}>No attendance records yet.</Text>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 24,
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
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  loading: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  empty: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  list: {
    paddingBottom: 40,
  },
  recordCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  recordId: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  recordTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
