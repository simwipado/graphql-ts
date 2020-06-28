export type ObjMap<T> = {
  [key: string]: T;
};

export type ObjMapLike<T> = ObjMap<T> | {
  [key: string]: T;
};

export type ReadOnlyObjMap<T> = {
  [key: string]: T;
};

export type ReadOnlyObjMapLike<T> =
  | ReadOnlyObjMap<T>
  | { [key: string]: T };
