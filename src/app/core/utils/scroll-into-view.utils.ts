/** Rola até o elemento após o layout atualizar (ex.: ao abrir formulário de edição). */
export function scrollElementIntoView(element: HTMLElement | null | undefined): void {
  if (!element || typeof window === 'undefined') {
    return;
  }

  requestAnimationFrame(() => {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
