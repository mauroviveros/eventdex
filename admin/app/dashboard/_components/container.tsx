import Header from "./header"

export default function Container({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <>
      <Header>
        <hgroup className="flex flex-col">
          <h1 className="text-xl leading-5 font-bold">{title}</h1>
          {subtitle && <p className="text-sm leading-4 text-muted-foreground">{subtitle}</p>}
        </hgroup>
      </Header>
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </>
  )
}
