import type { StateCreator, StoreMutatorIdentifier } from 'zustand'

type LoggerImpl = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>

export const logger: LoggerImpl = (f, name = 'store') => (set, get, store) => {
  type T = ReturnType<typeof f>
  
  const loggedSet: typeof set = (...a) => {
    const before = get()
    console.group(`${name} - ${new Date().toLocaleTimeString()}`)
    console.log('Prev State:', before)
    console.log('Action:', a[0])
    
    const result = set(...a)
    const after = get()
    console.log('Next State:', after)
    console.groupEnd()
    
    return result
  }
  
  return f(loggedSet, get, store)
}
