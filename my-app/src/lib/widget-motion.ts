export type WidgetMotion = 'none' | 'fade' | 'slide' | 'pop' | 'bounce'
export type WidgetMotionConfig = { openAnimation?: WidgetMotion; sentAnimation?: WidgetMotion; receivedAnimation?: WidgetMotion }
export function getWidgetMotionClasses(config?: WidgetMotionConfig) {
 const allowed = ['none', 'fade', 'slide', 'pop', 'bounce']
 const safe = (value: string | undefined) => allowed.includes(value || '') ? value : 'none'
 return 'motion-open-' + safe(config?.openAnimation) + ' motion-sent-' + safe(config?.sentAnimation) + ' motion-received-' + safe(config?.receivedAnimation)
}
