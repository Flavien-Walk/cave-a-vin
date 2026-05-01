import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography } from '../src/constants';

const SECTIONS = [
  {
    title: 'Notre philosophie',
    body: `CAVOU a été pensée avec passion pour vous aider à organiser et profiter de votre cave simplement. Elle est gratuite, utile, et conçue dans le respect de votre vie privée.\n\nAucun tracking publicitaire. Aucune revente de données. Uniquement ce qui est strictement nécessaire au bon fonctionnement du service.`,
  },
  {
    title: 'Données collectées',
    body: `CAVOU collecte uniquement les données que vous saisissez volontairement :\n\n• Nom et adresse e-mail (création de compte)\n• Informations sur vos bouteilles (nom, millésime, région, note, prix, etc.)\n• Photos de bouteilles et de profil (stockées localement sur votre appareil)\n• Données de dégustation (notes, occasions, historique de consommation)`,
  },
  {
    title: 'Utilisation des données',
    body: `Vos données sont utilisées exclusivement pour :\n\n• Vous fournir le service de gestion de cave\n• Générer vos statistiques personnelles\n• Proposer des recommandations d'accords mets-vins\n• Vous envoyer les emails transactionnels (vérification, réinitialisation)\n\nVos données ne sont jamais vendues ni partagées à des tiers à des fins commerciales.`,
  },
  {
    title: 'Stockage et sécurité',
    body: `• Votre mot de passe est haché (bcrypt) — il n'est jamais stocké en clair\n• Votre token d'authentification est stocké dans le trousseau sécurisé de votre appareil (Keychain iOS / Keystore Android)\n• Les données sont hébergées sur MongoDB Atlas (infrastructure sécurisée, chiffrement au repos)\n• Le backend est hébergé sur Render (Europe)`,
  },
  {
    title: 'Photos',
    body: `Les photos de bouteilles et de profil sont stockées localement sur votre appareil. Elles ne sont pas transmises à des serveurs tiers — sauf lors du scan d'étiquette, qui envoie l'image à l'API Anthropic Claude pour analyse ponctuelle uniquement.`,
  },
  {
    title: 'Vos droits (RGPD)',
    body: `Conformément au Règlement Général sur la Protection des Données :\n\n• Droit d'accès : consultez toutes vos données depuis l'application\n• Droit de rectification : modifiez vos données à tout moment\n• Droit à l'effacement : supprimez votre compte depuis Profil → Supprimer mon compte\n• Droit à la portabilité : contactez-nous pour un export\n\nPour exercer vos droits : cavevin76@gmail.com`,
  },
  {
    title: 'Cookies et traceurs',
    body: `CAVOU est une application mobile. Aucun cookie de tracking ni SDK publicitaire n'est intégré. Aucune donnée comportementale n'est collectée à des fins publicitaires.`,
  },
  {
    title: 'Contact',
    body: `Pour toute question sur la protection de vos données personnelles :\n\ncavevin76@gmail.com\n\nL'équipe CAVOU`,
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.brunMoka} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.intro}>
          CAVOU a été conçue pour vous aider à organiser et profiter de votre cave simplement.
          Cette page vous explique honnêtement quelles données nous utilisons, pourquoi elles
          sont nécessaires, et comment vous pouvez les contrôler.
        </Text>

        <Text style={s.updated}>Dernière mise à jour : avril 2026</Text>
        <Text style={s.updated}>Version web : https://flavien-walk.github.io/cave-a-vin/privacy.html</Text>

        {SECTIONS.map((sec) => (
          <View key={sec.title} style={s.section}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            <Text style={s.sectionBody}>{sec.body}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cremeIvoire },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.champagne, borderWidth: 1, borderColor: Colors.parchemin, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.brunMoka },

  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  intro:   { ...Typography.body, color: Colors.brunMoyen, lineHeight: 22, marginBottom: Spacing.xs },
  updated: { ...Typography.caption, color: Colors.brunClair, marginBottom: Spacing.xl },

  section:      { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.lieDeVin, marginBottom: Spacing.sm },
  sectionBody:  { ...Typography.body, color: Colors.brunMoyen, lineHeight: 22 },
});
