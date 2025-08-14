export function shimmer(width: number, height: number) {
	return `data:image/svg+xml;base64,${btoa(
		`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
			<defs>
				<linearGradient id="g">
					<stop stop-color="#f3f4f6" offset="20%"/>
					<stop stop-color="#e5e7eb" offset="50%"/>
					<stop stop-color="#f3f4f6" offset="70%"/>
				</linearGradient>
			</defs>
			<rect width="${width}" height="${height}" fill="#f3f4f6"/>
			<rect id="r" width="${width}" height="${height}" fill="url(#g)"/>
			<animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1s" repeatCount="indefinite"  />
		</svg>`
	)}`;
}

