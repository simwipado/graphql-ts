export default function invariant(condition: any, message?: string): void {
  const booleanCondition = Boolean(condition);
  // istanbul ignore else (see transformation done in './resources/inlineInvariant.js')
  if (!booleanCondition) {
    throw new Error(
      message != null ? message : 'Unexpected invariant triggered.',
    );
  }
}
