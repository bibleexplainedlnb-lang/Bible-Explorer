import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { fetchArticles } from "@/lib/api";
import { CATEGORIES, type CategoryDef } from "@/lib/categories";

const PREFETCH_PAGE_SIZE = 30;

const WEB_TOP_INSET = 67;
const WEB_BOTTOM_INSET = 34;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    CATEGORIES.forEach((cat) => {
      queryClient.prefetchInfiniteQuery({
        queryKey: ["articles", cat.value],
        queryFn: () =>
          fetchArticles({
            category: cat.value,
            limit: PREFETCH_PAGE_SIZE,
            offset: 0,
          }),
        initialPageParam: 0,
      });
    });
  }, [queryClient]);

  const topPad = (isWeb ? WEB_TOP_INSET : insets.top) + 16;
  const bottomPad = (isWeb ? WEB_BOTTOM_INSET : insets.bottom) + 32;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad, paddingBottom: bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
            BIBLE EXPLORER
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Study the Word.
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Honest, KJV-grounded answers, guides, and reflections.
          </Text>
        </View>

        <View style={styles.list}>
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.value}
              category={cat}
              onPress={() =>
                router.push({
                  pathname: "/category/[slug]",
                  params: { slug: cat.value },
                })
              }
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function CategoryCard({
  category,
  onPress,
}: {
  category: CategoryDef;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.iconBadge,
          { backgroundColor: category.color + "1A" },
        ]}
      >
        <Feather name={category.icon} size={22} color={category.color} />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          {category.label}
        </Text>
        <Text
          style={[styles.cardBlurb, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {category.blurb}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { marginBottom: 28 },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 34,
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 22,
  },
  list: { gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1 },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    marginBottom: 4,
  },
  cardBlurb: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
});
