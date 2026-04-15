import React, { useState, useMemo } from "react";
import {
  Modal, View, Text, TouchableOpacity, FlatList,
  TextInput, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing, Typography } from "../../constants";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectModalProps {
  label?: string;
  placeholder?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  searchable?: boolean;
  required?: boolean;
  error?: string;
}

export const SelectModal: React.FC<SelectModalProps> = ({
  label, placeholder = "Selectionner", value, options, onChange,
  searchable = true, required, error,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find(o => o.value === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return options.filter(o =>
      o.label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q)
    );
  }, [options, search]);

  const handleSelect = (val: string) => {
    onChange(val);
    setSearch("");
    setOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={styles.label}>
          {label}{required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={[styles.trigger, error && styles.triggerError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        accessibilityLabel={label}
        accessibilityRole="button"
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.brunClair} />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => { setSearch(""); setOpen(false); }} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label ?? "Selectionner"}</Text>
              <TouchableOpacity
                onPress={() => { setSearch(""); setOpen(false); }}
                style={styles.closeBtn}
                accessibilityLabel="Fermer"
              >
                <Ionicons name="close" size={20} color={Colors.brunMoyen} />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={15} color={Colors.brunClair} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher..."
                  placeholderTextColor={Colors.brunClair}
                  value={search}
                  onChangeText={setSearch}
                  accessibilityLabel="Rechercher"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")} accessibilityLabel="Effacer">
                    <Ionicons name="close-circle" size={15} color={Colors.brunClair} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <FlatList
              data={filtered}
              keyExtractor={o => o.value}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.list}
              renderItem={({ item }) => {
                const isActive = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, isActive && styles.optionActive]}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, isActive && styles.optionTextActive]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={16} color={Colors.lieDeVin} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.empty}>Aucun resultat pour "{search}"</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: { ...Typography.bodySmall, fontWeight: "500", color: Colors.brunMoyen, marginBottom: Spacing.xs },
  required: { color: Colors.rougeAlerte },
  trigger: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.champagne, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.parchemin,
    paddingHorizontal: Spacing.md, paddingVertical: 13, minHeight: 48, gap: Spacing.sm,
  },
  triggerError: { borderColor: Colors.rougeAlerte },
  triggerText: { ...Typography.body, color: Colors.brunMoka, flex: 1 },
  placeholder: { color: Colors.brunClair },
  error: { ...Typography.caption, color: Colors.rougeAlerte, marginTop: 4 },

  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.champagne,
    borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    maxHeight: "75%", paddingBottom: 30,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.parchemin, alignSelf: "center",
    marginTop: Spacing.sm, marginBottom: Spacing.sm,
  },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.parchemin,
  },
  sheetTitle: { ...Typography.h4, color: Colors.brunMoka },
  closeBtn: { padding: 6, backgroundColor: Colors.parchemin, borderRadius: Radius.full },

  searchRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginVertical: Spacing.md,
    backgroundColor: Colors.cremeIvoire, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.parchemin, minHeight: 42,
  },
  searchInput: { flex: 1, ...Typography.body, color: Colors.brunMoka, paddingVertical: 8 },

  list: { maxHeight: 380 },
  option: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.parchemin,
  },
  optionActive: { backgroundColor: Colors.lieDeVin + "20" },
  optionText: { ...Typography.body, color: Colors.brunMoyen, flex: 1 },
  optionTextActive: { color: Colors.lieDeVin, fontWeight: "600" },
  empty: { ...Typography.bodySmall, color: Colors.brunClair, textAlign: "center", padding: Spacing.xl, fontStyle: "italic" },
});
