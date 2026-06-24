import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, FlatList, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View, type GestureResponderEvent } from 'react-native';

import { getLocalMergeSummary } from '@/src/local/localDataRepository';
import { createNoteLocal, deleteNoteLocal, listNotesLocal, updateNoteLocal } from '@/src/local/notesRepository';
import { getSettingsLocal } from '@/src/local/settingsRepository';
import type { QuickNote } from '@/src/local/types';
import { FormSheet, IconButton, PrimaryButton, StateView } from '@/src/shared/components';
import { colorWithAlpha } from '@/src/shared/color';
import { compactDateTime, confirmRemove, safeNoteText, ScreenShell, TextArea } from '@/src/shared/replicated';
import { colors, spacing, useThemeColors } from '@/src/shared/theme';
import { getTagHexColor, getTagSoftColor } from '@/src/features/settings/tagColors';
import { runManualSync } from '@/src/sync/manualSync';
import { getCurrentSession } from '@/src/sync/supabaseClient';
import { styles } from './styles';
import { allFilter, firstNoteTag, splitTags } from './utils';

const previewPanelHeight = 440;
const previewPanelRadius = 12;
const previewOpenDuration = 520;
const previewCloseDuration = 320;
const previewOpenEasing = Easing.bezier(0.18, 0.9, 0.22, 1);
const previewCloseEasing = Easing.bezier(0.4, 0, 0.2, 1);

type PreviewRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PreviewFrame = {
  origin: PreviewRect;
  target: PreviewRect;
};

