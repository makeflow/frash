import {dependencyManager, idManager} from './@core';

export class Observable<T = any> {
  private id = idManager.generate('observable');

  private value: T;

  constructor(target: T) {
    if (Array.isArray(target)) {
      this.value = this.wrapArrayWithProxy(target);
    } else {
      this.value = target;
    }
  }

  get(): T {
    dependencyManager.collect(this.id);
    return this.value;
  }

  set(value: T): void {
    if (Array.isArray(value)) {
      this.wrapArrayWithProxy(value);
    } else {
      this.value = value;
    }

    dependencyManager.trigger(this.id);
  }

  trigger(): void {
    dependencyManager.trigger(this.id);
  }

  private wrapArrayWithProxy<A extends any[]>(target: A): A {
    return new Proxy(target, {
      set: (object, key, value) => {
        object[key as number] = value;

        if (key != 'length') {
          this.trigger();
        }

        return true;
      },
    });
  }
}

function makePropertyObservable(target: any, key: string): void {
  let observable = new Observable(target[key]);

  Object.defineProperty(target, key, {
    get: function() {
      return observable.get();
    },
    set: function(value) {
      return observable.set(value);
    },
  });

  let value = target[key];

  if (typeof value === 'object') {
    for (let childKey of Object.keys(value)) {
      if (!value.hasOwnProperty(childKey)) {
        continue;
      }

      makePropertyObservable(value, childKey);
    }
  }
}

export function extendObservable(target: any, extend: any): void {
  for (let key of Object.keys(extend)) {
    if (!extend.hasOwnProperty(key)) {
      continue;
    }

    target[key] = extend[key];
    makePropertyObservable(target, key);
  }
}

export function makeObservable(target: any): void {
  for (let key of Object.keys(target)) {
    if (!target.hasOwnProperty(key)) {
      continue;
    }

    makePropertyObservable(target, key);
  }
}
