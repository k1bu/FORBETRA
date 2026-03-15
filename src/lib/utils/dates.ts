export const formatRelativeDays = (value: string | null | undefined): string => {
	if (!value) return '';
	const created = new Date(value);
	const diff = Date.now() - created.getTime();
	const days = Math.floor(diff / (24 * 60 * 60 * 1000));
	if (days <= 0) return 'Today';
	if (days === 1) return '1 day ago';
	if (days < 14) return `${days} days ago`;
	const weeks = Math.floor(days / 7);
	if (weeks < 8) return `${weeks} wk${weeks === 1 ? '' : 's'} ago`;
	return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(created);
};

export const formatDate = (value: string | null | undefined): string => {
	if (!value) return '';
	return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
};
