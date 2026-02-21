export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
	id: string;
	message: string;
	type: ToastType;
};

let nextId = 0;

export const toasts = $state<Toast[]>([]);

export function addToast(message: string, type: ToastType = 'info', duration = 4000) {
	const id = String(++nextId);
	toasts.push({ id, message, type });
	setTimeout(() => removeToast(id), duration);
}

export function removeToast(id: string) {
	const index = toasts.findIndex((t) => t.id === id);
	if (index !== -1) toasts.splice(index, 1);
}
