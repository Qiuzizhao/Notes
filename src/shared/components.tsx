import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, useThemeColors } from './theme';

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.brandSoft,
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  headerSide: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
  },
  headerText: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconButtonTransparent: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  button: {
    alignItems: 'center',
    borderRadius: radius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.xl,
  },
  buttonPlain: {
    backgroundColor: colors.primarySoft,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  bottomSheetBg: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
  },
  bottomSheetIndicator: {
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 4,
    marginTop: 8,
    width: 40,
  },
  sheetContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    color: colors.text,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  pickerOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.24)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pickerPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 360,
    padding: spacing.lg,
    width: '100%',
  },
  pickerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  pickerFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  stateView: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});

export function Screen({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" backgroundColor={colors.brandSoft} translucent />
      <View style={{ backgroundColor: colors.brandSoft, height: insets.top }} />
      {children}
    </View>
  );
}

export function Header({
  title,
  action,
  rightAction,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  rightAction?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>{action}</View>
      <View style={styles.headerText}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
      </View>
      <View style={styles.headerSide}>{rightAction}</View>
    </View>
  );
}

export function IconButton({
  name,
  onPress,
  color,
  label,
  transparent,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  label?: string;
  transparent?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, transparent && styles.iconButtonTransparent, pressed && styles.pressed]}
    >
      <Ionicons name={name} size={21} color={color || colors.text} />
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  tone = 'primary',
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  tone?: 'primary' | 'danger' | 'plain';
  style?: object | object[];
}) {
  const themeColors = useThemeColors();
  const plain = tone === 'plain';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: themeColors.primary },
        tone === 'danger' && styles.buttonDanger,
        plain && [styles.buttonPlain, { backgroundColor: themeColors.primarySoft }],
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <View style={styles.buttonContent}>
        {icon ? <Ionicons name={icon} size={18} color={plain ? themeColors.primary : '#fff'} /> : null}
        <Text style={[styles.buttonText, plain && { color: themeColors.primary }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function FormSheet({
  bottomSheetRef,
  children,
  snapPoints = ['85%'],
  contentStyle,
  lockHeight = false,
}: PropsWithChildren<{
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  snapPoints?: string[];
  contentStyle?: object;
  lockHeight?: boolean;
}>) {
  const appStateRef = useRef(AppState.currentState);
  const sheetOpenRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const subscription = AppState.addEventListener('change', (nextState) => {
      const leavingActive = appStateRef.current === 'active' && nextState !== 'active';
      if (leavingActive) Keyboard.dismiss();
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={0}
      enableDynamicSizing={!lockHeight}
      enableOverDrag={!lockHeight}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />}
      backgroundStyle={styles.bottomSheetBg}
      handleIndicatorStyle={styles.bottomSheetIndicator}
      onChange={(index) => {
        sheetOpenRef.current = index >= 0;
      }}
    >
      <BottomSheetScrollView contentContainerStyle={[styles.sheetContent, contentStyle]} keyboardShouldPersistTaps="handled">
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

export function SheetTextInput({ value, onChangeText, onBlur, sheet = true, ...props }: TextInputProps & { sheet?: boolean }) {
  const [localValue, setLocalValue] = useState(value == null ? '' : String(value));
  const localValueRef = useRef(localValue);
  const composingRef = useRef(false);
  const InputComponent = sheet && Platform.OS !== 'web' ? BottomSheetTextInput : TextInput;

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

  const inputProps: TextInputProps & Record<string, unknown> = {
    ...props,
    value: localValue,
    onChangeText: (text: string) => {
      if (Platform.OS === 'web' && composingRef.current) {
        syncText(text);
        return;
      }
      syncText(text);
      onChangeText?.(text);
    },
    onBlur: (event) => {
      composingRef.current = false;
      onChangeText?.(localValueRef.current);
      onBlur?.(event);
    },
    placeholderTextColor: colors.faint,
    style: [styles.input, props.style],
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

  return <InputComponent {...inputProps} />;
}

export function StateView({
  loading,
  error,
  onRetry,
}: {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (!loading && !error) return null;
  return (
    <View style={styles.stateView}>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text selectable style={styles.stateText}>{error}</Text> : null}
      {error && onRetry ? <PrimaryButton label="重试" tone="plain" onPress={onRetry} /> : null}
    </View>
  );
}

export const sharedComponentStyles = styles;
