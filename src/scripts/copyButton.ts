interface CopyCommandEvent extends Event {
  readonly command: string;
  readonly source: Element | null;
}

const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
let lastMessage = '';
let initialized = false;

function legacyCopy(text: string): boolean {
  const field = Object.assign(document.createElement('textarea'), { value: text });
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
  document.body.append(field);
  field.select();
  try {
    return document.execCommand('copy');
  } finally {
    field.remove();
  }
}

function report(button: HTMLElement, ok: boolean): void {
  const tip = button.nextElementSibling as HTMLElement | null;
  const pending = timers.get(button);
  if (pending) clearTimeout(pending);

  button.removeAttribute('data-copied');
  button.removeAttribute('data-failed');

  let message = ok ? 'Copied' : 'Copy failed';
  if (message === lastMessage) {
    message += '\u00A0';
  }
  lastMessage = message;

  if (tip) {
    tip.textContent = '';
  }
  void button.offsetWidth;
  button.setAttribute(ok ? 'data-copied' : 'data-failed', '');

  requestAnimationFrame(() => {
    if (tip) {
      tip.textContent = message;
    }
  });

  timers.set(
    button,
    setTimeout(() => {
      button.removeAttribute('data-copied');
      button.removeAttribute('data-failed');
      if (tip) {
        tip.textContent = '';
      }
    }, 2000)
  );
}

async function copyFromTarget(button: HTMLElement, target: HTMLElement): Promise<void> {
  const rawText =
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
      ? target.value
      : (target.dataset.copyValue ?? target.innerText);
  const text = rawText.trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    report(button, true);
  } catch {
    if (legacyCopy(text)) {
      report(button, true);
    } else {
      report(button, false);
    }
  }
}

export function initCopyButtons(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  if ('CommandEvent' in window) {
    document.addEventListener(
      'command',
      (rawEvent: Event) => {
        const event = rawEvent as CopyCommandEvent;
        if (!event.command?.startsWith('--copy')) return;
        const source = event.source instanceof HTMLElement ? event.source : null;
        const target = event.target instanceof HTMLElement ? event.target : null;
        if (source && target) {
          void copyFromTarget(source, target);
        }
      },
      true
    );
  } else {
    document.addEventListener('click', (event: MouseEvent) => {
      const clickTarget = event.target instanceof Element ? event.target : null;
      const button = clickTarget?.closest<HTMLButtonElement>('button[command^="--copy"]');
      if (!button) return;
      const targetId = button.getAttribute('commandfor');
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (target) {
        void copyFromTarget(button, target);
      }
    });
  }
}
