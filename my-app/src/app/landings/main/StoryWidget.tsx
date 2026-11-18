'use client'

import WidgetPreview from '@/app/landings/auth/chatWidget/components/WidgetPreview'

type Message = { id: string; text: string; isBot: boolean; role?: 'assistant' | 'user' | 'system' }

/** Uses the same renderer as the installed widget and the design studio. */
export default function StoryWidget({ language, step, onOpen, onClose }: {
  language: 'no' | 'en'
  step: number
  onOpen?: () => void
  onClose?: () => void
}) {
  const no = language === 'no'
  const messages: Message[] = [
    { id: 'welcome', isBot: true, text: no ? 'Hei! Jeg hjelper deg med spørsmål om Fjord Studio. Hva lurer du på?' : 'Hi! I can help with questions about Fjord Studio. What would you like to know?' },
    { id: 'question', isBot: false, text: no ? 'Kan dere hjelpe oss med å innrede et lite kontor?' : 'Can you help us design a small office?' },
  ]
  if (step >= 2) messages.shift()
  if (step >= 2) messages.push({ id: 'answer', isBot: true, text: no ? 'Ja! Fjord Studio hjelper med planløsning og interiør for mindre kontorer. Vi starter med å forstå hvordan dere vil bruke rommet. Vil du at teamet følger opp?' : 'Yes! Fjord Studio helps with layouts and interiors for small offices. We start by understanding how you will use the space. Would you like the team to follow up?' })
  if (step >= 3) messages.push(
    { id: 'request', isBot: false, text: no ? 'Ja takk, kan noen kontakte meg?' : 'Yes please, can someone contact me?' },
    { id: 'handoff', isBot: true, text: no ? 'Selvfølgelig. Samtalen er merket for oppfølging i dette eksemplet. Teamet har med seg det vi allerede har snakket om.' : 'Of course. This example conversation is flagged for follow-up. The team has the context of what we have discussed.' },
  )
  return <div className="storyActualWidget" data-open={step > 0} inert>
    <WidgetPreview
      containedPreview
      previewTranslationEnabled={false}
      localization={{ enabled: false, defaultLanguage: language, allowedLanguages: [language] }}
      variant="embedded"
      previewMode="desktop"
      plan="pro"
      position="bottom-right"
      colorTheme="corporate"
      bubbleStyle={{ showStatus: true, iconChoice: 'chat', borderType: 'rounded', shadowType: 'light', animationType: 'none', sizeType: 'medium' }}
      headerStyle={{ showStatus: false, showCloseButton: true, borderType: 'none', cornerStyle: 'rounded', shadowType: 'none', showAvatar: true, showTitle: true }}
      bodyStyle={{ borderType: 'none', shadowType: 'none', messageStyle: 'bubble', showTimestamps: false, showReadReceipts: false, showConversationCards: false, conversationCardsLayout: 'list', conversationCardsStyle: 'modern' }}
      footerStyle={{ showSendButton: true, borderType: 'none', cornerStyle: 'rounded', shadowType: 'none', inputStyle: 'rounded', showPlaceholder: true }}
      assistantIcons={{ launcherIcon: 'FiMessageCircle', avatarIcon: 'FiMessageCircle', sendIcon: 'FiSend', closeIcon: 'FiX' }}
      appearance={{ openAnimation: 'fade', sentAnimation: 'slide', receivedAnimation: 'fade', glassLookEnabled: false }}
      customBranding={{ title: 'VintraChat', description: no ? 'Fjord Studio · Vi hjelper deg videre' : 'Fjord Studio · Here to help', logo: '/image/logo.png' }}
      settings={{ autoOpen: false, delayMs: 0 }}
      openOverride={step > 0}
      onToggleOpen={() => {}}
      messagesOverride={messages}
      disableInput
      disableSend
      bubbleActivityState={step === 1 ? 'replying' : 'idle'}
      humanSupportStatus={step >= 3 ? 'needs-human' : 'none'}
      statusText=""
      supportEnabled={false}
    />
  </div>
}
