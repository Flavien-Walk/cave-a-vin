import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../src/components/navigation/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Accueil' }} />
      <Tabs.Screen name="cave"     options={{ title: 'Cave' }} />
      <Tabs.Screen name="discover" options={{ title: 'Découvrir' }} />
      <Tabs.Screen name="stats"    options={{ title: 'Stats' }} />
      <Tabs.Screen name="add"      options={{ href: null, title: 'Ajouter' }} />
    </Tabs>
  );
}
