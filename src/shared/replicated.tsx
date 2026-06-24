import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, TextInput } from 'react-native';

import { Header, IconButton, Screen } from './components';
import { colors, spacing } from './theme';

export const compactDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const safeNoteText = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (!value) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export function ScreenShell({
  title,
  onSettings,
  rightAction,
  children,
}: {
  title: string;
  subtitle?: string;
  onSettings?: () => void;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Screen>
      <Header
        title={title}
        action={onSettings ? <IconButton name="settings-outline" label="简笔类别设置" transparent onPress={onSettings} /> : undefined}
        rightAction={rightAction}
      />
      {children}
    </Screen>
  );
}

export function TextArea(props: React.ComponentProps<typeof BottomSheetTextInput>) {
  const { value, onChangeText, onBlur, ...rest } = props;
  const [localValue, setLocalValue] = useState(value == null ? '' : String(value));
  const localValueRef = useRef(localValue);
  const composingRef = useRef(false);
  const InputComponent = Platform.OS === 'web' ? TextInput : BottomSheetTextInput;

  useEffect(() => {
    if (composingRef.current) return;
    const nextValue = value == null ? '' : String(value);
    localValueRef.current = nextValue;
    setLocalValue(nextValue);
  }, [value]);

  const syncText = (text: string) => {
    localValueRef.current = text;
    setLocalValue(text);
  };

  const inputProps: Record<string, unknown> = {
    ...rest,
    value: localValue,
    placeholderTextColor: colors.faint,
    multiline: true,
    scrollEnabled: false,
    textAlignVertical: 'top',
    style: [styles.input, styles.textArea, props.style],
    onChangeText: (text: string) => {
      if (Platform.OS === 'web' && composingRef.current) {
        syncText(text);
        return;
      }
      syncText(text);
      onChangeText?.(text);
    },
    onBlur: (event: unknown) => {
      composingRef.current = false;
      onChangeText?.(localValueRef.current);
      onBlur?.(event as never);
    },
  };

  if (Platform.OS === 'web') {
    inputProps.onCompositionStart = () => {
      composingRef.current = true;
    };
    inputProps.onCompositionEnd = (event: any) => {
      composingRef.current = false;
      const text = String(event?.currentTarget?.value ?? event?.target?.value ?? localValueRef.current);
      syncText(text);
      onChangeText?.(text);
    };
  }

  return <InputComponent {...(inputProps as any)} />;
}

export function confirmRemove(label: string, onConfirm: () => void) {
  Alert.alert('删除确认', `确定删除「${label}」吗？`, [
    { text: '取消', style: 'cancel' },
    { text: '删除', style: 'destructive', onPress: onConfirm },
  ]);
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    color: colors.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  textArea: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
});
