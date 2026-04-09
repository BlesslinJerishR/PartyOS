import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/Colors';
import { Crown, Ticket } from 'lucide-react-native';

export default function RoleSelectScreen() {
  const { setRole } = useAuth();

  const handleSelectRole = async (role: 'HOST' | 'GUEST') => {
    await setRole(role);
    if (role === 'HOST') {
      router.replace('/(host)/dashboard');
    } else {
      router.replace('/(guest)/nowplaying');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>
          How would you like to use PartyOS?
        </Text>
      </View>

      <View style={styles.cards}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleSelectRole('HOST')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#F0EDFF' }]}>
            <Crown size={48} color={Colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.cardTitle}>Party Host</Text>
          <Text style={styles.cardDescription}>
            Set up your home theatre, configure seating, schedule shows, and welcome guests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => handleSelectRole('GUEST')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#E5FFF5' }]}>
            <Ticket size={48} color={Colors.secondary} strokeWidth={1.5} />
          </View>
          <Text style={styles.cardTitle}>Party Guest</Text>
          <Text style={styles.cardDescription}>
            Discover nearby shows, book tickets, enjoy movies, and leave reviews
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cards: {
    gap: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
