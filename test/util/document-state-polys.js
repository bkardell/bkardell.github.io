const thenify = (type, readyState) => new Promise((resolve) => {
	const listener = () => {
		if (readyState.test(document.readyState)) {
			document.removeEventListener(type, listener);

			resolve();
		}
	};

	document.addEventListener(type, listener);

	listener();
});

// export thenfied parsed, contentLoaded, and loaded
document._state = {
	parsed: thenify('readystatechange', /^(?:interactive|complete)$/),
	contentLoaded: thenify('DOMContentLoaded', /^(?:interactive|complete)$/),
	loaded: thenify('readystatechange', /^complete$/)
}