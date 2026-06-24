import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Header, IconButton, Screen, StateView } from '@/src/shared/components';
import { useThemeColors } from '@/src/shared/theme';
import { getSettingsLocal, saveSettingsLocal } from '@/src/local/settingsRepository';
import type { NoteSettings } from '@/src/local/types';
import { NoteTagEditor } from './NoteTagEditor';
import { styles } from './styles';

export function NoteCategorySettingsScreen() {
  const themeColors = useThemeColors();
  const [settings, setSettings] = useState<NoteSettings>({ note_tags: [], note_tag_colors: {} });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSettings(await getSettingsLocal());
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载设置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = async (nextSettings: NoteSettings) => {
    setSaving(true);
    setSettings(nextSettings);
    try {
      const saved = await saveSettingsLocal(nextSettings);
      setSettings(saved);
    } catch (err) {
      Alert.alert('保存失败', err instanceof Error ? err.message : '请稍后重试');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = (value: string, color?: string) => {
    if (settings.note_tags.includes(value)) return;
    const nextSettings = {
      ...settings,
      note_tags: [...settings.note_tags, value],
      note_tag_colors: color
        ? { ...settings.note_tag_colors, [value]: color }
        : settings.note_tag_colors,
    };
    void persist(nextSettings);
  };

  const handleRemove = (value: string) => {
    if (settings.note_tags.length <= 1) {
      Alert.alert('至少保留一个类别', '简笔需要至少一个类别。');
      return;
    }
    const nextColors = Object.fromEntries(Object.entries(settings.note_tag_colors).filter(([item]) => item !== value));
    void persist({
      note_tags: settings.note_tags.filter((item) => item !== value),
      note_tag_colors: nextColors,
    });
  };

  const handleColorChange = (item: string, color: string) => {
    void persist({
      ...settings,
      note_tag_colors: {
        ...settings.note_tag_colors,
        [item]: color,
      },
    });
  };

  return (
    <Screen>
      <Header
        title="简笔类别"
        action={<IconButton name="chevron-back" label="返回设置" transparent onPress={() => router.back()} />}
        rightAction={(
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => setIsEditing((current) => !current)}
            style={({ pressed }) => [styles.headerEditButton, pressed && styles.cardPressed, saving && styles.headerEditButtonDisabled]}
          >
            <Text numberOfLines={1} style={[styles.headerEditButtonText, { color: themeColors.primary }]}>{saving ? '保存中' : isEditing ? '完成' : '编辑'}</Text>
          </Pressable>
        )}
      />
      <View style={styles.background}>
        <StateView loading={loading} error={error} onRetry={load} />
        {!loading && !error ? (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.helperCard}>
              <View style={styles.settingRowHeader}>
                <Ionicons name="pricetags-outline" size={18} color={themeColors.primary} />
                <Text style={styles.helperTitle}>简笔类别</Text>
              </View>
              <Text style={styles.helperText}>管理简笔页面的标签。普通模式点标签可以改颜色，编辑模式可以新增或删除。</Text>
            </View>
            <View style={styles.detailContent}>
              <NoteTagEditor
                items={settings.note_tags}
                noteTagColors={settings.note_tag_colors}
                isEditing={isEditing}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onColorChange={handleColorChange}
              />
            </View>
            <View style={styles.bottomSpacer} />
          </ScrollView>
        ) : null}
      </View>
    </Screen>
  );
}
