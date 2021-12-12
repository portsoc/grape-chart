export default class MultiMap<K, V> {
  theMap: Map<K, V[]>;

  constructor() {
    this.theMap = new Map();
  }

  keys(): IterableIterator<K> {
    return this.theMap.keys();
  }

  entries(): IterableIterator<[K, V[]]> {
    return this.theMap.entries();
  }

  [Symbol.iterator](): IterableIterator<[K, V[]]> {
    return this.entries();
  }

  has(key: K): boolean {
    return this.theMap.has(key);
  }

  get size(): number {
    return this.theMap.size;
  }

  push(key: K, value: V): void {
    const arr: V[] = this.theMap.get(key) || [];
    if (!this.theMap.has(key)) this.theMap.set(key, arr);
    arr.push(value);
  }

  get(key: K): ReadonlyArray<V> {
    return this.theMap.get(key) || [];
  }
}
