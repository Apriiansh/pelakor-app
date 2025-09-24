import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, RefreshControl } from 'react-native';
import { Avatar, Badge, Card, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-chart-kit';
import { useAppTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

// Data 10 bagian Sekretariat Daerah Kab Ogan Ilir
const departmentStats = [
  { name: 'Bagian Tata Pemerintahan & Kerjasama', value: 120, color: '#3b82f6' },
  { name: 'Bagian Kesejahteraan Rakyat', value: 85, color: '#10b981' },
  { name: 'Bagian Hukum', value: 95, color: '#f59e0b' },
  { name: 'Bagian Perekonomian & Sumber Daya Alam', value: 70, color: '#ef4444' },
  { name: 'Bagian Administrasi Pembangunan', value: 45, color: '#8b5cf6' },
  { name: 'Bagian Pengadaian Barang & Jasa', value: 110, color: '#06b6d4' },
  { name: 'Bagian Umum', value: 88, color: '#84cc16' },
  { name: 'Bagian Organisasi', value: 65, color: '#f97316' },
  { name: 'Bagian Protokol Komunikasi & Pimpinan', value: 92, color: '#ec4899' },
  { name: 'Bagian Perencanaan & Keuangan', value: 77, color: '#6366f1' },
];

const dummyRecent = [
  {
    title: 'Konsumsi rapat koordinasi',
    desc: '50 Snack dan 50 air mineral',
    from: 'Bagian Umum',
  },
  {
    title: 'Laporan kerusakan printer',
    desc: 'Printer tidak dapat mencetak dan tinta habis',
    from: 'Bagian Hukum',
  },
  {
    title: 'Laporan alat kantor',
    desc: 'Pena, Kertas, staples dan isinya, tinta stampel, dll',
    from: 'Bagian Organisasi',
  },
];

export default function HomeKabbagUmum() {
  const [user, setUser] = useState<{ nama: string; role: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useAppTheme();

  useEffect(() => {
    loadUserData();

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
        setUser({ nama: parsed.nama, role: 'Kepala Bagian Umum' });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

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
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const totalReports = departmentStats.reduce((sum, dept) => sum + dept.value, 0);

  // Prepare chart data
  const chartData = departmentStats.map(dept => ({
    name: dept.name.replace('Bagian ', ''),
    population: dept.value,
    color: dept.color,
    legendFontColor: theme.colors.onSurfaceVariant,
    legendFontSize: 12,
  }));

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
                <Text style={styles.userName}>{user?.nama || 'Kepala Bagian'}</Text>
                <Text style={styles.userRole}>Kepala Bagian Umum</Text>
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
        <Text style={styles.sectionTitle}>Overview Sistem</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard} elevation={2}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statLabel}>Total Pelaporan</Text>
              <Text style={styles.statValue}>{totalReports}</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard} elevation={2}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statLabel}>Total Bagian</Text>
              <Text style={styles.statValue}>{departmentStats.length}</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Chart Section */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Distribusi Laporan per Bagian</Text>
        <Card style={styles.chartCard} elevation={2}>
          <View style={styles.chartContainer}>
            <PieChart
              data={chartData}
              width={width - 80}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, -10]}
              absolute
            />
          </View>
        </Card>
      </View>

      {/* Recent Activity Section */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Menunggu Verifikasi</Text>
          <Badge style={styles.badge} size={24}>{dummyRecent.length}</Badge>
        </View>
        <View>
          {dummyRecent.map((item, idx) => (
            <Card key={idx} style={styles.recentCard} elevation={1}>
              <TouchableOpacity style={styles.recentCardContent}>
                <View style={styles.recentCardLeft}>
                  <Text style={styles.recentItemTitle}>{item.title}</Text>
                  <Text style={styles.recentItemDesc}>{item.desc}</Text>
                  <Text style={styles.recentItemFrom}>dari: {item.from}</Text>
                </View>
                <IconButton
                  icon="eye-outline"
                  size={20}
                  iconColor={theme.colors.primary}
                  style={{ margin: 0 }}
                />
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}