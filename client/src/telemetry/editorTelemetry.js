export function createEditorTelemetry({ manager, editor }) {
  let hasKeypress = false;
  let isTyping = false;
  let isIdle = false;
  let typingTimer = null;
  let previousValue = editor.getValue();

  const stopTyping = () => {
    if (!isTyping) return;
    isTyping = false;
    manager.recordEvent('typing_stopped');
    isIdle = true;
    manager.recordEvent('idle_started');
  };

  const changeDisposable = editor.onDidChangeModelContent((change) => {
    if (!hasKeypress) {
      hasKeypress = true;
      manager.recordEvent('first_keypress');
    }
    if (!isTyping) {
      if (isIdle) {
        isIdle = false;
        manager.recordEvent('idle_ended');
      }
      isTyping = true;
      manager.recordEvent('typing_started');
    }
    window.clearTimeout(typingTimer);
    typingTimer = window.setTimeout(stopTyping, 1000);

    const nextValue = editor.getValue();
    const inserted = change.changes.reduce((total, item) => total + item.text.length, 0);
    const deleted = change.changes.reduce((total, item) => total + (item.rangeLength || 0), 0);
    manager.recordEvent('code_changed', {
      changeCount: change.changes.length,
      inserted,
      deleted,
      characterDelta: nextValue.length - previousValue.length,
    });
    if (change.changes.some((item) => item.text.length === 0 && item.rangeLength > 0)) {
      manager.recordEvent('backspace', { deleted });
    }
    previousValue = nextValue;
  });

  const pasteDisposable = editor.onDidPaste?.((event) => {
    manager.recordEvent('paste', { rangeCount: event.range?.length || 0 });
  });
  const undoDisposable = editor.onDidExecuteCommand?.((event) => {
    if (event.commandId === 'undo') manager.recordEvent('undo');
    if (event.commandId === 'redo') manager.recordEvent('redo');
  });

  return () => {
    window.clearTimeout(typingTimer);
    stopTyping();
    changeDisposable.dispose();
    pasteDisposable?.dispose?.();
    undoDisposable?.dispose?.();
  };
}
