export default function TestPage ({ children }: {
	children: React.ReactNode,
}) {
	return (
		<div>
			Hello I am a real component yes.
			{children}
		</div>
	)
}
