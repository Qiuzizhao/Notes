import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { SheetTextInput, sharedComponentStyles } from '@/src/shared/components';
import { colors, useThemeColors } from '@/src/shared/theme';
import { styles } from './styles';
import { getTagHexColor, getTagSoftColor, SETTINGS_PRESET_COLORS } from './tagColors';

export function NoteTagEditor({
  items,
  noteTagColors = {},
  isEditing,
  onAdd,
  onRemove,
  onColorChange,
}: {
  items: string[];
  noteTagColors?: Record<string, string>;
  isEditing: boolean;
  onAdd: (value: string, color?: string) => void;
  onRemove: (value: string) => void;
  onColorChange: (item: string, color: string) => void;
}) {
  const themeColors = useThemeColors();
  const [showModal, setShowModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [newValue, setNewValue] = useState('');
  const [selectedColor, setSelectedColor] = useState(themeColors.primary);

  const handleAdd = () => {
    const value = newValue.trim();
    if (!value) return;
    onAdd(value, selectedColor);
    setNewValue('');
    setSelectedColor(themeColors.primary);
    setShowModal(false);
  };

  const openColorPicker = (item: string) => {
    if (isEditing) return;
    setSelectedItem(item);
    setShowColorModal(true);
  };

  const handleColorSelect = (color: string) => {
    if (!selectedItem) return;
    onColorChange(selectedItem, color);
    setShowColorModal(false);
    setSelectedItem(null);
  };

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.classTypeGrid}>
        {items.map((item) => {
          const customColor = getTagHexColor(item, noteTagColors);
          const softColor = getTagSoftColor(item, noteTagColors);

          return (
            <Pressable
              key={item}
              onPress={() => openColorPicker(item)}
              style={({ pressed }) => [
                styles.classTypeCard,
                { backgroundColor: colors.surface },
                pressed && !isEditing && { backgroundColor: softColor },
              ]}
            >
              <View style={styles.classTypeInfo}>
                <View style={[styles.classTypeIcon, { backgroundColor: softColor }]}>
                  <Ionicons name="pricetag" size={18} color={customColor} />
                </View>
                <Text numberOfLines={1} style={[styles.classTypeName, { color: colors.text }]}>{item}</Text>
                <View style={{ backgroundColor: customColor, borderRadius: 2, height: 4, marginTop: 2, width: 12 }} />
              </View>
              {isEditing ? (
                <Pressable
                  hitSlop={10}
                  onPress={() => onRemove(item)}
                  style={({ pressed }) => [styles.classTypeDelete, pressed && { backgroundColor: colors.dangerSoft }]}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </Pressable>
              ) : null}
            </Pressable>
          );
        })}

        {isEditing ? (
          <Pressable
            onPress={() => setShowModal(true)}
            style={({ pressed }) => [
              styles.classTypeCard,
              {
                backgroundColor: 'transparent',
                borderColor: themeColors.primary,
                borderStyle: 'dashed',
                borderWidth: 1,
                elevation: 0,
                shadowOpacity: 0,
              },
              pressed && { backgroundColor: themeColors.primarySoft },
            ]}
          >
            <View style={styles.classTypeInfo}>
              <View style={[styles.classTypeIcon, { backgroundColor: themeColors.primary }]}>
                <Ionicons name="add" size={24} color={colors.surface} />
              </View>
              <Text style={[styles.classTypeName, { color: themeColors.primary }]}>新增标签</Text>
            </View>
          </Pressable>
        ) : null}
      </View>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <Pressable style={sharedComponentStyles.pickerOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={[sharedComponentStyles.pickerPanel, styles.classAddPanel]} onPress={(event) => event.stopPropagation()}>
            <Text style={sharedComponentStyles.pickerTitle}>新增简笔标签</Text>
            <View style={{ height: 12 }} />
            <SheetTextInput
              autoFocus
              onChangeText={setNewValue}
              onSubmitEditing={handleAdd}
              placeholder="请输入新的简笔标签"
              sheet={false}
              style={sharedComponentStyles.input}
              value={newValue}
            />

            <View style={{ marginTop: 20 }}>
              <View style={styles.classAddColorGrid}>
                {SETTINGS_PRESET_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: color,
                        borderColor: selectedColor === color ? colors.text : 'transparent',
                        borderRadius: 16,
                        borderWidth: 2,
                        height: 32,
                        width: 32,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={sharedComponentStyles.pickerFooter}>
              <Pressable
                onPress={() => setShowModal(false)}
                style={({ pressed }) => [{ borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }, pressed && { backgroundColor: colors.surfaceMuted }]}
              >
                <Text style={{ color: colors.textSoft, fontWeight: '700' }}>取消</Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [{ backgroundColor: themeColors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 }, pressed && { opacity: 0.8 }]}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>添加标签</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showColorModal} transparent animationType="fade" onRequestClose={() => setShowColorModal(false)}>
        <Pressable style={sharedComponentStyles.pickerOverlay} onPress={() => setShowColorModal(false)}>
          <Pressable style={[sharedComponentStyles.pickerPanel, styles.colorPickerPanel]} onPress={(event) => event.stopPropagation()}>
            <Text style={sharedComponentStyles.pickerTitle}>选择标签颜色</Text>
            <View style={{ height: 12 }} />
            <View style={styles.colorPickerGrid}>
              {SETTINGS_PRESET_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => handleColorSelect(color)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: color,
                      borderColor: noteTagColors[selectedItem || ''] === color ? colors.text : 'transparent',
                      borderRadius: 19,
                      borderWidth: 2,
                      height: 38,
                      width: 38,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                />
              ))}
            </View>
            <View style={[sharedComponentStyles.pickerFooter, styles.colorPickerFooter]}>
              <Pressable
                onPress={() => setShowColorModal(false)}
                style={({ pressed }) => [{ borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }, pressed && { backgroundColor: colors.surfaceMuted }]}
              >
                <Text style={{ color: colors.textSoft, fontWeight: '700' }}>关闭</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
