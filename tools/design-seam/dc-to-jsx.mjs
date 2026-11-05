// SPIKE: convert one .dc.html section into a React scaffold — JSX from the
// markup, a prop type from `data-props`. It does NOT port the Component class's
// behaviour; it extracts structure so you only hand-write the interactions.
//
//   node tools/design-seam/dc-to-jsx.mjs <file.dc.html> [ComponentName] > Out.tsx
//
// Proof-of-concept quality: the output won't compile as-is (void elements,
// binding placeholders, design-system imports), it's a starting point. The
// point is to show the download direction CAN be scaffolded the way the upload
// direction (DesignSync) already is.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const file = process.argv[2];
if (!file) {
	console.error('usage: dc-to-jsx.mjs <file.dc.html> [ComponentName]');
	process.exit(1);
}
const name = process.argv[3] || 'Scaffold';
const src = readFileSync(file, 'utf8');

// --- props from data-props (HTML-entity-decoded JSON) ---
let props = {};
const dp = src.match(/data-props="([^"]*)"/);
if (dp) {
	try {
		props = JSON.parse(
			dp[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'"),
		);
	} catch {
		/* leave props empty */
	}
}

// --- isolate the <x-dc> template, drop helmet + scripts ---
const m = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/);
let body = (m ? m[1] : src)
	.replace(/<helmet>[\s\S]*?<\/helmet>/g, '')
	.replace(/<script[\s\S]*?<\/script>/g, '');

const camel = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const styleToObj = (css) =>
	`{{ ${css
		.split(';')
		.map((s) => s.trim())
		.filter(Boolean)
		.map((decl) => {
			const i = decl.indexOf(':');
			return `${JSON.stringify(camel(decl.slice(0, i).trim()))}: ${JSON.stringify(decl.slice(i + 1).trim())}`;
		})
		.join(', ')} }}`;

body = body
	.replace(/style="([^"]*)"/g, (_, css) => `style=${styleToObj(css)}`)
	.replace(/\bclass=/g, 'className=')
	// sc-for / sc-if control flow -> JSX expressions
	.replace(
		/<sc-for[^>]*list="\{\{\s*([^}]+?)\s*\}\}"[^>]*\bas="([^"]+)"[^>]*>/g,
		'{props.$1?.map(($2, i) => (<>',
	)
	.replace(/<\/sc-for>/g, '</>))}')
	.replace(/<sc-if[^>]*value="\{\{\s*([^}]+?)\s*\}\}"[^>]*>/g, '{props.$1 && (<>')
	.replace(/<\/sc-if>/g, '</>)}')
	// dc-import / x-import -> component tags
	.replace(
		/<dc-import\s+name="([^"]+)"([^>]*?)\/?>(?:\s*<\/dc-import>)?/g,
		(_, n, rest) => `<${n.replace(/\s+/g, '')}${rest ? ' ' + rest.trim() : ''} />`,
	)
	.replace(
		/<x-import[^>]*component-from-global-scope="StavridisCodes\.([^"]+)"([^>]*?)>(?:\s*<\/x-import>)?/g,
		(_, n, rest) => `<${n}${rest ? ' ' + rest.trim() : ''} />`,
	)
	// {{ binding }} -> placeholder comment so it's obvious what to wire up
	// (skip style objects, which are already {{ … }} with "key": "value" pairs)
	.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (full, e) =>
		e.includes('":') ? full : `{/* ${e.trim()} */ null}`,
	)
	.replace(/\s(ref|hint-size|hint-placeholder-count|hint-placeholder-val|data-dc-figure|data-dc-cite)="[^"]*"/g, '')
	.trim();

const tsProps =
	Object.entries(props)
		.filter(([k]) => !k.startsWith('$'))
		.map(([k, v]) => `\t${k}?: ${(v && v.tsType) || 'unknown'};`)
		.join('\n') || '\t// no data-props';

process.stdout.write(
	`// SCAFFOLD from ${basename(file)} — STRUCTURE ONLY. Port the Component class's\n` +
		`// behaviour by hand; wire the {/* … */} placeholders to real props/state.\n\n` +
		`type ${name}Props = {\n${tsProps}\n};\n\n` +
		`export function ${name}(_props: ${name}Props) {\n\treturn (\n\t\t<>\n` +
		body
			.split('\n')
			.map((l) => '\t\t\t' + l)
			.join('\n') +
		`\n\t\t</>\n\t);\n}\n`,
);
