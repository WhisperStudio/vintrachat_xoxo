'use client'

import { useState } from 'react'
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiChevronRight, FiPlus, FiX } from 'react-icons/fi'
import type { ChatAssistantConfig, ChatWidgetConfig } from '@/types/database'
import { getActiveStudioModules, getStudioModuleStatus, STUDIO_MODULES } from '@/lib/studio-modules.mjs'
import { studioFieldLabel } from './StudioModuleEditor'
import StudioModuleIcon from './StudioModuleIcon'
import ConfirmStudioAction from './ConfirmStudioAction'

export default function StudioModuleList({ category, assistant, settings, no, onOpen, onAdd, onRemove }: {
  category: 'features' | 'knowledge' | 'personality'; assistant: ChatAssistantConfig; settings: ChatWidgetConfig['settings']; no: boolean;
  onOpen: (id: string) => void; onAdd: (id: string) => void; onRemove: (id: string) => Promise<boolean>;
}) {
  const [adding, setAdding] = useState(false)
  const active = getActiveStudioModules(assistant, settings)
  const modules = STUDIO_MODULES.filter(item => item.category === category && active.includes(item.id))
  const available = STUDIO_MODULES.filter(item => item.category === category && !active.includes(item.id))
  return <div className="studioModuleWorkspace">
    <div className="studioModuleListIntro"><div><span className="studioEyebrow">{no ? 'DINE MODULER' : 'YOUR MODULES'}</span><h2>{category === 'knowledge' ? (no ? 'Bedriften og kunnskapen' : 'Business and knowledge') : category === 'personality' ? (no ? 'Svarstil og regler' : 'Response style and rules') : (no ? 'Funksjoner i chatten' : 'Chat features')}</h2><p>{no ? 'Åpne en del for å fylle ut og lagre. Legg til det dere trenger med pluss.' : 'Open a module to configure and save it. Add what you need with the plus button.'}</p></div>{available.length > 0 && <button type="button" className="studioModuleAdd" aria-expanded={adding} aria-controls={'studio-module-catalog-' + category} onClick={() => setAdding(value => !value)}>{adding ? <FiX aria-hidden="true" /> : <FiPlus aria-hidden="true" />}<span>{no ? 'Legg til' : 'Add module'}</span></button>}</div>
    <div className="studioModuleLegend"><span><FiAlertCircle aria-hidden="true" />{no ? 'Rødt: mangler oppsett' : 'Red: setup needed'}</span><span><FiAlertTriangle aria-hidden="true" />{no ? 'Gult: kan brukes, men bør ses over' : 'Yellow: usable, review recommended'}</span></div>
    {adding && <div className="studioModuleCatalog" id={'studio-module-catalog-' + category}><h3>{no ? 'Hva vil du legge til?' : 'What would you like to add?'}</h3>{available.map(item => <button type="button" key={item.id} onClick={() => { onAdd(item.id); setAdding(false) }}><StudioModuleIcon id={item.id} small /><span><strong>{no ? item.no : item.en}</strong><small>{no ? item.hintNo : item.hintEn}</small></span></button>)}</div>}
    <div className="studioModuleRows">{modules.map(item => {
      const status = getStudioModuleStatus(item.id, assistant, settings)
      const StatusIcon = status.level === 'error' ? FiAlertCircle : status.level === 'warning' ? FiAlertTriangle : FiCheckCircle
      const description = status.level === 'error' ? (no ? 'Mangler: ' : 'Missing: ') + (status.required.length ? status.required.map(key => studioFieldLabel(key, no)).join(', ') : (no ? 'åpne og fullfør denne delen' : 'open and complete this module')) : status.level === 'warning' ? (no ? 'Kan brukes. ' : 'Usable. ') + (status.optional.length ? (no ? 'Valgfrie felt er tomme.' : 'Optional fields are empty.') : (no ? 'Se over standardvalgene.' : 'Review the defaults.')) : (no ? 'Nødvendig innhold er på plass.' : 'Required content is present.')
      return <div className="studioModuleRowShell" key={item.id}><button type="button" className="studioModuleRow" data-module={item.id} onClick={() => onOpen(item.id)}><StudioModuleIcon id={item.id} /><span className="studioModuleRowCopy"><strong>{no ? item.no : item.en}{item.mandatory && <small>{no ? 'Obligatorisk' : 'Required'}</small>}</strong><span>{no ? item.hintNo : item.hintEn}</span><small className={'studioModuleRowStatus studioModuleRowStatus--' + status.level}><StatusIcon aria-hidden="true" />{description}</small></span><FiChevronRight className="studioModuleRowArrow" aria-hidden="true" /></button>{!item.mandatory && <ConfirmStudioAction no={no} className="studioModuleListRemove" contextKey={item.id} aria-label={(no ? 'Fjern ' : 'Remove ') + (no ? item.no : item.en)} confirmLabel={no ? 'Fjern modulen' : 'Remove module'} message={(no ? 'Er du sikker på at du vil fjerne ' : 'Are you sure you want to remove ') + (no ? item.no : item.en) + '?'} onConfirm={() => onRemove(item.id)}><FiX aria-hidden="true" /><span>{no ? 'Fjern' : 'Remove'}</span></ConfirmStudioAction>}</div>
    })}</div>
    {!available.length && category !== 'personality' && <p className="studioModuleAllAdded">{no ? 'Alle tilgjengelige moduler i denne kategorien er lagt til.' : 'All available modules in this category have been added.'}</p>}
  </div>
}
