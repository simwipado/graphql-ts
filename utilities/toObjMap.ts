import {
  ObjMap,
  ObjMapLike,
  ReadOnlyObjMap,
  ReadOnlyObjMapLike,
} from "./ObjMap.ts";

export function toObjMap<T>(obj: ObjMapLike<T>): ObjMap<T>;
export function toObjMap<T>(obj: ReadOnlyObjMapLike<T>): ReadOnlyObjMap<T>;
export default function toObjMap<T>(
  obj: ObjMapLike<T> | ReadOnlyObjMapLike<T>,
) {
  if (Object.getPrototypeOf(obj) === null) {
    return obj;
  }

  const map = Object.create(null);
  for (const [key, value] of Object.entries(obj)) {
    map[key] = value;
  }
  return map;
}
