import Anthropic from '@anthropic-ai/sdk';

declare global {
	var __anthropic: Anthropic | undefined;
}

const anthropic =
	globalThis.__anthropic ??
	new Anthropic({
		apiKey: process.env.ANTHROPIC_API_KEY
	});

if (process.env.NODE_ENV !== 'production') {
	globalThis.__anthropic = anthropic;
}

export default anthropic;
