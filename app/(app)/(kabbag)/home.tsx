import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, RefreshControl, Alert } from 'react-native';
import { Avatar, Badge, Card, IconButton, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-chart-kit';
import { useAppTheme } from '@/context/ThemeContext';
import { getLaporan, getLaporanStatsByUnit, Laporan, LaporanUnitStats, ApiError } from '@/utils/api';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const initialStats: LaporanUnitStats = {
  diajukan: 0,
  diproses: 0,
  ditolak: 0,
  ditindaklanjuti: 0,
  selesai: 0,
};

export default function HomeKabbagUmum() {
  const [user, setUser] = useState<{ nama: string; jabatan: string; unit_kerja: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // State untuk data asli
  const [stats, setStats] = useState<LaporanUnitStats>(initialStats);
  const [recentReports, setRecentReports] = useState<Laporan[]>([]);

  const { theme } = useAppTheme();
  const router = useRouter();

  useEffect(() => {
    loadUserData();
    fetchDashboardData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser({
          nama: parsed.nama,
          jabatan: parsed.jabatan || 'Kepala Bagian',
          unit_kerja: parsed.unit_kerja || 'Tidak Diketahui'
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, laporanData] = await Promise.all([
        getLaporanStatsByUnit(),
        getLaporan()
      ]);

      setStats(statsData);
      setRecentReports(laporanData);

    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Gagal memuat data dashboard";
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 17) return 'Selamat Siang';
    if (hour < 20) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const totalReports = Object.values(stats).reduce((sum, value) => sum + value, 0);
  const totalUsersInUnit = recentReports.filter((v, i, a) => a.findIndex(t => (t.nip_pelapor === v.nip_pelapor)) === i).length;

  // Prepare chart data
  const chartData = [
    { name: 'Diajukan', population: stats.diajukan, color: theme.colors.warning, legendFontColor: theme.colors.onSurfaceVariant, legendFontSize: 12 },
    { name: 'Diproses', population: stats.diproses, color: theme.colors.blueLight, legendFontColor: theme.colors.onSurfaceVariant, legendFontSize: 12 },
    { name: 'Ditolak', population: stats.ditolak, color: theme.colors.error, legendFontColor: theme.colors.onSurfaceVariant, legendFontSize: 12 },
    { name: 'Ditindaklanjuti', population: stats.ditindaklanjuti, color: theme.colors.primary, legendFontColor: theme.colors.onSurfaceVariant, legendFontSize: 12 },
    { name: 'Selesai', population: stats.selesai, color: theme.colors.success, legendFontColor: theme.colors.onSurfaceVariant, legendFontSize: 12 },
  ].filter(item => item.population > 0); // Hanya tampilkan status yang ada laporannya

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      paddingBottom: 100,
    },
    headerGradient: {
      paddingTop: 60,
      paddingBottom: 24,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerContent: {
      gap: 16,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    avatar: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    avatarLabel: {
      color: 'white',
      fontWeight: 'bold',
      fontFamily: 'RubikBold',
    },
    greeting: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      fontFamily: 'Rubik',
    },
    userName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
      marginTop: 2,
      fontFamily: 'RubikBold',
    },
    userRole: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      fontFamily: 'Rubik',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    notificationButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      margin: 0,
    },
    dateText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      fontFamily: 'Rubik',
    },

    // Statistics Section
    statsSection: {
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: 16,
      fontFamily: 'RubikBold',
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 8,
    },
    statCard: {
      flex: 1,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    statContent: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
      marginBottom: 4,
      fontFamily: 'Rubik',
    },
    statValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      fontFamily: 'RubikBold',
    },

    // Chart Section
    chartSection: {
      paddingHorizontal: 20,
      paddingTop: 32,
    },
    chartCard: {
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      padding: 16,
    },
    chartContainer: {
      alignItems: 'center',
      marginVertical: 8,
    },

    // Department Stats
    departmentSection: {
      paddingHorizontal: 20,
      paddingTop: 32,
    },
    departmentGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    departmentCard: {
      width: (width - 52) / 2,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    departmentContent: {
      padding: 16,
      alignItems: 'center',
      gap: 8,
    },
    departmentIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    departmentName: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
      fontFamily: 'RubikBold',
    },
    departmentValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      fontFamily: 'RubikBold',
    },
    departmentLabel: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontFamily: 'Rubik',
    },

    // Recent Activity
    recentSection: {
      paddingHorizontal: 20,
      paddingTop: 32,
    },
    recentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    recentTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      fontFamily: 'RubikBold',
    },
    badge: {
      backgroundColor: theme.colors.primary,
      color: 'white',
    },
    recentCard: {
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    recentCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    recentCardLeft: {
      flex: 1,
    },
    recentItemTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 4,
      fontFamily: 'RubikBold',
    },
    recentItemDesc: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
      fontFamily: 'Rubik',
    },
    recentItemFrom: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
      fontFamily: 'Rubik',
    },
  });
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <Avatar.Text
                size={52}
                label={user?.nama?.charAt(0) || 'K'}
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>{user?.nama || 'Memuat...'}</Text>
                <Text style={styles.userRole}>{user?.jabatan || 'Kepala Bagian'}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <IconButton
                icon="bell-outline"
                size={24}
                iconColor="white"
                style={styles.notificationButton}
              />
            </View>
          </View>

          <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
        </View>
      </LinearGradient>

      {/* Statistics Cards */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Overview {user?.unit_kerja}</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard} elevation={2}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statLabel}>Total Laporan</Text>
              {loading ? <ActivityIndicator size="small" /> : <Text style={styles.statValue}>{totalReports}</Text>}
            </Card.Content>
          </Card>
          <Card style={styles.statCard} elevation={2}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statLabel}>Total Anggota</Text>
              {loading ? <ActivityIndicator size="small" /> : <Text style={styles.statValue}>{totalUsersInUnit}</Text>}
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Chart Section */}
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : (
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Status Laporan Unit Kerja</Text>
          <Card style={styles.chartCard} elevation={2}>
            <View style={styles.chartContainer}>
              {chartData.length > 0 ? (
                <PieChart
                  data={chartData}
                  width={width - 80}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[10, -10]}
                  absolute
                />
              ) : (
                <Text style={{ color: theme.colors.onSurfaceVariant, padding: 20 }}>
                  Belum ada laporan dari unit kerja Anda.
                </Text>
              )}
            </View>
          </Card>
        </View>
      )}

      {/* Recent Activity Section */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Aktivitas Terbaru {user?.unit_kerja}</Text>
          <Badge style={styles.badge} size={24}>{recentReports.length}</Badge>
        </View>
        <View>
          {loading ? <ActivityIndicator style={{ marginVertical: 20 }} /> : recentReports.length === 0 ? (
            <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, padding: 20 }}>
              Belum ada laporan dari unit kerja Anda.
            </Text>
          ) : (
            recentReports.slice(0, 3).map((item, idx) => (
            <Card key={item.id_laporan} style={styles.recentCard} elevation={1}>
                <TouchableOpacity style={styles.recentCardContent} onPress={() => router.push('/(app)/(kabbag)/laporan')}>
                <View style={styles.recentCardLeft}>
                  <Text style={styles.recentItemTitle} numberOfLines={1}>{item.judul_laporan}</Text>
                  <Text style={styles.recentItemDesc} numberOfLines={2}>{item.isi_laporan}</Text>
                  <Text style={styles.recentItemFrom}>Oleh: {item.pelapor} ({item.status_laporan})</Text>
                </View>
                <IconButton
                  icon="eye-outline"
                  size={20}
                  iconColor={theme.colors.primary}
                  style={{ margin: 0 }}
                />
              </TouchableOpacity>
            </Card>
          ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}