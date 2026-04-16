export const ROUTE_TRANSITION_EVENT = 'het:route-transition-start'

export function emitRouteTransitionStart() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(ROUTE_TRANSITION_EVENT))
}
