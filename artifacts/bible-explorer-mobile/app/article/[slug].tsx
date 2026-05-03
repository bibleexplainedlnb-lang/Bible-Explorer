import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import RenderHtml, { type MixedStyleRecord } from "react-native-render-html";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { canonicalUrl, fetchArticle } from "@/lib/api";
import { categoryByValue } from "@/lib/categories";

const WEB_BOTTOM_INSET = 34;

export default function ArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";

  const query = useQuery({
    queryKey: ["article", slug],
    queryFn: () => fetchArticle(slug!),
    enabled: !!slug,
  });

  const article = query.data;
  const category = useMemo(
    () => (article?.category ? categoryByValue(article.category) : undefined),
    [article?.category],
  );

  const baseStyle = useMemo(
    () => ({
      color: colors.foreground,
      fontFamily: "Merriweather_400Regular" as const,
      fontSize: 17,
      lineHeight: 28,
    }),
    [colors.foreground],
  );

  const tagsStyles: MixedStyleRecord = useMemo(
    () => ({
      body: { color: colors.foreground },
      p: { marginBottom: 16, color: colors.foreground },
      h1: {
        fontFamily: "Merriweather_700Bold",
        fontSize: 26,
        lineHeight: 34,
        marginTop: 24,
        marginBottom: 12,
        color: colors.foreground,
      },
      h2: {
        fontFamily: "Merriweather_700Bold",
        fontSize: 22,
        lineHeight: 30,
        marginTop: 24,
        marginBottom: 10,
        color: colors.foreground,
      },
      h3: {
        fontFamily: "Inter_600SemiBold",
        fontSize: 18,
        lineHeight: 26,
        marginTop: 20,
        marginBottom: 8,
        color: colors.foreground,
      },
      h4: {
        fontFamily: "Inter_600SemiBold",
        fontSize: 16,
        marginTop: 16,
        marginBottom: 8,
        color: colors.foreground,
      },
      a: { color: colors.primary, textDecorationLine: "none" },
      strong: { fontFamily: "Inter_700Bold", color: colors.foreground },
      em: { fontStyle: "italic" },
      ul: { marginBottom: 16 },
      ol: { marginBottom: 16 },
      li: { marginBottom: 6, color: colors.foreground },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        backgroundColor: colors.secondary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginVertical: 16,
        fontStyle: "italic",
      },
      code: {
        backgroundColor: colors.secondary,
        paddingHorizontal: 4,
        borderRadius: 4,
        fontSize: 14,
      },
      pre: {
        backgroundColor: colors.secondary,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
      },
      hr: {
        backgroundColor: colors.border,
        height: 1,
        marginVertical: 24,
      },
      table: { marginBottom: 16, borderColor: colors.border, borderWidth: 1 },
      th: {
        backgroundColor: colors.secondary,
        padding: 8,
        fontFamily: "Inter_600SemiBold",
      },
      td: { padding: 8, borderColor: colors.border, borderWidth: 1 },
      img: { marginVertical: 12, borderRadius: 8 },
    }),
    [colors],
  );

  const onOpenWeb = () => {
    if (!article) return;
    WebBrowser.openBrowserAsync(canonicalUrl(article.category, article.slug));
  };

  const headerRight = article
    ? () => (
        <Pressable
          onPress={onOpenWeb}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Feather name="external-link" size={20} color={colors.foreground} />
        </Pressable>
      )
    : undefined;

  const bottomPad = (isWeb ? WEB_BOTTOM_INSET : insets.bottom) + 48;
  const contentWidth = Math.max(width - 40, 200);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: category?.label ?? "",
          headerRight,
        }}
      />

      {query.isLoading ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.skelLine,
              { backgroundColor: colors.border, width: 80, height: 12 },
            ]}
          />
          <View
            style={[
              styles.skelLine,
              {
                backgroundColor: colors.border,
                width: "90%",
                height: 28,
                marginTop: 14,
              },
            ]}
          />
          <View
            style={[
              styles.skelLine,
              {
                backgroundColor: colors.border,
                width: "70%",
                height: 28,
                marginTop: 10,
              },
            ]}
          />
          <View
            style={[
              styles.skelLine,
              {
                backgroundColor: colors.border,
                width: 120,
                height: 12,
                marginTop: 14,
                opacity: 0.6,
              },
            ]}
          />
          <View
            style={[styles.divider, { backgroundColor: colors.border }]}
          />
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.skelLine,
                {
                  backgroundColor: colors.border,
                  width: i % 4 === 3 ? "55%" : "100%",
                  height: 12,
                  marginTop: 10,
                  opacity: 0.6,
                },
              ]}
            />
          ))}
        </ScrollView>
      ) : query.isError || !article ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={28} color={colors.destructive} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>
            Couldn&apos;t load this article
          </Text>
          <Text style={[styles.stateBody, { color: colors.mutedForeground }]}>
            {(query.error as Error)?.message ?? "Please try again."}
          </Text>
          <Pressable
            onPress={() => query.refetch()}
            style={({ pressed }) => [
              styles.retryBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text
              style={[styles.retryText, { color: colors.primaryForeground }]}
            >
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: bottomPad },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {category ? (
            <Text style={[styles.eyebrow, { color: category.color }]}>
              {category.label.toUpperCase()}
            </Text>
          ) : null}
          <Text style={[styles.title, { color: colors.foreground }]}>
            {article.title}
          </Text>
          {article.author_name ? (
            <Text style={[styles.byline, { color: colors.mutedForeground }]}>
              By {article.author_name}
            </Text>
          ) : null}

          <View
            style={[styles.divider, { backgroundColor: colors.border }]}
          />

          {article.html_content ? (
            <RenderHtml
              contentWidth={contentWidth}
              source={{ html: article.html_content }}
              baseStyle={baseStyle}
              tagsStyles={tagsStyles}
              defaultTextProps={{ selectable: true }}
              enableExperimentalMarginCollapsing
            />
          ) : (
            <Text style={[styles.bodyFallback, { color: colors.foreground }]}>
              {article.meta_description ?? "Content unavailable."}
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  title: {
    fontFamily: "Merriweather_700Bold",
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 8,
  },
  byline: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  divider: { height: 1, marginVertical: 20 },
  skelLine: { borderRadius: 4 },
  bodyFallback: {
    fontFamily: "Merriweather_400Regular",
    fontSize: 17,
    lineHeight: 28,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  stateTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    marginTop: 4,
  },
  stateBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
