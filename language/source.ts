import devAssert from "../utilities/devAssert.ts";

interface Location {
  line: number;
  column: number;
}

/**
 * A representation of source input to GraphQL.
 * `name` and `locationOffset` are optional. They are useful for clients who
 * store GraphQL documents in source files; for example, if the GraphQL input
 * starts at line 40 in a file named Foo.graphql, it might be useful for name to
 * be "Foo.graphql" and location to be `{ line: 40, column: 0 }`.
 * line and column in locationOffset are 1-indexed
 */
export class Source {
  body: string;
  name: string;
  locationOffset: Location;

  constructor(
    body: string,
    name = "GraphQL request",
    locationOffset: Location = { line: 1, column: 1 },
  ) {
    this.body = body;
    this.name = name;
    this.locationOffset = locationOffset;
    devAssert(
      this.locationOffset.line > 0,
      "line in locationOffset is 1-indexed and must be positive.",
    );
    devAssert(
      this.locationOffset.column > 0,
      "column in locationOffset is 1-indexed and must be positive.",
    );
  }

  get [Symbol.toStringTag](): string {
    return "Source";
  }
}
