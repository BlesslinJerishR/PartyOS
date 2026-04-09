import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth, useTheme } from '../context/AuthContext';
import { Fonts } from '../constants/Fonts';
import { Crown, Ticket } from 'lucide-react-native';

export default function RoleSelectScreen() {
  const { setRole } = useAuth();
  const { colors } = useTheme();

  const handleSelectRole = async (role: 'HOST' | 'GUEST') => {
    await setRole(role);
    if (role === 'HOST') {
      router.replace('/(host)/dashboard');
    } else {
      router.replace('/(guest)/nowplaying');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.hero }]}>Choose Your Role</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
          How would you like to use PartyOS?
        </Text>
      </View>

      <View style={styles.cards}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handleSelectRole('HOST')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Crown size={48} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: Fonts.hero }]}>Party Host</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
            Set up your home theatre, configure seating, schedule shows, and welcome guests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handleSelectRole('GUEST')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ticket size={48} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: Fonts.hero }]}>Party Guest</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary, fontFamily: Fonts.regular }]}>
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
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  cards: {
    gap: 20,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
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
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
