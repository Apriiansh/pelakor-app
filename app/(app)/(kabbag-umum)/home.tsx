import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, RefreshControl } from 'react-native';
import { Avatar, Badge, Card, IconButton, Menu, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from 'react-native-chart-kit';
import { useAppTheme } from '@/context/ThemeContext';
import { getLaporanDiajukan, getLaporanStats, Laporan, LaporanStats, ApiError } from '@/utils/api';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const initialStats: LaporanStats = {
  'Memuat...': { diajukan: 0, diproses: 0, ditolak: 0, ditindaklanjuti: 0, selesai: 0 }
};

const initialSelectedDeptData = { diajukan: 0, diproses: 0, ditolak: 0, ditindaklanjuti: 0, selesai: 0 };

export default function HomeKabbagUmum() {
  const [user, setUser] = useState<{ nama: string; role: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // State for real data
  const [reportStats, setReportStats] = useState<LaporanStats>(initialStats);
  const [laporanDiajukan, setLaporanDiajukan] = useState<Laporan[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState(false);

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
        setUser({ nama: parsed.nama, role: 'Kepala Bagian Umum' });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, diajukanData] = await Promise.all([
        getLaporanStats(),
        getLaporanDiajukan()
      ]);

      setReportStats(statsData);
      setLaporanDiajukan(diajukanData);

      // Set default selected department to the first one from stats
      const firstDept = Object.keys(statsData)[0];
      if (firstDept) {
        setSelectedDepartment(firstDept);
      }

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error instanceof ApiError ? error.message : error);
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

  const departments = Object.keys(reportStats);
  const totalReports = Object.values(reportStats).reduce((total, deptData) => {
    return total + Object.values(deptData).reduce((sum, val) => sum + val, 0);
  }, 0);

  // Prepare chart data based on selected department
  const statusLabels = ['Diajukan', 'Diproses', 'Ditolak', 'Tindak\nLanjut', 'Selesai'];
  const selectedDeptData = reportStats[selectedDepartment] || initialSelectedDeptData;

  // Handle case where a department might not have all status keys
  const chartValues = [
    selectedDeptData.diajukan || 0,
    selectedDeptData.diproses || 0,
    selectedDeptData.ditolak || 0,
    selectedDeptData.ditindaklanjuti || 0,
    selectedDeptData.selesai || 0,
  ];
  const chartData = {
    labels: statusLabels,
    datasets: [
      {
        data: chartValues,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.onSurfaceVariant,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    fillShadowGradient: theme.colors.primary,
    fillShadowGradientOpacity: 0.8,
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
    chartHeader: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginBottom: 12,
      gap: 4,
    },
    chartCard: {
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
    },
    chartContainer: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    chartTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: 4,
    },
    departmentSelector: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      paddingHorizontal: 12,
      minWidth: 200,
      maxWidth: 250,
    },
    departmentSelectorButton: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      margin: 0,
      padding: 0,
      borderWidth: 1,
    },
    menuContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      width: width - 40, // Set a fixed width for the dropdown menu
      marginTop: 4,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    menuScrollView: {
      maxHeight: 280,
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
        <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Overview Sistem</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard} elevation={2}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statLabel}>Total Laporan</Text>
              <Text style={styles.statValue}>{totalReports}</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard} elevation={2}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statLabel}>Total Unit Kerja</Text>
              <Text style={styles.statValue}>{departments.length}</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Chart Section */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <Text style={styles.sectionTitle}>Statistik Laporan</Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon={menuVisible ? "filter-variant-remove" : "filter-variant"}
                  size={24}
                  iconColor={theme.colors.primary}
                  style={[styles.departmentSelectorButton, { borderColor: menuVisible ? theme.colors.primary : theme.colors.outline }]}
                  onPress={() => setMenuVisible(!menuVisible)}
                />
              }
              contentStyle={styles.menuContent}
            >
            <ScrollView
              style={styles.menuScrollView}
              showsVerticalScrollIndicator={true}
            >
              {departments.map((dept, index) => (
                <Menu.Item
                  key={`dept-${index}`}
                  onPress={() => {
                    setSelectedDepartment(dept);
                    setMenuVisible(false);
                  }}
                  title={
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                      <Text 
                        style={{ 
                          flex: 1, 
                          flexWrap: 'wrap', 
                          color: selectedDepartment === dept ? theme.colors.primary : theme.colors.onSurface,
                          fontFamily: selectedDepartment === dept ? 'RubikBold' : 'Rubik'
                        }}
                      >
                        {dept}
                      </Text>
                      {selectedDepartment === dept && <IconButton icon="check" size={16} iconColor={theme.colors.primary} style={{ margin: 0 }} />}
                    </View>
                  }
                  style={{
                    backgroundColor: selectedDepartment === dept ? theme.colors.primaryContainer : 'transparent',
                  }}
                />
              ))}
            </ScrollView>
            </Menu>
          </View>
          <Text style={{ color: theme.colors.primary, fontFamily: 'RubikBold' }}>
            {selectedDepartment}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginVertical: 40 }} />
        ) : (
          <Card style={styles.chartCard} elevation={3}>
            <View style={styles.chartContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 10 }}
              >
                <BarChart
                  data={chartData}
                  width={Math.max(width - 60, 350)}
                  height={260}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={chartConfig}
                  fromZero
                  showValuesOnTopOfBars
                  verticalLabelRotation={0}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  yAxisInterval={1}
                  segments={4}
                />
              </ScrollView>
            </View>
          </Card>
        )}
      </View>

      {/* Recent Activity Section */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Menunggu Verifikasi</Text>
          <Badge style={styles.badge} size={24}>{laporanDiajukan.length}</Badge>
        </View>
        <View>
          {loading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} />
          ) : laporanDiajukan.length === 0 ? (
            <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant, padding: 20 }}>
              Tidak ada laporan yang menunggu verifikasi.
            </Text>
          ) : (
            laporanDiajukan.slice(0, 5).map((item, idx) => (
            <Card key={idx} style={styles.recentCard} elevation={1}>
              <TouchableOpacity
                style={styles.recentCardContent}
                onPress={() => router.push('/(app)/(kabbag-umum)/disposisi_laporan')}
              >
                <View style={styles.recentCardLeft}>
                  <Text style={styles.recentItemTitle} numberOfLines={1}>{item.judul_laporan}</Text>
                  <Text style={styles.recentItemDesc} numberOfLines={2}>{item.isi_laporan}</Text>
                  <Text style={styles.recentItemFrom}>dari: {item.pelapor}</Text>
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