type PreviewMeasureTarget = {
  getBoundingClientRect?: () => {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void;
};

function buildPreviewTargetFrame(windowSize: { width: number; height: number }): PreviewRect {
  const width = Math.max(1, Math.min(windowSize.width - spacing.lg * 2, 520));
  const height = Math.min(previewPanelHeight, Math.max(1, windowSize.height - spacing.xl * 2));
  return {
    x: (windowSize.width - width) / 2,
    y: Math.max(spacing.xl, (windowSize.height - height) / 2),
    width,
    height,
  };
}

export function QuickNoteScreen() {
  const themeColors = useThemeColors();
  const windowSize = useWindowDimensions();
  const [items, setItems] = useState<QuickNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [noteTagColors, setNoteTagColors] = useState<Record<string, string>>({});
  const [activeTag, setActiveTag] = useState(allFilter);
  const [draftContent, setDraftContent] = useState('');
  const [draftTag, setDraftTag] = useState('');
  const [editingNote, setEditingNote] = useState<QuickNote | null>(null);
  const [previewNote, setPreviewNote] = useState<QuickNote | null>(null);
  const [previewFrame, setPreviewFrame] = useState<PreviewFrame | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const longPressTriggeredRef = useRef(false);
  const previewAnimation = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setError(null);
    try {
      const [notes, settings] = await Promise.all([listNotesLocal(), getSettingsLocal()]);
      setItems(notes);
      setNoteTags(settings.note_tags);
      setNoteTagColors(settings.note_tag_colors);
      setDraftTag((current) => (current && settings.note_tags.includes(current) ? current : settings.note_tags[0]));
      setActiveTag((current) => (current === allFilter || settings.note_tags.includes(current) ? current : allFilter));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载简笔失败');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const filteredItems = useMemo(() => {
    if (activeTag === allFilter) return items;
    return items.filter((note) => splitTags(note.tags).includes(activeTag));
  }, [activeTag, items]);

  const filterTags = useMemo(() => [allFilter, ...noteTags], [noteTags]);
  const openCreate = () => {
    const initialTag = activeTag === allFilter ? noteTags[0] : activeTag;
    setEditingNote(null);
    setDraftContent('');
    setDraftTag(initialTag || noteTags[0] || '想法');
    bottomSheetRef.current?.present();
  };

  const openEdit = (note: QuickNote) => {
    setPreviewNote(null);
    setEditingNote(note);
    setDraftContent(safeNoteText(note.content));
    setDraftTag(firstNoteTag(note, noteTags));
    bottomSheetRef.current?.present();
  };

  const startPreviewAnimation = (note: QuickNote, origin: PreviewRect) => {
    const target = buildPreviewTargetFrame(windowSize);
    setPreviewFrame({ origin, target });
    previewAnimation.setValue(0);
    setPreviewNote(note);
    Animated.timing(previewAnimation, {
      duration: previewOpenDuration,
      easing: previewOpenEasing,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const fallbackPreviewOrigin = (event: GestureResponderEvent): PreviewRect => {
    const { locationX, locationY, pageX, pageY } = event.nativeEvent;
    const target = buildPreviewTargetFrame(windowSize);
    const cardWidth = Math.max(1, target.width * 0.485);
    return {
      x: pageX - locationX,
      y: pageY - locationY,
      width: cardWidth,
      height: cardWidth,
    };
  };

  const openPreview = (note: QuickNote, event: GestureResponderEvent) => {
    if (longPressTriggeredRef.current) return;
    const fallbackOrigin = fallbackPreviewOrigin(event);
    const currentTarget = event.currentTarget as unknown as PreviewMeasureTarget | null;
    const rect = currentTarget?.getBoundingClientRect?.();
    if (rect && rect.width > 0 && rect.height > 0) {
      startPreviewAnimation(note, {
        x: Number.isFinite(rect.left) ? rect.left : fallbackOrigin.x,
        y: Number.isFinite(rect.top) ? rect.top : fallbackOrigin.y,
        width: rect.width,
        height: rect.height,
      });
      return;
    }

    if (!currentTarget?.measureInWindow) {
      startPreviewAnimation(note, fallbackOrigin);
      return;
    }
    currentTarget.measureInWindow((x, y, width, height) => {
      startPreviewAnimation(note, {
        x: Number.isFinite(x) ? x : fallbackOrigin.x,
        y: Number.isFinite(y) ? y : fallbackOrigin.y,
        width: width > 0 ? width : fallbackOrigin.width,
        height: height > 0 ? height : fallbackOrigin.height,
      });
    });
  };

  const closePreview = () => {
    Animated.timing(previewAnimation, {
      duration: previewCloseDuration,
      easing: previewCloseEasing,
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      setPreviewNote(null);
      setPreviewFrame(null);
    });
  };

  const handleCardLongPress = (note: QuickNote) => {
    longPressTriggeredRef.current = true;
    openEdit(note);
  };

  const handleCardPressOut = () => {
    if (!longPressTriggeredRef.current) return;
    setTimeout(() => {
      longPressTriggeredRef.current = false;
    }, 250);
  };

  const closeSheet = () => {
    bottomSheetRef.current?.dismiss();
    setEditingNote(null);
    setDraftContent('');
    setDraftTag(noteTags[0] || '想法');
  };

  const saveNote = async () => {
    const content = draftContent.trim();
    if (!content || !draftTag || saving) return;
    setSaving(true);
    try {
      if (editingNote) await updateNoteLocal(editingNote.id, { content, tags: draftTag });
      else await createNoteLocal({ content, tags: draftTag });
      await load();
      closeSheet();
    } finally {
      setSaving(false);
    }
  };

  const removeNote = () => {
    if (!editingNote) return;
    confirmRemove('简笔', () => {
      void deleteNoteLocal(editingNote.id).then(async () => {
        await load();
        closeSheet();
      });
    });
  };

  const finishManualSync = async () => {
    const result = await runManualSync();
    if (result.status === 'signedOut') {
      router.push('/auth' as never);
      return;
    }
    await load();
    Alert.alert('同步完成', `上传 ${result.uploadedNotes} 条，本地更新 ${result.downloadedNotes} 条。`);
  };

  const syncNotes = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const session = await getCurrentSession();
      if (!session?.user) {
        router.push('/auth' as never);
        return;
      }

      const summary = await getLocalMergeSummary();
      if (summary.shouldConfirm) {
        const description = summary.noteCount > 0
          ? `本机有 ${summary.noteCount} 条未同步简笔。合并后会上传到当前账号。`
          : '本机有未同步的简笔类别设置。合并后会上传到当前账号。';
        setSyncing(false);
        Alert.alert('合并本机简笔？', description, [
          { text: '取消', style: 'cancel' },
          {
            text: '合并并同步',
            onPress: () => {
              setSyncing(true);
              void finishManualSync()
                .catch((err) => Alert.alert('同步失败', err instanceof Error ? err.message : '请稍后再试'))
                .finally(() => setSyncing(false));
            },
          },
        ]);
        return;
      }

      await finishManualSync();
    } catch (err) {
      Alert.alert('同步失败', err instanceof Error ? err.message : '请稍后再试');
    } finally {
      setSyncing(false);
    }
  };

  const fallbackPreviewFrame = useMemo(() => {
    const target = buildPreviewTargetFrame(windowSize);
    return {
      origin: { ...target, height: 1, width: 1 },
      target,
    };
  }, [windowSize]);

  const activePreviewFrame = previewFrame ?? fallbackPreviewFrame;
  const previewTranslateX = previewAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      activePreviewFrame.origin.x + activePreviewFrame.origin.width / 2 - activePreviewFrame.target.x - activePreviewFrame.target.width / 2,
      0,
    ],
  });
  const previewTranslateY = previewAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      activePreviewFrame.origin.y + activePreviewFrame.origin.height / 2 - activePreviewFrame.target.y - activePreviewFrame.target.height / 2,
      0,
    ],
  });
  const previewScaleX = previewAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.max(0.01, activePreviewFrame.origin.width / activePreviewFrame.target.width), 1],
  });
  const previewScaleY = previewAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.max(0.01, activePreviewFrame.origin.height / activePreviewFrame.target.height), 1],
  });
  const previewBackdropOpacity = previewAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const previewPanelOpacity = previewAnimation.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.18, 1] });
  const previewContentOpacity = previewAnimation.interpolate({ inputRange: [0, 0.14, 0.5, 1], outputRange: [0, 0, 0.92, 1] });

  const renderNoteCard = ({ item: note }: { item: QuickNote }) => {
    const tag = firstNoteTag(note, noteTags);
    const tagColor = getTagHexColor(tag, noteTagColors);
    const tagSoft = getTagSoftColor(tag, noteTagColors);
    return (
      <Pressable
        onLongPress={() => handleCardLongPress(note)}
        onPress={(event) => openPreview(note, event)}
        onPressOut={handleCardPressOut}
        style={[styles.noteCard, { backgroundColor: tagSoft, borderColor: tagColor }]}
      >
        <View pointerEvents="none" style={[styles.noteCardBorder, { borderColor: tagColor }]} />
        <View style={styles.noteCardBody}>
          <Text numberOfLines={5} style={styles.noteText}>{safeNoteText(note.content)}</Text>
          <View style={styles.noteFooter}>
            <View style={[styles.tagBadge, { backgroundColor: tagSoft }]}>
              <Text style={[styles.tagBadgeText, { color: tagColor }]}>{tag}</Text>
            </View>
            <Text style={styles.noteDate}>{compactDateTime(note.created_at)}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderQuickNoteEmpty = () => {
    if (error) return null;
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="create-outline" size={34} color={themeColors.primary} />
        <Text style={styles.emptyTitle}>还没有简笔</Text>
        <Text style={styles.emptyText}>点右下角按钮，把这一刻先记下来。</Text>
      </View>
    );
  };

  return (
    <ScreenShell
      title="简笔"
      onSettings={() => router.push('/settings')}
      rightAction={syncing ? <ActivityIndicator color={colors.text} /> : <IconButton name="sync-outline" label="手动同步简笔" transparent onPress={syncNotes} />}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroller} contentContainerStyle={styles.tagScrollerContent}>
        {filterTags.map((tag) => {
          const selected = tag === activeTag;
          const accent = tag === allFilter ? themeColors.primary : getTagHexColor(tag, noteTagColors);
          return (
            <Pressable
              key={tag}
              onPress={() => setActiveTag(tag)}
              style={[styles.filterPill, selected && { backgroundColor: colorWithAlpha(accent), borderColor: accent }]}
            >
              <Text style={[styles.filterPillText, selected && { color: accent }]}>{tag}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.content}
        data={!error ? filteredItems : []}
        initialNumToRender={10}
        keyExtractor={(note) => String(note.id)}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={renderQuickNoteEmpty}
        ListHeaderComponent={<StateView loading={false} error={error} onRetry={load} />}
        maxToRenderPerBatch={8}
        numColumns={2}
        renderItem={renderNoteCard}
        showsVerticalScrollIndicator={false}
        style={styles.flex}
        windowSize={7}
      />

      <View pointerEvents="box-none" style={styles.fabLayer}>
        <Pressable
          accessibilityLabel="添加简笔"
          accessibilityRole="button"
          onPress={() => {
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openCreate();
          }}
          style={({ pressed }) => [styles.fab, { backgroundColor: themeColors.primary, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.975 : 1 }] }]}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </Pressable>
      </View>

      <Modal visible={Boolean(previewNote)} transparent animationType="none" onRequestClose={closePreview}>
        <Pressable style={styles.previewOverlay} onPress={closePreview}>
          <Animated.View style={[styles.previewBackdrop, { opacity: previewBackdropOpacity }]} />
          {previewNote ? (
            <Animated.View
              style={[
                styles.previewPanel,
                {
                  borderRadius: previewPanelRadius,
                  height: activePreviewFrame.target.height,
                  left: activePreviewFrame.target.x,
                  opacity: previewPanelOpacity,
                  top: activePreviewFrame.target.y,
                  transform: [
                    { translateX: previewTranslateX },
                    { translateY: previewTranslateY },
                    { scaleX: previewScaleX },
                    { scaleY: previewScaleY },
                  ],
                  width: activePreviewFrame.target.width,
                },
              ]}
            >
              <BlurView intensity={28} tint="light" style={styles.previewGlass} />
              <Pressable style={styles.previewPanelContent} onPress={(event) => event.stopPropagation()}>
                <Animated.View style={[styles.previewContentFade, { opacity: previewContentOpacity }]}>
                  <View style={styles.previewHeader}>
                    <View style={[styles.tagBadge, { backgroundColor: getTagSoftColor(firstNoteTag(previewNote, noteTags), noteTagColors) }]}>
                      <Text style={[styles.tagBadgeText, { color: getTagHexColor(firstNoteTag(previewNote, noteTags), noteTagColors) }]}>
                        {firstNoteTag(previewNote, noteTags)}
                      </Text>
                    </View>
                    <Pressable accessibilityLabel="关闭简笔预览" accessibilityRole="button" onPress={closePreview} style={styles.previewClose}>
                      <Ionicons name="close" size={20} color={colors.textSoft} />
                    </Pressable>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false} style={styles.previewScroll}>
                    <Text style={styles.previewText}>{safeNoteText(previewNote.content)}</Text>
                  </ScrollView>
                  <Text style={styles.previewDate}>{compactDateTime(previewNote.created_at)}</Text>
                </Animated.View>
              </Pressable>
            </Animated.View>
          ) : null}
        </Pressable>
      </Modal>

      <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.sheetContent} lockHeight>
        <TextArea onChangeText={setDraftContent} placeholder="快速记录..." style={styles.noteInput} value={draftContent} />
        <Text style={styles.sheetLabel}>类别标签</Text>
        <View style={styles.tagPicker}>
          {noteTags.map((tag) => {
            const selected = draftTag === tag;
            const accent = getTagHexColor(tag, noteTagColors);
            return (
              <Pressable
                key={tag}
                onPress={() => setDraftTag(tag)}
                style={[styles.pickerPill, selected && { backgroundColor: colorWithAlpha(accent), borderColor: accent }]}
              >
                <Text style={[styles.pickerPillText, selected && { color: accent }]}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.actions}>
          {editingNote ? (
            <Pressable onPress={removeNote} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.deleteText}>删除</Text>
            </Pressable>
          ) : null}
          <PrimaryButton label="取消" tone="plain" onPress={closeSheet} />
          <View style={styles.flex}>
            <PrimaryButton disabled={!draftContent.trim() || saving} icon="checkmark" label={editingNote ? '保存' : '添加'} onPress={saveNote} />
          </View>
        </View>
      </FormSheet>
    </ScreenShell>
  );
}
