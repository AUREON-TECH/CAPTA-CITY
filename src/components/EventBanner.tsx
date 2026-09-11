import { GLOBAL_EVENTS } from '../game/events'

type EventBannerProps = {
  eventIds: string[]
}

export default function EventBanner({ eventIds }: EventBannerProps) {
  const active = eventIds
    .map((id) => GLOBAL_EVENTS.find((event) => event.id === id))
    .filter((event): event is NonNullable<typeof event> => Boolean(event))

  if (active.length === 0) return null

  const current = active.at(-1)
  if (!current) return null

  return (
    <div className="event-banner" role="status" aria-live="polite">
      <span className="event-icon" aria-hidden="true">{current.emoji}</span>
      <div>
        <small>EVENTO DA CIDADE</small>
        <strong>{current.name}</strong>
        <p>{current.description}</p>
      </div>
    </div>
  )
}
