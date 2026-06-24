import { StyleSheet } from 'react-native';

import { colors, radius, shadow, spacing } from '@/src/shared/theme';

export const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    gap: spacing.md,
    maxWidth: 430,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    width: '100%',
  },
  detailContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  helperCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  helperTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  helperText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  settingRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 60,
    padding: spacing.md,
  },
  settingIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  settingRowText: {
    flex: 1,
  },
  settingRowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bottomSpacer: {
    height: 40,
  },
  sectionBlock: {
    marginTop: spacing.xs,
  },
  classTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  classTypeCard: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 86,
    padding: spacing.md,
    width: '48.5%',
    ...shadow,
  },
  classTypeInfo: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  classTypeIcon: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  classTypeName: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    maxWidth: '100%',
    textAlign: 'center',
  },
  classTypeDelete: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 28,
  },
  classAddPanel: {
    maxWidth: 360,
  },
  classAddColorGrid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: 242,
  },
  colorPickerPanel: {
    maxWidth: 360,
    paddingHorizontal: spacing.xl,
  },
  colorPickerGrid: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: 278,
  },
  colorPickerFooter: {
    alignSelf: 'center',
    width: 278,
  },
  headerEditButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 56,
  },
  headerEditButtonDisabled: {
    opacity: 0.55,
  },
  headerEditButtonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardPressed: {
    opacity: 0.78,
  },
});
