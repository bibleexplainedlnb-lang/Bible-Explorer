import { Feather } from "@expo/vector-icons";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { fetchArticle, fetchArticles, type ArticleSummary } from "@/lib/api";
import { categoryByValue } from "@/lib/categories";

const PAGE_SIZE = 30;
const WEB_BOTTOM_INSET = 34;

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isWeb = Platform.OS === "web";

  const category = useMemo(() => categoryByValue(slug ?? ""), [slug]);

  const query = useInfiniteQuery({
    queryKey: ["articles", slug],
    queryFn: ({ pageParam = 0 }) =>
      fetchArticles({ category: slug, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      last.hasMore ? pages.length * PAGE_SIZE : undefined,
    enabled: !!slug,
  });

  const articles: ArticleSummary[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.articles) ?? [],
    [query.data],
  );

  const onEndReached = useCallback(() => {
    if (
      !query.isLoading &&
      query.hasNextPage &&
      !query.isFetchingNextPage &&
      articles.length > 0
    ) {
      query.fetchNextPage();
    }
  }, [query, articles.length]);

  const prefetchArticle = useCallback(
    (articleSlug: string) => {
      queryClient.prefetchQuery({
        queryKey: ["article", articleSlug],
        queryFn: () => fetchArticle(articleSlug),
      });
    },
    [queryClient],
  );

  const bottomPad = (isWeb ? WEB_BOTTOM_INSET : insets.bottom) + 24;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: category?.label ?? "Articles" }} />

      {query.isLoading ? (
        <SkeletonList category={category} />
      ) : query.isError ? (
        <ErrorState
          message={(query.error as Error)?.message ?? "Something went wrong"}
          onRetry={() => query.refetch()}
        />
      ) : articles.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.slug}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPad },
          ]}
          ItemSeparatorComponent={() => (
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
          )}
          ListHeaderComponent={
            category ? (
              <View style={styles.listHeader}>
                <View
                  style={[
                    styles.headerIcon,
                    { backgroundColor: category.color + "1A" },
                  ]}
                >
                  <Feather
                    name={category.icon}
                    size={20}
                    color={category.color}
                  />
                </View>
                <Text
                  style={[styles.headerBlurb, { color: colors.mutedForeground }]}
                >
                  {category.blurb}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ArticleRow
              item={item}
              onPress={() => {
                prefetchArticle(item.slug);
                router.push({
                  pathname: "/article/[slug]",
                  params: { slug: item.slug },
                });
              }}
            />
          )}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={colors.mutedForeground} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}

function ArticleRow({
  item,
  onPress,
}: {
  item: ArticleSummary;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>
          {item.title}
        </Text>
        {item.meta_description ? (
          <Text
            style={[styles.rowDesc, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {item.meta_description}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

function LoadingState({ color }: { color: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={color} />
    </View>
  );
}

function SkeletonList({
  category,
}: {
  category: ReturnType<typeof categoryByValue>;
}) {
  const colors = useColors();
  return (
    <View style={[styles.listContent, { paddingTop: 0 }]}>
      {category ? (
        <View style={styles.listHeader}>
          <View
            style={[
              styles.headerIcon,
              { backgroundColor: category.color + "1A" },
            ]}
          >
            <Feather name={category.icon} size={20} color={category.color} />
          </View>
          <Text
            style={[styles.headerBlurb, { color: colors.mutedForeground }]}
          >
            {category.blurb}
          </Text>
        </View>
      ) : null}
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i}>
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <View
                style={[
                  styles.skelLine,
                  { backgroundColor: colors.border, width: "75%", height: 16 },
                ]}
              />
              <View
                style={[
                  styles.skelLine,
                  {
                    backgroundColor: colors.border,
                    width: "95%",
                    height: 12,
                    marginTop: 8,
                    opacity: 0.6,
                  },
                ]}
              />
              <View
                style={[
                  styles.skelLine,
                  {
                    backgroundColor: colors.border,
                    width: "60%",
                    height: 12,
                    marginTop: 6,
                    opacity: 0.6,
                  },
                ]}
              />
            </View>
          </View>
          {i < 5 ? (
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.center}>
      <Feather name="alert-circle" size={28} color={colors.destructive} />
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>
        Couldn&apos;t load articles
      </Text>
      <Text
        style={[styles.stateBody, { color: colors.mutedForeground }]}
        numberOfLines={3}
      >
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retryBtn,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text style={[styles.retryText, { color: colors.primaryForeground }]}>
          Try again
        </Text>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  const colors = useColors();
  return (
    <View style={styles.center}>
      <Feather name="inbox" size={28} color={colors.mutedForeground} />
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>
        No articles yet
      </Text>
      <Text style={[styles.stateBody, { color: colors.mutedForeground }]}>
        New writing is published here regularly. Check back soon.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 8 },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBlurb: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  rowBody: { flex: 1 },
  rowTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  rowDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  sep: { height: StyleSheet.hairlineWidth },
  skelLine: { borderRadius: 4 },
  footerLoading: { paddingVertical: 24, alignItems: "center" },
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
