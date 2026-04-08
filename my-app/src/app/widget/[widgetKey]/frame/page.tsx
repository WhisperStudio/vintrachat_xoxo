import LiveChatWidget from '@/components/chat/LiveChatWidget'

export default async function WidgetFramePage({
  params,
}: {
  params: Promise<{ widgetKey: string }>
}) {
  const { widgetKey } = await params

  return <LiveChatWidget widgetKey={widgetKey} />
}
