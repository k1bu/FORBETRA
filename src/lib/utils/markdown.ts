const ALLOWED_TAGS = /^<\/?(h[34]|strong|em|ul|ol|li|p|br)\b[^>]*>$/i;

function sanitizeHtml(html: string): string {
	return html.replace(/<\/?[^>]+(>|$)/g, (tag) => {
		if (!ALLOWED_TAGS.test(tag)) return '';
		return tag
			.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
			.replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
	});
}

export function renderMarkdown(text: string): string {
	let html = text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/^### (.+)$/gm, '<h4 class="font-semibold text-text-primary mt-3 mb-1">$1</h4>')
		.replace(/^## (.+)$/gm, '<h3 class="font-bold text-text-primary mt-4 mb-1">$1</h3>')
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.+?)\*/g, '<em>$1</em>')
		.replace(/^[-*]\s+(.+)$/gm, '<li class="ul-item">$1</li>')
		.replace(
			/((?:<li class="ul-item">.*<\/li>\n?)+)/g,
			(match) => `<ul class="list-disc pl-4 space-y-1">${match}</ul>`
		)
		.replace(/^\d+\.\s(.+)$/gm, '<li class="ol-item">$1</li>')
		.replace(
			/((?:<li class="ol-item">.*<\/li>\n?)+)/g,
			(match) => `<ol class="list-decimal pl-4 space-y-1">${match}</ol>`
		);

	// Wrap non-block lines in <p> tags (avoid wrapping block elements)
	html = html
		.split('\n\n')
		.map((block) => {
			const trimmed = block.trim();
			if (!trimmed) return '';
			if (/^<(h[34]|ul|ol)[\s>]/i.test(trimmed)) return trimmed;
			return `<p class="mt-2">${trimmed.replace(/\n/g, '<br/>')}</p>`;
		})
		.join('\n');

	return sanitizeHtml(html);
}
